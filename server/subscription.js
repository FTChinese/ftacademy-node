const debug = require("debug")("fta:subs");
const Router = require("koa-router");
const {
  URL,
} = require("url");
const QRCode = require("qrcode");
const render = require("../util/render");
const MobileDetect = require("mobile-detect");
const Account = require("../lib/account");
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
      debug("Accessed from %s", quer.from);
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

    ctx.body = await render("pay-method.html", ctx.state);

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

    /**
     * @type {Account}
     */
    const account = ctx.state.user;
    account.setClient(ctx.state.clientApp);

    try {
      switch (payMethod) {
        // Use user-agent to decide launch desktop web pay or mobile web pay
        case "alipay":
          /**
           * If user is using mobile browser on phone
           * @todo Handle redirect after payment.
           */
          if (isMobile) {
            // User will be redirect to /pay/ali/done after paid.
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
          ctx.status = 404;
          return;
      }
    } catch (e) {
      throw e;
    }

    async function handleWxPay() {

      /**
       * Wechat pay in desktop browser
       */
      if (!isMobile) {
        debug("Not mobile platform");
        /**
         * @type {IWxQRPay}
         */
        const order = await account.wxDesktopOrder(tier, cycle);

        /**
         * @type {ISubsOrder}
         */
        const subsOrder = {
          tier,
          cycle,
          listPrice: order.listPrice,
          netPrice: order.netPrice,
          orderId: order.ftcOrderId,
          appId: order.appId,
          payMethod: "wechat",
        };

        const dataUrl = await QRCode.toDataURL(order.codeUrl);

        ctx.state.plan = subsOrder;
        ctx.state.qrData = dataUrl;

        // Store order to session for later query.
        ctx.session.subs = subsOrder;

        ctx.body = await render("wx-qr.html", ctx.state);

        return;
      }

      const wxDetect = new WxDetect(ua).parse();

      debug("Is wx browser: %O", wxDetect.browser);

      /**
       * Wechat pay in mobile browser.
       */
      if (!wxDetect.isWxBrowser()) {
        debug("A plain mobile browser");

        const order = await account.wxMobileOrder(tier, cycle);

        /**
         * @type {ISubsOrder}
         */
        const subsOrder = {
          tier,
          cycle,
          listPrice: order.listPrice,
          netPrice: order.netPrice,
          orderId: order.ftcOrderId,
          appId: order.appId,
          payMethod: "wechat",
        }

        debug("Subs order for session: %O", subsOrder);

        // Store order data to session so that it could be used by /pay/wx/mobile and /pay/wx/done.
        ctx.session.subs = subsOrder;

        const redirectUrl = new URL(order.mWebUrl);
        const params = redirectUrl.searchParams;
        /**
         * NOTE how the redirect_url is used by wechat:
         * The moment you redirect user to this page,
         * wechat will redirect back the the `redirect_url`, even before Wechat app is called.
         * The `redirect_url` should not be /pay/wx/done since the moment the page loads, it will start querying order while the user might not pay yet.
         * The `redirect_url` should be one similar to showing QR code, presenting a link to let user to click after payment finished.
         */
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

      /**
       * Wechat pay inside its embedded browser.
       */
      const state = await wxOAuthClient.generateState();
      ctx.session.state = state;
      // ctx.session.product = {
      //   tier,
      //   cycle,
      // };

      // After OAuth redirect, which product user
      // selected will be unknown unless we save
      // it somewhere.
      // ctx.session.subs = {
      //   tier,
      //   cycle,
      //   payMethod: "wechat",
      // }
      // Amid OAuth jumping back and forth the information on which product user selected will be lost. Save such data in session.
      ctx.session.plan = plan;

      // Go through the wechat OAuth workflow to
      // to obtain user's open id.
      // After obating open id, the payment is handle
      // in server/wechat.js's /oauth2/callback
      ctx.redirect(wxOAuthClient.buildCodeUrl(state.v));
    }
  }
);

module.exports = router.routes();
