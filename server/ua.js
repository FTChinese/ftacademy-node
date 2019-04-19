const Router = require('koa-router');

const router = new Router();

router.get("/", async (ctx, next) => {

  const userAgent = ctx.header["user-agent"];

  ctx.body = {
    description: "This is a test page to detect user agent header",
    rawUserAgent: userAgent,
  }
});

module.exports = router.routes();
