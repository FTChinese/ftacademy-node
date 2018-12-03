const debug = require("debug")('fta:check-login');

/**
 * @return {Function}
 */
function checkSession({redirect=true}={}) {
  return async (ctx, next) => {
    
    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    debug.info('Redirect: %s', redirect);

    if (isLoggedIn(ctx)) {
      debug.info('Session data: %O', ctx.session);

      /**
       * @type {UserSession}
       */
      const user = ctx.session.user;

      ctx.state.userAccount = user;

      debug.info('ctx.state: %O', ctx.state.userAccount);
      return await next();
    }

    ctx.state.user = null;

    if (redirect) {
      debug('User not logged in. Redirecting to %s', redirectTo);
  
      return ctx.redirect("/");
    }

    // Remember to let the following middleware to excute if users are not loggedin and you do not want to redirect away.
    return await next();
  }
}

function isLoggedIn(ctx) {
  if (ctx.session.isNew || !ctx.session.user) {
    return false
  }

  return true;
}

module.exports = checkSession;
