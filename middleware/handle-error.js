const render = require('../util/render');
const debug = require('debug')("fta:errors");

module.exports = function() {
  return async function handleErrors (ctx, next) {
    try {
  // Catch all errors from downstream
      await next();
    } catch (e) {
      // Erros when fallthrough here when GETting to API. If there's a GETting error, it means no page could be shown execept here.

      debug("%O", e);

      if (e.response) {
        ctx.state.apiError = JSON.stringify(e.response.body, null, 4);

        ctx.state.status = e.status
      } else {
        ctx.state.error = {
          message: e.message,
          stack: e.stack,
        }
        ctx.state.status = e.status = 500;
      }

      ctx.status = ctx.state.status;
      ctx.body = await render('error.html', ctx.state);
    }
  }
};
