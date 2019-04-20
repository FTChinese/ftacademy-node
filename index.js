const {
  Viper,
  isDev,
} = require("./lib/config");
const config = Viper.getInstance().getConfig();
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
} = require("./server/middleware");

const home = require("./server/home");
const subscription = require("./server/subscription");
const login = require("./server/login");
const logout = require("./server/logout");
const wechat = require("./server/wechat");
const version = require("./server/version");
const ua = require("./server/ua");

const app = new Koa();

const router = new Router();

app.proxy = true;
app.keys = [config.koa_session.ftacademy];

app.use(logger());

if (isDev) {
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
router.use("/login", login);
router.use("/logout", logout);
router.use("/subscription", subscription);
router.use("/wx", wechat);
router.use("/ua", ua);
router.use("/__version", version);

app.use(router.routes());

console.log(router.stack.map(layer => layer.path));

boot(app)
  .catch(err => {
    debug.error("Bootup error: %O", err);
  });
