const request = require("superagent");
const {
  URL,
  URLSearchParams,
} = require("url");
const {
  nextApi,
} = require("./endpoints");
const {
  baseUrl,
  viper,
  isProduction,
} = require("./config");


/**
 * @type {{dev: IOAuthClient, fta: IOAuthClient}}
 */
const clients = viper.getConfig().oauth_client;


const authorizeUrl = `${baseUrl.getNextUser()}/authorize`;
const callbackUrl = `${baseUrl.getFta()}/callback`;

const client = isProduction
  ? clients.fta
  : clients.dev;

const KEY_USER_ID = "X-User-Id";
const KEY_UNION_ID = "X-Union-Id";

class OAuthClient {
  /**
   * @type {IOAuthClient}
   */
  constructor(client) {
    this.client = client;
  }

  buildCodeUrl(state) {
    const params = new URLSearchParams();
    params.set("response_type", "code");
    params.set("client_id", this.client.client_id);
    params.set("redirect_uri", callbackUrl);
    params.set("state", state);

    const redirectTo = new URL(authorizeUrl);
    redirectTo.search = params.toString();

    return redirectTo.href;
  }

  /**
   * @description Use the code to exchange for user id and login method.
   * This is not a standard OAuth implementation.
   * @param {string} code
   * @returns {Promose<IOAuthToken>}
   */
  async requestToken(code) {
    const resp = await request.post(nextApi.oauthToken)
      .auth(this.client.client_id, this.client.client_secret)
      .type("form")
      .send("grant_type=authorization_code")
      .send(`redirect_uri=${callbackUrl}`)
      .send(`code=${code}`)

    return resp.body;
  }
}

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

exports.oauthClient = new OAuthClient(client);
exports.UserAccount = UserAccount;
