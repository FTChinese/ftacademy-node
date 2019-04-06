const Router = require('koa-router');
const debug = require('debug')('fta:login');
const {
  buildOAuthUrl,
} = require("../lib/request");
const router = new Router();

/**
 * @description Send authorization request to /authorize?response_type=code&client_id=xxxx&redirect_uri=xxx&state=xxx
 *
 */
router.get('/', async function (ctx) {
  ctx.body = await buildOAuthUrl();
});

module.exports = router.routes();
