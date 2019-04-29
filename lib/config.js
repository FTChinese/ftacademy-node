const debug = require("debug")("fta:config");
const isProduction = process.env.NODE_ENV === "production";
const isSandbox = process.env.NODE_ENV === "sandbox";
const isDev = process.env.NODE_ENV === "development";
const urlPrefix = process.env.URL_PREFIX || "";

const fs = require("fs");
const path = require("path");
const toml = require("toml");

console.log(`Current environment: ${process.env.NODE_ENV}. URL prefix: ${process.env.URL_PREFIX}`);

/**
 * @description Get urls for varous apps based on runtime env.
 */
class BaseUrl {
  constructor({prod, sandbox=false,}={}) {
    this._sandbox = sandbox;
    this._prod = prod
    debug(`BaseUrl is sandbox: ${sandbox}`);
  }

  getSubsApi() {
    if (this._sandbox) {
      return "http://www.ftacademy.cn/api/sandbox";
    }

    return this._prod
      ? "http://www.ftacademy.cn/api/v1"
      : "http://localhost:8200";
  }

  getNextApi() {
    if (this._sandbox || this._prod) {
      return "http://api.ftchinese.com/v1";
    } else {
      return "http://localhost:8000";
    }
  }

  /**
   * @description Get FTA base url based on the passed in parameter or environment variables.
   * @param {boolean} online - this overrides any envirionment variables.
   */
  getFta(online=false) {
    if (online || this._sandbox || this._prod) {
      return `http://www.ftacademy.cn${urlPrefix}`;
    } else {
      return "http://localhost:4200";
    }
  }

  getNextUser() {
    debug("getNextUser: ")
    if (this._sandbox || this._prod) {
      return "http://next.ftchinese.com/user"
    } else {
      return "http://localhost:4100/user"
    }
  }
}

/**
 * @description Get configuration from toml file.
 * This is a mimic for golang pkg viper.
 */
class Viper {
  constructor({prod, sandbox=false}={}) {
    this._sandbox = sandbox;
    this._prod = prod;

    /**
     * @type {IConfig}
     */
    this.config = null;
  }

  /**
   * @description Set the configuration file path
   */
  setConfigPath(filePath) {
    this.filePath = filePath;
    return this;
  }

  setConfigName(fileName) {
    this.fileName = fileName;
    return this;
  }

  readInConfig() {
    const configFile = path.resolve(this.filePath, this.fileName);
    this.config = toml.parse(fs.readFileSync(configFile, "utf-8"));
    return this;
  }

  getConfig() {
    return this.config;
  }

  /**
   * @description Get the FTA OAuth client.
   * @return {IFtcClient}
   */
  getOAuthClient() {
    const clients = this.config.oauth_client;

    if (this._sandbox) {
      return clients.fta_sandbox;
    }

    return this._prod
      ? clients.fta_prod
      : clients.fta_dev;
  }

  /**
   * @return {IWxApp}
   */
  getWxAppForJSAPI() {
    return this.config.wxapp.o_ftcsupport;
  }

  /**
   * @type {IWxApp}
   */
  getWxAppFroBrowser() {
    return this.config.wxapp.m_ftc;
  }

  /**
   * @description Create a singleton of Viper.
   * This method produces side effect. Previously a
   * single instance is exported directly, but later I
   * found it's not flexible for unit testing.
   * By creating a single instance method, we can
   * avoid producint side effect when this module is
   * required, while maitaining all configuration in
   * one place just by calling this method.
   * @return {Viper}
   */
  static getInstance() {
    if (!Viper._instance) {
      const viper = new Viper({
        prod: isProduction,
        sandbox: isSandbox,
      });

      viper.setConfigPath(process.env.HOME)
        .setConfigName("config/api.toml")
        .readInConfig();

      Viper._instance = viper;
    }

    return Viper._instance;
  }
}

exports.isProduction = isProduction;
exports.isSandbox = isSandbox;
exports.isDev = isDev;
exports.urlPrefix = urlPrefix;
exports.BaseUrl = BaseUrl;
exports.Viper = Viper;

// Default base url and viper instance.
exports.baseUrl = new BaseUrl({
  prod: isProduction,
  sandbox: isSandbox,
});
