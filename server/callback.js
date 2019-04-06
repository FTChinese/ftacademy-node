const Router = require('koa-router');
const debug = require('debug')('fta:callback');
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
  if (!query.state) {
    ctx.state = 404;
    return;
  }

  if (query.state != state) {
    ctx.state = 404;
    return;
  }

  ctx.body = `query state: ${queyr.state}. Session state: ${state}`;

  delete ctx.session.state;
});

module.exports = router.routes();
