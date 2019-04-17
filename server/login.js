const Router = require('koa-router');
const debug = require('debug')('fta:login');
const oauthClient = require("../lib/oauth-client");
const router = new Router();

/**
 * @description Send authorization request to /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx
 *
 */
router.get('/', async function (ctx) {
  const state = await oauthClient.generateState();

  debug("OAuth state: %s", state);

  ctx.session.state = state;

  const redirectTo = oauthClient.buildCodeUrl(state.v);

  debug("Redirect to %s", redirectTo);

  ctx.redirect(redirectTo);
});

module.exports = router.routes();
