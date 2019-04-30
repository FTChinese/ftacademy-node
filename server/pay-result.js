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
const {
  isDev,
} = require("../lib/config");

const router = new Router();

/**
 * @descritpion The return_url of alipay for browser, both desktop and mobile.
 * GET /pay/done/ali
 */
router.get("/ali/done",
  checkSession(),

  async(ctx) => {
    /**
     * @type {{charset: string, out_trade_no: string, method: string, total_amount: string, sign: string, trade_no: string, auth_app_id: string, version; string, app_id: string, sign_type: string, seller_id: string, timestamp: string}}
     * @example {
charset: 'utf-8',
out_trade_no: 'FTB32D1833FECF93D1',
method: 'alipay.trade.page.pay.return',
total_amount: '0.01',
sign: 'ko39MMITcx8nNevyfBsKoDN/Sizr5GdVqIM+pzH26VkJ6I3/QBVlviLIjWsRat96HBAVjb/L4E38EIdiUJI10Ii9CH9g//Inm665DIMH2VRveEF3orV51MJ90TnrgkuO1l4nVbt6fQ9fInwW3QYjlTG78yV/Hs5yICN/SzUg92Oj1Vi46Ow4UT/I750sGUIqcKq363QpfU9ZlJGB0Ay+DfnOepqdD5F+F8SBXbbxsAfyXLivQRLyl9f7SD473eSV0WKcsbk3cTBijPgqgSPGQ98rNg0b6j1sBiiOpMb3YwwZmJROjPwN3JkmiMWRdKBD2lRljVIiDoK+BiBiNPkvXQ==',
trade_no: 'xxxxxxx',
auth_app_id: 'xxxxxxxx',
version: '1.0',
app_id: 'xxxxxx',
sign_type: 'RSA2',
seller_id: 'xxxxxxx',
timestamp: '2019-04-30 10:11:07' }
     */
    const query = ctx.request.query;
    debug("Alipay finished: %O", query);

    /**
     * @type {ISubsOrder}
     */
    const subsOrder = ctx.session.subs;

    debug("Sub order from session: %O", subsOrder);

    /**
     * @type {string} - redirect user back to where they come from.
     */
    const fromUrl = ctx.session.from;
    debug("From url: %s", fromUrl);

    /**
     * @type {Account}
     */
    const account = ctx.state.user;

    const acntData = await account.fetch();

    ctx.state.user = new Account(acntData);

    ctx.state.subs = subsOrder;
    ctx.state.result = {
      totalAmount: query.total_amount,
      transactionId: query.trade_no,
      ftcOrderId: query.out_trade_no,
      paidAt: query.timestamp,
    };

    ctx.state.redirectTo = fromUrl
      ? `${fromUrl}?subscribed=true`
      : nextUser.subs;

    ctx.body = await render("alipay-done.html", ctx.state);

    // For development, keep session to test ui.
    if (!isDev) {
      delete ctx.session.subs;
      delete ctx.session.from;
    }
  }
);

/**
 * @description This is used as wechat pay's `return_url` for mobile browser pay.
 * GET /pay/wx/mobile
 */
router.get("/wx/mobile",
  checkSession(),

  async(ctx) => {
    /**
     * @type {ISubsOrder}
     */
    const subsOrder = ctx.session.subs;

    debug("Wx mobile browser pay order: %O", subsOrder);

    if (!subsOrder) {
      ctx.status = 404;
      return;
    }

    // Date to render UI.
    ctx.state.plan = subsOrder;

    ctx.body = await render("wx-mobile.html", ctx.state);
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

    // If users jumped to this site from somewhere else, like in the middle of reading an article,
    // redirec them back after payment finished.
    const fromUrl = ctx.session.from;
    debug("From url: %s", fromUrl);

    // Show redirect URL.
    ctx.state.redirectTo = fromUrl
      ? `${fromUrl}?subscribed=true`
      : nextUser.subs;

    /**
     * @type {ISubsOrder}
     */
    const subsOrder = ctx.session.subs;
    debug("Subs order from session: %O", subsOrder);

    ctx.state.subs = subsOrder;

    // To test UI.
    // ctx.state.result = {
    //   "paymentState": "SUCCESS",
    //   "paymentStateDesc": "支付成功",
    //   "totalFee": 1,
    //   "transactionId": "4200000252201903069440709666",
    //   "ftcOrderId": "FT1D3CEDDB2599EFB9",
    //   "paidAt": "2019-03-06T07:21:18Z"
    // };

    // return await next();

    if (!subsOrder || !subsOrder.appId) {
      return await next();
    }

    /**
     * @type {Account}
     */
    const account = ctx.state.user;

    try {
      const payResult = await account.wxOrderQuery(subsOrder);
      debug("Wxpay query result: %O", payResult);

      if (payResult.paymentState === "SUCCESS") {
        ctx.state.result = payResult;
      }
    } catch (e) {
      const clientErr = new ClientError(e);

      if (!clientErr.isFromAPI()) {
        throw e;
      }

      switch (e.status) {
        // In case the order does not exist.
        case 404:
          break;

        default:
          ctx.state.errors = clientErr.buildGenericError();
          break;
      }
    }

    await next();
  },
  async (ctx, next) => {
    ctx.body = await render("wxpay-done.html", ctx.state);

    if (!isDev) {
      delete ctx.session.subs;
      delete ctx.session.from;
    }
  }
);


module.exports = router.routes();
