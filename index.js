const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const session = require("koa-session");

const boot = require("./util/boot-app");

const home = require("./server/home");
const subscription = require("./server/subscription");
const version = require("./server/version");

const isProduction = process.env.NODE_ENV === "production";
const app = new Koa();
const router = new Router();

app.proxy = true;

if (!isProduction) {
  const static = require("koa-static");
  app.use(static(path.resolve(process.cwd(), "node_modules")));
  app.use(static(path.resolve(process.cwd(), "client")));
}

app.use(bodyParser());

router.get("/", home)
router.use("/subscription", subscription);
router.use("/__version", version);

app.use(router.routes());

boot(app)
  .catch(err => {
    debug.error("Bootup error: %O", err);
  });