const pkg = require('../package.json');
const debug = require("debug")("fta:subs");
const Router = require("koa-router");
const request = require("superagent");
const endpoints = require("../util/endpoints");
const render = require("../util/render");
const {
  getPaywall,
  buildProducts,
} = require("../model/paywall");

const router = new Router();

const tiers = ["standard", "premium"];
const cycles = ["year", "month"];
const payMethods = {
  alipay: endpoints.alipay,
  wxpay: endpoints.wxpay,
};

// Show paywall.
router.get("/", async (ctx, next) => {
  const paywall = getPaywall();

  ctx.state.banner = paywall.banner;
  ctx.state.products = buildProducts(paywall.plans);

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

  const paywall = getPaywall();

  /**
   * @type {IPlan}
   */
  const plan = paywall.plans[key];

  if (!plans) {
    ctx.status = 404;
    return;
  }

  ctx.state.plan = plan

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
