const debug = require("debug")("fta:subs");
const Router = require("koa-router");
const {
  URL,
} = require("url");
const QRCode = require("qrcode");
const render = require("../util/render");
const MobileDetect = require("mobile-detect");
const UserAccount = require("../lib/account");
const {
  WxDetect,
  wxOAuthClient,
} = require("../lib/wx-oauth");
const {
  ftaExternal,
} = require("../lib/sitemap");

const {
  paywall
} = require("../model/paywall");
const {
  clientApp,
  checkSession,
} = require("./middleware");

const router = new Router();

/**
 * @description Show paywall.
 * If query parameter `from` is present, it indicates user is redirected from a url.
 * Rememeber this url and redirect user back after
 * payment finished.
 * /subscription
 */
router.get("/",

  checkSession({redirect: false}),

  async (ctx) => {
    /**
     * @type {{from?: string}}
     */
    const query = ctx.request.query;
    if (query.from) {
      ctx.session.from = query.from;
    }

    const paywallData = paywall.getPaywall();

    ctx.state.banner = paywallData.banner;
    ctx.state.products = paywallData.products;

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

    /**
     * @type {IPlan}
     */
    const plan = paywall.findPlan(tier, cycle);

    if (!plan) {
      ctx.status = 404;
      return;
    }

    ctx.state.plan = plan;

    // If user is not logged in, redirect user to go
    // through OAuth 2 workflow. After user authenticated,
    // ctx.session.product is used to redirect user to payment page;
    // if this ctx.session.product is not set, user will be go back to this page again.
    ctx.state.product = {
      tier,
      cycle,
    };

    return await next();
  },

  checkSession(),

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

  checkSession(),

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

    const plan = paywall.findPlan(tier, cycle);

    // If request url is not valid.
    if (!plan) {
      ctx.state = 404;
      return
    }

    // Detect device type.
    const ua = ctx.header["user-agent"];
    const md = new MobileDetect(ua);
    const isMobile = !!md.mobile();

    const account = new UserAccount(ctx.session.user, ctx.state.clientApp);

    try {
      switch (payMethod) {
        // Use user-agent to decide launch desktop web pay or mobile web pay
        case "alipay":
          /**
           * If user is using mobile browser on phone
           * @todo Handle redirect after payment.
           */
          if (isMobile) {
            const aliOrder = await account.aliMobileOrder(tier, cycle);

            ctx.session.subs = {
              orderId: aliOrder.ftcOrderId,
              tier,
              cycle,
              listPrice: aliOrder.listPrice,
              netPrice: aliOrder.netPrice,
              payMethod: "alipay",
            };

            ctx.redirect(aliOrder.payUrl);
          } else {
            // Otherwise treat user on desktop
            const aliOrder = await account.aliDesktopOrder(tier, cycle);

            ctx.session.subs = {
              orderId: aliOrder.ftcOrderId,
              tier,
              cycle,
              listPrice: aliOrder.listPrice,
              netPrice: aliOrder.netPrice,
              payMethod: "alipay",
            };

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

        // Store order to session for later query.
        ctx.session.subs = {
          orderId: order.ftcOrderId,
          tier,
          cycle,
          listPrice: order.listPrice,
          netPrice: order.netPrice,
          appId: order.appId,
          payMethod: "wechat",
        }

        ctx.body = await render("wx-qr.html", ctx.state);

        return;
      }

      const wxDetect = new WxDetect(ua).parse();

      debug("Detetcting wx user agent: %s", wxDetect.ua);
      debug("Browser parsed: %O", wxDetect.browser);

      if (!wxDetect.isWxBrowser()) {
        debug("A plain mobile browser");
        const order = await account.wxMobileOrder(tier, cycle);

        // Store session.
        ctx.session.subs = {
          orderId: order.ftcOrderId,
          tier,
          cycle,
          listPrice: order.listPrice,
          netPrice: order.netPrice,
          appId: order.appId,
          payMethod: "wechat",
        }

        const redirectUrl = new URL(order.mWebUrl);
        const params = redirectUrl.searchParams;
        params.set("redirect_url", ftaExternal.wxpayRedirectUrl);

        redirectUrl.search = params.toString();

        debug("Wechat mobile browser redirect to: %s", redirectUrl.href);

        ctx.redirect(redirectUrl.href);

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

      // After OAuth redirect, which product user
      // selected will not be known unless we save
      // it somewhere.
      ctx.session.subs = {
        tier,
        cycle,
        payMethod: "wechat",
      }

      // Go through the wechat OAuth workflow to
      // to obtain user's open id.
      ctx.redirect(wxOAuthClient.buildCodeUrl(state.v));
    }
  }
);

module.exports = router.routes();
