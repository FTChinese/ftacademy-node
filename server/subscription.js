const Router = require("koa-router");
const render = require("../util/render");

const router = new Router();

router.get("/", async (ctx, next) => {
  ctx.body = await render("subscription.html");
});

router.get("/:tier/:cycle", async (ctx, next) => {
  const params = ctx.params;
  ctx.state.plan = {
    tier: params.tier,
    cycle: params.cycle,
  };

  ctx.body = await render("payment.html", ctx.state);
});

module.exports = router.routes();