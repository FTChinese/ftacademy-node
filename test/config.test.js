const {
  viper
} = require("../lib/config");

config = viper.setConfigPath(process.env.HOME)
    .setConfigName("config/api.toml")
    .readInConfig()
    .getConfig();

const {
  BaseUrl
} = require("../lib/config");

test("base-url", () => {
  const baseUrl = new BaseUrl({
    sandbox: true,
    prod: true,
  });

  console.log(`Next user: ${baseUrl.getNextUser()}`);
  console.log(`Next api: ${baseUrl.getNextApi()}`);
});
