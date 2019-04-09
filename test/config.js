const {
  viper
} = require("../lib/config");

config = viper.setConfigPath(process.env.HOME)
    .setConfigName("config/api.toml")
    .readInConfig()
    .getConfig();

console.log(config);
