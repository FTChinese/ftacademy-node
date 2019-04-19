const debug = require("debug")("fta:subs");
const Router = require("koa-router");
const QRCode = require("qrcode");
const render = require("../util/render");
const MobileDetect = require("mobile-detect");
const UserAccount = require("../lib/account");
const {
  WxDetect,
  wxOAuthClient,
} = require("../lib/wx-oauth");

const {
  Paywall,
} = require("../model/paywall");
const {
  clientApp,
  checkLogin,
} = require("./middleware");

const router = new Router();

/**
 * @description Show paywall.
 * /subscription
 */
router.get("/",

  checkLogin({redirect: false}),

  async (ctx, next) => {
    debug("Session state: %O", ctx.session.state);

    const paywall = Paywall.getInstance();

    const paywallData = paywall.getPaywall();

    ctx.state.banner = paywallData.banner;
    ctx.state.products = paywallData.products;

    debug("Products: %O", ctx.state.products);

    ctx.body = await render("subscription.html", ctx.state);
  }
);

/**
 * @description Show payment.
 * /subscription/{standard|premium}/{year|month}
 */
router.get("/:tier/:cycle",
  async (ctx, next) => {
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

    ctx.state.plan = plan;
    ctx.state.product = {
      tier,
      cycle,
    };

    return await next();
  },

  checkLogin(),

  async (ctx) => {

    if (ctx.session.noPayMethod) {
      ctx.state.errors = {
        payMethod: "请选择支付方式",
      };
    }

    ctx.body = await render("payment.html", ctx.state);

    delete ctx.session.noPayMethod;
  }
);

/**
 * @description Accept payment.
 * /subscription/{standard|premium}/{year|month}
 */
router.post("/:tier/:cycle",

  checkLogin(),

  clientApp(),

  async (ctx) => {
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
    const ua = ctx.header["user-agent"];
    const md = new MobileDetect(ua);
    const isMobile = !!md.mobile();

    debug("Client app: %O", ctx.state.clientApp);

    const account = new UserAccount(ctx.session.user, ctx.state.clientApp);

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
          await handleWxPay();
          break;

        default:
          ctx.state = 404;
          return;
      }
    } catch (e) {
      throw e;
    }

    async function handleWxPay() {
      if (!isMobile) {
        debug("Not mobile platform");
        /**
         * @type {IWxQRPay}
         */
        const order = await account.wxDesktopOrder(tier, cycle);

        const dataUrl = await QRCode.toDataURL(order.codeUrl);

        ctx.state.plan = plan;
        ctx.state.qrData = dataUrl;
        ctx.body = await render("wx-qr.html", ctx.state);

        return;
      }

      const wxDetect = new WxDetect(ua).parse();

      debug("Detetcting wx user agent: %s", wxDetect.ua);
      debug("Browser parsed: %O", wxDetect.browser);

      if (!wxDetect.isWxBrowser()) {
        debug("A plain mobile browser");
        const order = await account.wxMobileOrder(tier, cycle);

        ctx.redirect(order.mWebUrl);

        return
      }

      if (!wxDetect.isPaySupported()) {
        ctx.body = "您的微信版本过低，不支持微信内支付。请前往FT中文网网站或者在其他浏览器中打开本页支付。";
        return;
      }

      const state = await wxOAuthClient.generateState();
      ctx.session.state = state;
      ctx.session.product = {
        tier,
        cycle,
      };

      ctx.redirect(wxOAuthClient.buildCodeUrl(state.v));
    }
  }
);

module.exports = router.routes();
