const isProduction = process.env.NODE_ENV === 'production';

module.exports = function() {
  return async (ctx, next) => {

    ctx.state.env = {
      isProduction,
      year: new Date().getFullYear(),
    };

    await next();
  }
}
