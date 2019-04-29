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
const {
  ClientError,
} = require("../lib/response");

const router = new Router();

/**
 * @descritpion The return_url of alipay for browser, both desktop and mobile.
 * GET /pay/done/ali
 */
router.get("/ali/done",
  checkSession(),

  async(ctx) => {
    /**
     * @type {ISubsOrder}
     */
    const subsOrder = ctx.session.subs;

    debug("Sub order from session: %O", subsOrder);

    /**
     * @type {string}
     */
    const fromUrl = ctx.session.from;
    debug("From url: %s", fromUrl);

    /**
     * @type {Account}
     */
    const account = ctx.state.user;

    const acntData = await account.fetch();

    ctx.state.user = new Account(acntData);
    ctx.state.redirectTo = fromUrl
      ? `${fromUrl}?subscribed=true`
      : nextUser.subs;

    ctx.state.subs = subsOrder;

    ctx.body = await render("alipay-done.html", ctx.state);

    delete ctx.session.subs;
    delete ctx.session.from;
  }
);

/**
 * @description The redirect_url of wechat for mobile browser only.
 * Desktop payment could redirect user here.
 * GET /pay/done/wx
 */
router.get("/wx/done",
  checkSession(),

  async(ctx, next) => {
    /**
     * @type {ISubsOrder}
     */
    const subsOrder = ctx.session.subs;

    debug("Subs order from session: %O", subsOrder);

    // If users jumped to this site from somewhere else, like in the middle of reading an article,
    // redirec them back after payment finished.
    const fromUrl = ctx.session.from;
    debug("From url: %s", fromUrl);

    // Show redirect URL.
    ctx.state.redirectTo = fromUrl
      ? `${fromUrl}?subscribed=true`
      : nextUser.subs;

    /**
     * @type {Account}
     */
    const account = ctx.state.user;

    try {
      if (subsOrder) {
        const payResult = await account.wxOrderQuery(subsOrder.orderId);

        ctx.state.result = payResult;
      }
    } catch (e) {
      const clientErr = new ClientError(e);

      if (!clientErr.isFromAPI()) {
        throw e;
      }

      switch (e.status) {
        case 404:
          break;

        default:
          ctx.state.errors = clientErr.buildGenericError();
          break;
      }
    }

    // ctx.state.result = {
    //   "paymentState": "SUCCESS",
    //   "paymentStateDesc": "支付成功",
    //   "totalFee": 1,
    //   "transactionId": "4200000252201903069440709666",
    //   "ftcOrderId": "FT1D3CEDDB2599EFB9",
    //   "paidAt": "2019-03-06T07:21:18Z"
    // };

    ctx.body = await render("wxpay-done.html", ctx.state);

    delete ctx.session.subs;
    delete ctx.session.from;
  }
);


module.exports = router.routes();
