const pkg = require('../package.json');
const debug = require("debug")("fta:subs");
const Router = require("koa-router");
const request = require("superagent");
const endpoints = require("../util/endpoints");
const render = require("../util/render");

/**
 * @type {Pricing}
 */
const defaultPlans = require("../model/default-plans.json");
/**
 * @type {Banner}
 */
const defaultBanner = require("../model/default-banner.json");
/**
 * @type {Product[]}
 */
const products = require("../model/products.json");
/**
 * @type {Promotion}
 */
const promotion = require("../model/promotion.json");

const { isInEffect } = require("../model/schedule");

const router = new Router();

const tiers = ["standard", "premium"];
const cycles = ["year", "month"];
const payMethods = {
  alipay: endpoints.alipay,
  wxpay: endpoints.wxpay,
};

// Show paywall.
router.get("/", async (ctx, next) => {

  const usePromo = promotion
    ? isInEffect(promotion.startAt, promotion.endAt)
    : false;

  /**
   * @type {Pricing}
   */
  const promoPlans = promotion.plans;

  ctx.state.banner = defaultBanner;
  ctx.state.products = products.map(product => {
    const tier = product.tier;
    /**
     * You can also use a map instead of array here.
     * See http://mozilla.github.io/nunjucks/templating.html#for
     * and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
     * for why Map is used here.
     * Map data:
     * "year" => {"origin": 198, "promo": 168}
     * "month" => {"origin": 28.00, "promo": null}
     * @type {PriceTag[]}
     */
    const prices = product.cycles.map(cycle => {
      const key = `${tier}_${cycle}`;
      /**
       * @type {PriceTag}
       */
      const priceTag = {
        cycle,
        original: defaultPlans[key].price,
      };

      if (usePromo) {
        /**
         * @type {Plan}
         */
        const promoPlan = promoPlans[key];

        if (!promoPlan.ignore) {
          priceTag.sale = promoPlans[key].price;
        }
      }

      return priceTag;
    });
    
    return Object.assign({prices}, product);
  });
  
  debug("Products: %O", ctx.state.products);

  ctx.body = await render("subscription.html", ctx.state);
});

// Show payment.
router.get("/:tier/:cycle", async (ctx, next) => {
  /**
   * @type {{tier: string, cycle: string}}
   */
  const params = ctx.params;
  const tier = params.tier;
  const cycle = params.cycle;

  const key = `${tier}_${cycle}`;

  const usePromo = promotion
    ? isInEffect(promotion.startAt, promotion.endAt)
    : false;

  debug(`Use promo: ${usePromo}`);

  const plans = usePromo
    ? promotion.plans
    : defaultPlans;

  if (!plans.hasOwnProperty(key)) {
    ctx.status = 404;
    return;
  }

  /**
   * @type {Plans}
   */
  ctx.state.plan = plans[key];

  if (ctx.session.noPayMethod) {
    ctx.state.errors = {
      payMethod: "请选择支付方式",
    };
  }

  ctx.body = await render("payment.html", ctx.state);

  delete ctx.session.noPayMethod;
});

// Accept payment.
router.post("/:tier/:cycle", async (ctx, next) => {
  /**
   * @type {{tier: string, cycle: string}}
   */
  const params = ctx.params;
  const tier = params.tier;
  const cycle = params.cycle;

  // If request url is not valid.
  const key = `${tier}_${cycle}`;
  if (!defaultPlans.hasOwnProperty(key)) {
    ctx.status = 404;
    return
  }

  const payMethod = ctx.request.body.paymentMethod;

  if (!payMethods.hasOwnProperty(payMethod)) {
    
    ctx.session.noPayMethod = true;

    ctx.redirect(ctx.path);
    return;
  }

  const url = payMethods[payMethod];

  try {
    const resp = await request.post(`${url}/${tier}/${cycle}`)
      .set({
        "X-User-Id": "",
        "X-Client-Type": "web",
        "X-Client-Version": pkg.version,
        "X-User-Agent": ctx.header["user-agent"],
        "X-User-Ip": ctx.ip,
      });

    ctx.body = resp.body;
  } catch(e) {
    throw e;
  }
});

module.exports = router.routes();