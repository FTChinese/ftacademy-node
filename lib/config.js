const debug = require("debug")("fta:config");
const isProduction = process.env.NODE_ENV === "production";
const isSandbox = process.env.NODE_ENV === "sandbox";
const isDev = process.env.NODE_ENV === "development";

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

  getFta() {
    if (this._sandbox) {
      return "http://www.ftacademy.cn/sandbox";
    }

    return this._prod ? "http://www.ftacademy.cn/v2" : "http://localhost:4200";
  }

  getNextApi() {
    if (this._sandbox || this._prod) {
      return "http://api.ftchinese.com/v1";
    } else {
      return "http://localhost:8000";
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

  getOAuthClient() {
    const clients = this.config.oauth_client;

    if (this._sandbox) {
      return clients.fta_sandbox;
    }

    return this._prod
      ? clients.fta_prod
      : clients.fta_dev;
  }
}

exports.isProduction = isProduction;
exports.isSandbox = isSandbox;
exports.isDev = isDev;
exports.urlPrefix = process.env.URL_PREFIX || "";
exports.BaseUrl = BaseUrl;
exports.Viper = Viper;

// Default base url and viper instance.
exports.baseUrl = new BaseUrl({
  prod: isProduction,
  sandbox: isSandbox,
});
exports.viper = new Viper({
  prod: isProduction,
  sandbox: isSandbox,
});
