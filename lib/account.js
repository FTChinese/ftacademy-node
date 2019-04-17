const request = require("superagent");
const {
  nextApi,
} = require("./endpoints");

const {
  KEY_UNION_ID,
  KEY_USER_ID,
} = require("./request");

class UserAccount {
  /**
   * @param {IOAuthToken} login
   */
  constructor(login) {
    this.userId = login.userId;
    this.loginMethod = login.loginMethod;
  }

  async fetch() {
    switch (this.loginMethod) {
      case "email": {
        const resp = await request
            .get(nextApi.account)
            .set(KEY_USER_ID, this.userId);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      case "wechat": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, this.userId);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      default:
        throw new Error("Unknown login method.");
    }
  }
}

module.exports = UserAccount;
