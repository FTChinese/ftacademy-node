const Router = require('koa-router');
const debug = require('debug')('fta:callback');
const oauthClient = require("../lib/oauth-client");
const {
  sitemap,
} = require("../lib/sitemap");
const {
  isAPIError,
} = require("../lib/response");
const render = require("../util/render");

const router = new Router();

/**
 * @description Handle callback
 *  /callback?code=xxx&state=xxx
 */
router.get('/', async function (ctx, next) {
  /**
   * @type {{code: string, state: string, error: string}}
   */
  const query = ctx.request.query;

  if (query.error) {
    ctx.state.invalid = query;
    ctx.body = await render("oauth-callback.html", ctx.state);
    return;
  }
  /**
   * @type {{v: string, t: number}}
   */
  const state = ctx.session.state;

  debug("Session state: %O", state);

  if (!query.state) {
    debug("Query paramter does not contain state");
    ctx.state.invalid = {
      error_description: "无效的响应: state 参数缺失"
    };

    return await next();
  }

  if (query.state != state.v) {
    debug("state does not match");
    ctx.state.invalid = {
      error_description: "无效的响应: state 不匹配"
    };

    return await next();
  }

  if (oauthClient.isStateExpired(state)) {
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

  try {
    /**
     * @type {IOAuthToken}
     */
    const token = await oauthClient.requestToken(query.code);

    const account = await oauthClient.fetchAccount(token);

    ctx.session.user = account;

    /**
     * @type {{tier: string, cycle: string}}
     */
    const product = ctx.session.product;
    if (!product) {
      ctx.redirect(sitemap.home);
    } else {
      ctx.redirect(sitemap.pay(product.tier, product.cycle));
    }

    delete ctx.session.product;
    delete ctx.session.state;
  } catch (e) {
    if (!isAPIError(e)) {
      throw e;
    }

    /**
     * @type {IAPIError}
     */
    const body = e.response.body;

    /**
     * @todo handle api response of 404.
     */
    switch (e.status) {
      // error.field: authorization
      // error.code: invalid_client
      case 401:
        ctx.body = body;
        break;

      // If grant_type is empty, or is not authorization_code:
      // error.field: grant_type
      // error.code: invalid_request
      //
      // If code is empty:
      // error.field: code
      // error.code: invalid_request
      //
      // If redirect_uri is empty:
      // error.field: redirect_uri
      // error.code: invalid_request
      //
      // If client credentials does not match, or client credentials are missing:
      // error.field: authorization
      // error.code: invalid_client
      case 422:
        ctx.body = body;
        break;

      default:
        ctx.body = body;
        break;
    }
  }
}, async (ctx) => {
  ctx.body = await render("oauth-callback.html", ctx.state);
});

module.exports = router.routes();
