const debug = require("debug")("fta:wx-oauth");
const Router = require("koa-router");
const render = require("../util/render");
const {
  WxDetect,
  wxOAuthClient,
} = require("../lib/wx-oauth");
const UserAccount = require("../lib/account");
const {
  isAPIError,
} = require("../lib/response");
const {
  clientApp,
  checkLogin,
} = require("./middleware");

const router = new Router();

/**
 * @description Wechat oauth callback
 * /wxoauth/callback
 */
router.get("/callback",

  clientApp(),

  async(ctx, next) => {
    /**
     * @type {code: string, state: string}
     */
    const query = ctx.request.query;
    debug("OAuth code response: %O", query);

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
     * @type {{tier: "standard" | "premium", cycle: "year" | "month" }}
     */
    const product = ctx.session.product;
    debug("Product: %O", product);

    if (!product) {
      ctx.status = 404;
      ctx.body = "Unknow product";
      ctx.state.invalid = {
        error_description: "选择的产品未知"
      }
      return await next();
    }

    const token = await wxOAuthClient.getAccessToken(query.code);

    debug("Wx oauth token: %O", token);

    const account = new UserAccount(ctx.session.user, ctx.state.clientApp);

    try {
      const order = await account.wxBrowserOrder({
        tier: "",
        cycle: "",
        openId: token.openid,
      });

      debug("Order for wx in-housr browser: %O", order);

      ctx.state.order = order;

      ctx.body = await render("wxoauth-callback.html", ctx.state);

      delete ctx.session.product;
      delete ctx.session.state;

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

    delete ctx.session.product;
    delete ctx.session.state;
  }
);

module.exports = router.routes();
