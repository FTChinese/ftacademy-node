const Router = require('koa-router');
const debug = require('debug')('fta:callback');
const oauthClient = require("../lib/oauth-client");
const UserAccount = require("../lib/account");
const {
  sitemap,
} = require("../lib/sitemap");
const {
  isAPIError,
} = require("../lib/response");

const router = new Router();

/**
 * @description Handle callback
 *  /callback?code=xxx&state=xxx
 */
router.get('/', async function (ctx) {
  /**
   * @type {{code: string, state: string}}
   */
  const query = ctx.request.query;
  /**
   * @type {{v: string, t: number}}
   */
  const state = ctx.session.state;

  debug("Session state: %O", state);

  if (!query.state) {
    debug("Query paramter does not contain state");
    ctx.state = 404;
    ctx.body = "state missing";
    return;
  }

  if (query.state != state.v) {
    debug("state does not match");
    ctx.state = 404;
    ctx.body = "state mismached";
    return;
  }

  if (oauthClient.isStateExpired(state)) {
    ctx.state = 404;
    ctx.body = "session expired, please retry.";
    return;
  }

  if (!query.code) {
    debug("Query does not have code");
    ctx.state = 404;
    ctx.body = "code missing";
    return;
  }

  try {
    /**
     * @type {IOAuthToken}
     */
    const token = await oauthClient.requestToken(query.code);

    const account = await new UserAccount(token).fetch();

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
});

module.exports = router.routes();
