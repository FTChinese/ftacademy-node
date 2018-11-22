const render = require('../util/render');

module.exports = async function(ctx, next) {
  ctx.body = await render("home.html")
};