const Router = require('koa-router');
const pkg = require('../package.json');

const router = new Router();

router.get("/", async (ctx, next) => {
  ctx.body = {
    "name": pkg.name,
    "version": pkg.version,
    "env": process.env.NODE_ENV,
  }
});

module.exports = router.routes();
