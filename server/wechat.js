const debug = require("debug")("fta:wx-oauth");
const Router = require("koa-router");
const render = require("../util/render");
const {
  wxOAuthClient,
} = require("../lib/wx-oauth");
const Account = require("../lib/account");
const {
  isAPIError,
} = require("../lib/response");
const {
  Viper,
} = require("../lib/config");
const {
  clientApp,
  checkSession,
} = require("./middleware");

const router = new Router();

/**
 * @description Wechat oauth callback for scope=snsapi_base
 * /wx/oauth2/callback
 */
router.get("/oauth2/callback",
  checkSession(),

  clientApp(),

  async(ctx, next) => {
    /**
     * This part is only used to test UI.
     */
    // ctx.state.plan = {
    //   "tier": "standard",
    //   "cycle": "month",
    //   "listPrice": 28,
    //   "netPrice": 28,
    // };

    // ctx.state.order = {
    //     "ftcOrderId": "FTF2B16619766893C1",
    //     "listPrice": 258,
    //     "netPrice": 258,
    //     "appId": "wxa8e66ab05d5e212b",
    //     "timestamp": "1555749500",
    //     "nonce": "b8dd4e56359290727b16",
    //     "pkg": "prepay_id=wx2016382081882383ec69c9022703105332",
    //     "signature": "1F20C6C23E4805D9E3C3BB4459CFACA4",
    //     "signType": "MD5"
    // };

    // ctx.session.subs = {
    //   "tier": "standard",
    //   "cycle": "month",
    //   "listPrice": 28,
    //   "netPrice": 28,
    //   "orderId": "FTF2B16619766893C1",
    //   "appId": Viper.getInstance().getWxAppForJSAPI().app_id,
    // }

    // ctx.body = await render("wx-embedded.html", ctx.state);
    // return;

    /**
     * @type {code: string, state: string}
     */
    const query = ctx.request.query;
    debug("OAuth code response: %O", query);

    // Validate OAuth 2 code response.
    if (!query.state) {
      debug("Query paramter does not contain state");
      ctx.state.invalid = {
        error_description: "无效的响应: state 参数缺失"
      };

      return await next();
    }

    /**
     * @type {{v: string, t: number}}
     */
    const state = ctx.session.state;

    if (!state || (query.state != state.v)) {
      debug("state does not match");
      ctx.state.invalid = {
        error_description: "无效的响应: state 不匹配"
      };

      return await next();
    }

    if (wxOAuthClient.isStateExpired(state)) {
      ctx.state.invalid = {
        error_description: "无效的响应: state 已过期"
      }

      delete ctx.session.state;
      return await next();
    }

    if (!query.code) {
      debug("Query does not have code");
      ctx.state.invalid = {
        error_description: "无效的响应: code 参数缺失"
      }

      return await next();
    }

    /**
     * @description Find out which product user selected.
     * @type {IPlan}
     */
    const plan = ctx.session.plan;

    if (!plan) {
      ctx.status = 404;
      ctx.body = "Unknow product";
      ctx.state.invalid = {
        error_description: "选择的产品未知"
      }
      return await next();
    }

    // Use code to change for access token.
    const token = await wxOAuthClient.getAccessToken(query.code);

    debug("Wx oauth token: %O", token);

    /**
     * @type {Account}
     */
    const account = ctx.state.user;

    try {
      const order = await account
        .setClient(ctx.state.clientApp)
        .wxBrowserOrder({
          tier: plan.tier,
          cycle: plan.cycle,
          openId: token.openid,
        });

      debug("Order for wx browser: %O", order);

      /**
       * @type {ISubsOrder}
       */
      const subsOrder = {
        tier: plan.tier,
        cycle: plan.cycle,
        listPrice: order.listPrice,
        netPrice: order.netPrice,
        orderId: order.ftcOrderId,
        appId: order.appId,
        payMethod: "wechat",
      };

      ctx.state.plan = plan;
      ctx.state.order = order;

      ctx.session.subs = subsOrder;

      ctx.body = await render("wx-embedded.html", ctx.state);

      delete ctx.session.state;
      delete ctx.session.plan;

    } catch (e) {
      debug("%O", e);

      if (!isAPIError(e)) {
        ctx.state.invalid = {
          error_description: e.message,
        };

        return await next();
      }

      const body = e.response.body;

      ctx.state.invalid = {
        error_description: body.message,
      };

      return await next();
    }
  },

  async (ctx) => {
    ctx.body = await render("oauth-callback.html", ctx.state);

    delete ctx.session.state;
  }
);

module.exports = router.routes();
