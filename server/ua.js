const Router = require('koa-router');

const router = new Router();

router.get("/", async (ctx, next) => {

  const userAgent = ctx.header["user-agent"];
  const ua = uaParser(userAgent);

  ctx.body = {
    description: "This is a test page to detect user agent header",
    rawUserAgent: ua,
  }
});

module.exports = router.routes();
