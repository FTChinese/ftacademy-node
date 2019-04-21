const debug = require("debug")("fta:wx-oauth");
const {
  URL,
  URLSearchParams,
} = require("url");
const Router = require("koa-router");
const render = require("../util/render");
const {
  wxOAuthClient,
} = require("../lib/wx-oauth");
const UserAccount = require("../lib/account");
const {
  isAPIError,
} = require("../lib/response");
const {
  nextUser
} = require("../lib/sitemap");
const {
  clientApp,
  checkLogin,
} = require("./middleware");

const router = new Router();

/**
 * @description Transfer authrozaition code response.
 * /wx/oauth2/connecting
 */
router.get("/oauth2/connecting", async(ctx, next) => {
  /**
   * @type {{code: string, state: string}}
   */
  const query = ctx.request.query;
  if (!query.state) {
    ctx.status = 404;
    return
  }

  if (!query.code) {
    ctx.redirect(`${nextUser.wxCallback}?error=access_denied`);
    return;
  }

  const params = new URLSearchParams();
  params.set("code", query.code);
  params.set("state", query.state);
  ctx.redirect(`${nextuser.wxCallback}?${params.toString()}`);
});

/**
 * @description Wechat oauth callback
 * /wx/oauth2/callback
 */
router.get("/oauth2/callback",
  // checkLogin(),

  clientApp(),

  async(ctx, next) => {
    const fromUrl = ctx.session.from;

    /**
     * This part is only used to test UI.
     */
    // ctx.state.product = {
    //   tier: "standard",
    //   cycle: "month",
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

    // ctx.state.redirectTo = fromUrl ? fromUrl : sitemap.subs;

    // ctx.body = await render("wxoauth-callback.html", ctx.state);
    // return;

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
        tier: product.tier,
        cycle: product.cycle,
        openId: token.openid,
      });

      debug("Order for wx in-housr browser: %O", order);

      ctx.state.product = product;
      ctx.state.order = order;
      ctx.state.redirectTo = fromUrl ? fromUrl : nextUser.subs;

      ctx.body = await render("wxoauth-callback.html", ctx.state);

      delete ctx.session.product;
      delete ctx.session.state;
      delete ctx.session.from;

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
