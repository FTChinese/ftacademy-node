const Router = require("koa-router");
const request = require("superagent");
const endpoints = require("../util/endpoints");
const render = require("../util/render");

const defaultPlans = require("../model/default-plans.json");
const defaultBarrier = require("../model/default-barrier.json");
const deafultProducts = require("../model/default-products.json");
const promotion = require("../model/promotion.json");
const localized = require("../model/localized.json");

const router = new Router();

const tiers = ["standard", "premium"];
const cycles = ["year", "month"];

router.get("/", async (ctx, next) => {

  const promoPlans = promotion.plans;

  ctx.state.barrier = defaultBarrier;
  ctx.state.products = deafultProducts.map(product => {
    const tier = product.tier;
    /**
     * See http://mozilla.github.io/nunjucks/templating.html#for
     * and https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
     * for why Map is used here.
     * Map data:
     * "year" => {"origin": 198.00, "promo": 168.00}
     * "month" => {"origin": 28.00, "promo": null}
     * Each product should have a deeply nested field:
     * prices: {
     *  year: {
     *    origin: 198.00,
     *    promo: 168.00
     *  },
     *  month: {
     *    origin: 28.00,
     *    promo: null
     *  }
     * }
     */
    const prices = new Map();

    for (const cycle of product.cycles) {
      const key = `${tier}_${cycle}`;
      const defaultPrice = defaultPlans[key].price;
      const promoPrice = promoPlans[key] ? promoPlans[key].price : null;

      prices.set(cycle, {
        origin: defaultPrice,
        promo: promoPrice,
      });
    }
    return Object.assign({prices}, product);
  });

  ctx.state.localized = localized;
  
  console.log(ctx.state);

  ctx.body = await render("subscription.html", ctx.state);
});

router.get("/:tier/:cycle", async (ctx, next) => {
  /**
   * @type {{tier: string, cycle: string}}
   */
  const params = ctx.params;
  const tier = params.tier;
  const cycle = params.cycle;

  const key = `${tier}_${cycle}`;

  if (!defaultPlans.hasOwnProperty(key)) {
    ctx.status = 404;
    return;
  }

  try {
    const resp = await request.get(`${endpoints.plans}`);

    const plans = resp.body;

    /**
     * @type {{tier: string, cycle: string, price: number}}
     */
    const plan = plans[key];
    ctx.state.plan = {
      tier: localized[plan.tier],
      cycle: localized[plan.cycle],
      charge: plan.price,
    };
  
    ctx.body = await render("payment.html", ctx.state);
  } catch (e) {
    console.error(e);
    /**
     * @type {{tier: string, cycle: string, price: number}}
     */
    const plan = defaultPlans[key];
    ctx.state.plan = {
      tier: localized[plan.tier],
      cycle: localized[plan.cycle],
      charge: plan.price,
    };

    ctx.body = await render("payment.html", ctx.state);
  }
});

router.post("/:tier/:cycle", async (ctx, next) => {
  /**
   * @type {{tier: string, cycle: string}}
   */
  const params = ctx.params;
  const paymentMethod = ctx.request.body.paymentMethod;

  ctx.body = paymentMethod;
});

module.exports = router.routes();