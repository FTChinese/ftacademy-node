const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const session = require("koa-session");

const boot = require("./util/boot-app");

const env = require("./middleware/env");
const handlError = require("./middleware/handle-error");
const noCache = require("./middleware/no-cache");

const home = require("./server/home");
const subscription = require("./server/subscription");
const version = require("./server/version");

const isProduction = process.env.NODE_ENV === "production";
const app = new Koa();
const router = new Router();

app.proxy = true;

app.use(logger());

if (!isProduction) {
  const static = require("koa-static");
  app.use(static(path.resolve(process.cwd(), "node_modules")));
  app.use(static(path.resolve(process.cwd(), "client")));
}

app.use(session({
  key: "_ftc:sess",
  signed: false
}, app));
app.use(bodyParser());
app.use(env());
app.use(handlError());

router.get("/", home)
router.use("/subscription", subscription);
router.use("/__version", version);

app.use(router.routes());

console.log(router.stack.map(layer => layer.path));

boot(app)
  .catch(err => {
    debug.error("Bootup error: %O", err);
  });