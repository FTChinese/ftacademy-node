const request = require("superagent");
const debug = require("debug")("fta:account");

const {
  subsApi,
} = require("../lib/endpoints");

const KEY_USER_ID = "X-User-Id";
const KEY_UNION_ID = "X-Union-Id";

/**
 * @description This is used for perform account related actions.
 * A user might login with email or with wechat,
 * thus the user have two identities.
 * You have to retrieve account data based on
 * how the user logged in: via email or wechat.
 * If user logged in via email, retrieve data from `/user/account`;
 * if user logged in via wechat, retrieve data from `/wx/account/`.
 * Always use the same endpoint once user is
 * logged in.
 * Mixing them might result unexpected behavior.
 */
class Account {
  /**
   * @param {IAccount} account
   */
  constructor(account, client = null) {
    this._data = account;
    this._client = client;
  }

  /**
   * NOTE how curly braces, together with const,
   * are used to solve the terrible scoping issue.
   * @returns {Promise<IAccount>}
   */
  async fetchAccount() {
    switch (this._data.loginMethod) {
      case "email": {
        const resp = await request
            .get(nextApi.account)
            .set(KEY_USER_ID, this._data.id);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      case "wechat": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, this._data.unionId);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      default:
        throw new Error("Unknown login method.");
    }
  }

  /**
   * @param {string} tier
   * @param {string} cycle
   * @returns {Promise<IWxQRPay>}
   */
  async wxDesktopOrder(tier, cycle) {
    const req = request
      .post(subsApi.wxDesktopOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req;

    return resp.body;
  }

  /**
   * @param {string} tier
   * @param {string} cycle
   * @returns {Promise<IWxMobilePay>}
   */
  async wxMobileOrder(tier, cycle) {
    const req = request
      .post(subsApi.wxMobileOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req;

    return resp.body;
  }

  /**
   *
   * @param {string} tier
   * @param {string} cycle
   * @returns {Promise<IAliWebPay>}
   */
  async aliDesktopOrder(tier, cycle) {
    const req = request
      .post(subsApi.aliDesktopOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req;

    return resp.body;
  }

  /**
   *
   * @param {string} tier - standard | premium
   * @param {string} cycle - year | month
   * @returns {Promise<IAliWebPay>}
   */
  async aliMobileOrder(tier, cycle) {
    const req = request
      .post(subsApi.aliMobileOrder(tier, cycle));

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req;

    return resp.body;
  }
}

exports.Account = Account;
