const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const logger = require("koa-logger");
const bodyParser = require("koa-bodyparser");
const session = require("koa-session");

const boot = require("./util/boot-app");

const {
  env,
  handleErrors,
  noCache,
} = require("./server/middleware");

const home = require("./server/home");
const subscription = require("./server/subscription");
const login = require("./server/login");
const logout = require("./server/logout");
const version = require("./server/version");

const isProduction = process.env.NODE_ENV === "production";
const app = new Koa();
const router = new Router();

app.proxy = true;
app.keys = ['SEKRIT1', 'SEKRIT2'];

app.use(logger());

if (!isProduction) {
  const static = require("koa-static");
  app.use(static(path.resolve(process.cwd(), "node_modules")));
  app.use(static(path.resolve(process.cwd(), "client")));
}

app.use(session({
  key: "_ftc:subs"
}, app));
app.use(bodyParser());
app.use(env());
app.use(handleErrors());

router.get("/", home)
router.get("/login", login);
router.get("/logout", logout);
router.use("/subscription", subscription);
router.use("/__version", version);

app.use(router.routes());

console.log(router.stack.map(layer => layer.path));

boot(app)
  .catch(err => {
    debug.error("Bootup error: %O", err);
  });
