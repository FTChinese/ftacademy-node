const isProduction = process.env.NODE_ENV === "production";
const isSandbox = process.env.NODE_ENV === "sandbox";

const fs = require("fs");
const path = require("path");
const toml = require("toml");

/**
 * @description Get urls for varous apps based on runtime env.
 */
class BaseUrl {
  constructor() {
    this._subsApi = null;
    this._nextApi = null;
    this._nextUser = null;
    this._fta = null;
  }

  getSubsApi() {
    if (this._subsApi) {
      return this._subsApi;
    }

    switch (process.env.NODE_ENV) {
      case "sandbox":
        this._subsApi = "http://www.ftacademy.cn/api/sandbox";

      case "production":
        this._subsApi = "http://www.ftacademy.cn/api/v1";

      default:
        this._subsApi = "http://localhost:8200";
    }

    return this._subsApi
  }

  getNextApi() {
    if (this._nextApi) {
      return this._nextApi;
    }

    switch (process.env.NODE_ENV) {
      case "sandbox":
      case "production":
        this._nextApi = "http://api.ftchinese.com/v1";

      default:
        this._nextApi = "http://localhost:8000";
    }

    return this._nextApi;
  }

  getNextUser() {
    if (this._nextUser) {
      return this._nextUser;
    }

    if (isProduction) {
      this._nextUser = "http://next.ftchinese.com/user"
    } else {
      this._nextUser = "http://localhost:4100/user"
    }

    return this._nextUser;
  }

  getFta() {
    if (this._fta) {
      return this._fta;
    }

    switch (process.env.NODE_ENV) {
      case "sandbox":
        this._fta = "http://www.ftacademy.cn/sandbox";

      case "production":
        this._fta = "http://www.ftacademy.cn/v2";

      default:
        this._fta = "http://localhost:4200";
    }

    return this._fta;
  }
}

/**
 * @description Get configuration from toml file.
 * This is a mimic for golang pkg viper.
 */
class Viper {
  constructor() {
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
}

exports.isProduction = isProduction;
exports.isSandbox = isSandbox;
exports.urlPrefix = process.env.URL_PREFIX || "";
exports.baseUrl = new BaseUrl();
exports.viper = new Viper();
