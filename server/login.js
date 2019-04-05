const Router = require('koa-router');
const debug = require('debug')('fta:login');

const {
  sitemap
} = require("../lib/sitemap");

const router = new Router();

// Show login page
router.get('/', async function (ctx) {
  // If user is trying to access this page when he is already logged in, redirect away

});

module.exports = router.routes();
