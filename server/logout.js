const Router = require('koa-router');
const {
  sitemap
} = require("../lib/sitemap");

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.session = null;
  ctx.redirect(sitemap.home);
  return;
});

module.exports = router.routes();
