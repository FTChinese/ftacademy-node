const debug = require("debug")("fta:subs");
const Router = require("koa-router");
const QRCode = require("qrcode");
const render = require("../util/render");
const MobileDetect = require("mobile-detect");

const {
  Account,
} = require("../model/account");
const {
  Paywall,
} = require("../model/paywall");
const {
  clientApp,
  isLoggedIn,
} = require("./middleware");
const {
  sitemap,
} = require("../lib/sitemap");

const router = new Router();

/**
 * @description Show paywall.
 * /subscription
 */
router.get("/", async (ctx, next) => {
  debug("Session state: %O", ctx.session.state);

  const paywall = Paywall.getInstance();

  const paywallData = paywall.getPaywall();

  ctx.state.banner = paywallData.banner;
  ctx.state.products = paywallData.products;

  debug("Products: %O", ctx.state.products);

  ctx.body = await render("subscription.html", ctx.state);
});

/**
 * @description Show payment.
 * /subscription/{standard|premium}/{year|month}
 */
router.get("/:tier/:cycle", async (ctx, next) => {
  /**
   * @type {{tier: string, cycle: string}}
   */
  const params = ctx.params;
  const tier = params.tier;
  const cycle = params.cycle;

  const paywall = Paywall.getInstance();
  /**
   * @type {IPlan}
   */
  const plan = paywall.findPlan(tier, cycle);

  if (!plan) {
    ctx.status = 404;
    return;
  }

  if (!isLoggedIn(ctx)) {
    // Remeber which product user selected.
    ctx.session.product = {
      tier,
      cycle,
    }

    ctx.redirect(sitemap.login);
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

/**
 * @description Accept payment.
 * /subscription/{standard|premium}/{year|month}
 */
router.post("/:tier/:cycle",
  clientApp(),

  async (ctx, next) => {
    /**
     * @type {{tier: string, cycle: string}}
     */
    const params = ctx.params;
    const tier = params.tier;
    const cycle = params.cycle;
    debug("Tier: %s, cycle: %s", tier, cycle);

    /**
     * @type {"ailpay" | "wxpay"}
     */
    const payMethod = ctx.request.body.payMethod;

    const plan = Paywall.getInstance().findPlan(tier, cycle);

    debug("Plan: %O", plan);

    // If request url is not valid.
    if (!plan) {
      ctx.state = 404;
      return
    }

    // Detect device type.
    const md = new MobileDetect(ctx.header["user-agent"]);
    const isMobile = !!md.mobile();

    debug("Client app: %O", ctx.state.clientApp);
    const account = new Account(ctx.session.user, ctx.state.clientApp);

    try {
      switch (payMethod) {
        // Use user-agent to decide launch desktop web pay or mobile web pay
        case "alipay":
          // If user is using mobile browser on phone
          if (isMobile) {
            const aliOrder = await account.aliMobileOrder(tier, cycle);
            ctx.redirect(aliOrder.payUrl);
          } else {
            // Otherwise treat user on desktop
            const aliOrder = await account.aliDesktopOrder(tier, cycle);
            ctx.redirect(aliOrder.payUrl);
          }
          break;

        case "wechat":
        // NOTE: we cannot use wechat's MWEB and JSAPI payment due to the fact those two
        // methods could only be used by ftacademy.com
        // accoding to wechat's rule.
          /**
           * @type {{codeUrl: string}}
           */
          const wxPrepay = await account.wxDesktopOrder(tier, cycle);

          const dataUrl = await QRCode.toDataURL(wxPrepay.codeUrl);

          ctx.state.plan = plan;
          ctx.state.qrData = dataUrl;
          ctx.body = await render("wx-qr.html", ctx.state);
          break;

        default:
          ctx.state = 404;
          return;
      }
    } catch (e) {
      throw e;
    }
  }
);

module.exports = router.routes();
