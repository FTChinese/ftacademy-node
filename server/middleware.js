const debug = require("debug")("fta:middleware");
const {
  isProduction,
  isSandbox,
} = require("../lib/config")
const pkg = require("../package.json");
const {
  matrix,
} = require("../model/footer");
const {
  sitemap,
  nextUser,
} = require("../lib/sitemap");
const Account = require("../lib/account");
const {
  isAPIError,
} = require("../lib/response");

const render = require("../util/render");

exports.env = function () {
  return async (ctx, next) => {

    ctx.state.env = {
      isOnline: isProduction || isSandbox,
      isSandbox,
      year: new Date().getFullYear(),
      footer: matrix,
      version: pkg.version,
    };

    ctx.state.sitemap = sitemap;
    ctx.state.nextUser = nextUser;

    await next();
  }
};

/**
 * checkLogin - This middleware will add userinfo to ctx.state
 *
 * `redirect` is used to pages that want to use user session data but do not need to redirect.
 * In inifinite loop will occur if you use `redirect=true` indiscrimnately on all path.
 * Suppose you want to access `/profile` without login. This middleware will redirect you want to `/login`. And then when you are accessing `/login`, this middleware will again first check if you're loggedin. Certainly your are not. It again redirect you to `/login`, check login state again and redirect you to `/login`, indefinitely.
 * @return {Function}
 */
exports.checkSession = function ({redirect=true}={}) {
  return async (ctx, next) => {

    // Do nothing for `/favicon.ico`
    if (ctx.path == '/favicon.ico') return;

    if (isLoggedIn(ctx)) {
      /**
       * @type {IAccount}
       */
      const acntData = ctx.session.user;
      ctx.state.user = new Account(acntData);

      return await next();
    }

    ctx.state.user = null;

    // Remeber which product user selected.
    if (ctx.state.product) {
      ctx.session.product = ctx.state.product;
    } else {
      delete ctx.session.product;
    }

    // Remember to let the following middleware to excute if users are not loggedin and you do not want to redirect away.
    if (redirect) {
      return ctx.redirect(sitemap.login);
    }

    return await next();
  }
}

function isLoggedIn(ctx) {
  if (ctx.session.isNew || !ctx.session.user) {
    return false
  }

  return true;
}

exports.handleErrors = function() {
  return async function handleErrors (ctx, next) {
    try {
  // Catch all errors from downstream
      await next();
    } catch (e) {

      debug("%O", e);

      ctx.state.error = {
        status: e.status || 500,
        stack: e.stack
      }

      if (isAPIError(e)) {
        ctx.state.error.message = e.response.body.message
      } else {
        ctx.state.error.message = e.message || 'Internal Server Error'
      }

      ctx.status = ctx.state.error.status;
      ctx.body = await render('error.html', ctx.state);
    }
  }
};

exports.noCache = function() {
  return async function(ctx, next) {
    await next();
    ctx.set('Cache-Control', ['no-cache', 'no-store', 'must-revalidte']);
    ctx.set('Pragma', 'no-cache');
  }
};

exports.clientApp = function() {
  return async function(ctx, next) {
    ctx.state.clientApp = {
      "X-Client-Type": "web",
      "X-Client-Version": pkg.version,
      "X-User-Ip": ctx.ip,
      "X-User-Agent": ctx.header["user-agent"],
    };

    await next();
  }
}

exports.isLoggedIn = isLoggedIn;
