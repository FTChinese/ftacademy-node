const pkg = require('../package.json');
const debug = require("debug")("fta:subs");
const Router = require("koa-router");
const request = require("superagent");
const render = require("../util/render");
const {
  getPaywall,
  buildProducts,
  findPlan,
} = require("../model/paywall");
const {
  subsApi,
  clientHeaders,
  KEY_USER_ID,
} = require("../lib/request")

const router = new Router();

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

  /**
   * @type {IPlan}
   */
  const plan = findPlan(tier, cycle);

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
  if (!findPlan(tier,cycle)) {
    ctx.state = 404;
    return
  }

  const payMethod = ctx.request.body.paymentMethod;

  let apiUrl;
  switch (payMethod) {
    case "alipay":
      apiUrl = subsApi.alipay(tier, cycle);
      break;

    case "wxpay":
      apiUrl = subsApi.wxpay(tier, cycle);
      break;

    default:
      ctx.session.noPayMethod = true;
      ctx.redirect(ctx.path);
      return
  }

  try {
    const resp = await request.post(apiUrl)
      .set(KEY_USER_ID, ctx.session.user.id)
      .set(clientHeaders(ctx.ip, ctx.header["user-agent"]));

    ctx.body = resp.body;
  } catch(e) {
    throw e;
  }
});

module.exports = router.routes();
