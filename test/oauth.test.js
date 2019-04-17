const {
  viper,
} = require("../lib/config");
viper.setConfigPath(process.env.HOME)
  .setConfigName("config/api.toml")
  .readInConfig();

const oauthClient = require("../lib/oauth-client");
const {
  generateState,
} = require("../lib/random");

test("code-url", async () => {
  const state = await generateState();

  console.log(oauthClient.buildCodeUrl(state));
});
