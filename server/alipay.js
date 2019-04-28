const debug = require("debug")("fta:alipay");
const Router = require("koa-router");
const render = require("../util/render");
const Account = require("../lib/account");
const {
  nextUser,
} = require("../lib/sitemap");
const {
  checkSession,
} = require("./middleware");

const router = new Router();

router.get("/done",
  checkSession(),

  async(ctx, next) => {
    const fromUrl = ctx.session.from;

    /**
     * @type {Account}
     */
    const account = ctx.state.user;

    const acntData = await account.fetch();

    ctx.state.user = new Account(acntData);
    ctx.state.redirectTo = fromUrl
      ? `${fromUrl}?subscribed=true`
      : nextUser.subs;

    ctx.body = await render("alipay-done.html", ctx.state);
  }
);

module.exports = router.routes();
