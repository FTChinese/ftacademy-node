const Router = require('koa-router');
const debug = require('debug')('fta:callback');
const {
  oauthClient,
  UserAccount,
} = require("../lib/request");
const {
  sitemap,
} = require("../lib/sitemap");
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
  const state = ctx.session.state;

  debug("Query state: %s. Session state: %s", query.state, state);

  if (!query.state) {
    debug("Query paramter does not contain state");
    ctx.state = 404;
    return;
  }

  if (query.state != state) {
    debug("state does not match");
    ctx.state = 404;
    return;
  }

  if (!query.code) {
    debug("Query does not have code");
    ctx.state = 404;
    return;
  }

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
});

module.exports = router.routes();
