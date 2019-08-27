const Router = require('koa-router');
const debug = require('debug')('fta:login');

const {
  sitemap,
} = require("../lib/sitemap");
const {
  isAPIError,
} = require("../lib/response");
const {
    androidRelease
} = require("../repository/app-releases");

const render = require("../util/render");

const router = new Router();

router.get("/latest", async(ctx, next) => {

  const latest = await androidRelease.getLatest();

  ctx.state.latest = latest;

  ctx.body = await render("android/latest.html", ctx.state);
});

router.get("/releases", async(ctx, next) => {
  const releases = await androidRelease.getList()

  ctx.state.releases = releases;

  ctx.body = await render("android/list.html", ctx.state);
});

module.exports = router.routes();
