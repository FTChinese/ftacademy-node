const request = require("superagent");
const debug = require("debug")("fta:user-account");
const Membership = require("./member");

const {
  subsApi,
  nextApi,
} = require("./endpoints");

const {
  ftaExternal,
} = require("./sitemap");

const {
  KEY_UNION_ID,
  KEY_USER_ID,
  KEY_APP_ID,
} = require("./request");

class UserAccount {
  /**
   * @param {IAccount} account
   */
  constructor(account, client = null) {
    this._data = account;
    this._client = client;
    this._member = null;
  }

  /**
   * @return {string}
   */
  get id() {
    return this._data.id;
  }

  /**
   * @return {string|null}
   */
  get unionId() {
    return this._data.unionId;
  }

  /**
   * @return {string|null}
   */
  get userName() {
    return this._data.userName;
  }

  /**
   * @return {string}
   */
  get email() {
    return this._data.email;
  }

  /**
   * @return {boolean}
   */
  get isVerified() {
    return this._data.isVerified;
  }

  /**
   * @return {string|null}
   */
  get avatar() {
    return this._data.avatar;
  }

  /**
   * @return {boolean}
   */
  get isVip() {
    return this._data.isVip;
  }

  /**
   * @return {"email"|"wechat"}
   */
  get loginMethod() {
    return this._data.loginMethod;
  }

  /**
   * @return {IWechat}
   */
  get wechat() {
    return this._data.wechat;
  }

  /**
   * @return {Membership}
   */
  get member() {
    if (!this._member) {
      this._member = new Membership(this._data.membership);
    }
    return this._member;
  }

  setClient(clientApp) {
    this._client = clientApp;
    return this;
  }

  getDisplayName() {
    if (this._data.userName) {
      return this._data.userName;
    }

    if (this._data.wechat.nickname) {
      return this._data.wechat.nickname
    }

    if (this._data.email) {
      return this._data.email.split("@")[0];
    }

    return "";
  }

  /**
   * @description Refresh current user account.
   * NOTE how curly braces, together with const,
   * are used to solve the terrible scoping issue.
   * @returns {Promise<IAccount>}
   */
  async fetch() {
    switch (this.loginMethod) {
      case "email": {
        const resp = await request
            .get(nextApi.account)
            .set(KEY_USER_ID, this.id);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      case "wechat": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, this.unionId);

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
   * @description Pay inside mobile browser.
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
   * @description Payment only inside wechat's own browser.
   * @return {Promise<IWxBrowserPay>}
   */
  async wxBrowserOrder({tier, cycle, openId}={}) {
    const req = request
      .post(subsApi.wxBrowserOrder(tier, cycle))

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
    }

    if (this._client) {
      req.set(this._client);
    }

    const resp = await req.send({ openId });

    return resp.body;
  }

  /**
   * @description Query wechat pay result.
   * @param {string} orderId
   * @return {Promise<IWxQuery>}
   */
  async wxOrderQuery({orderId, appId}={}) {
    const req = request
      .get(subsApi.wxQueryOrder(orderId))
      .set(KEY_APP_ID, appId);

    if (this._data.id) {
      req.set(KEY_USER_ID, this._data.id);
    }

    if (this._data.unionId) {
      req.set(KEY_UNION_ID, this._data.unionId);
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
      .post(subsApi.aliDesktopOrder(tier, cycle))
      .query({
        "return_url": ftaExternal.aliReturnUrl,
      });

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
      .post(subsApi.aliMobileOrder(tier, cycle))
      .query({
        "return_url": ftaExternal.aliReturnUrl,
      });

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

module.exports = UserAccount;
