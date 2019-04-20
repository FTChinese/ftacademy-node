const request = require("superagent");
const debug = require("debug")("fta:oauth-client");
const {
  URL,
  URLSearchParams,
} = require("url");
const {
  nextApi,
} = require("./endpoints");
const {
  baseUrl,
  Viper,
} = require("./config");
const {
  generateState,
} = require("./random");
const time = require("./time");
const {
  KEY_UNION_ID,
  KEY_USER_ID,
} = require("./request");

const authorizeUrl = `${baseUrl.getNextUser()}/authorize`;
debug("Authorize url: %s", authorizeUrl);

const callbackUrl = `${baseUrl.getFta()}/callback`;
debug("Callback url: %s", callbackUrl);

const client = Viper.getInstance().getOAuthClient();

class OAuthClient {
  /**
   * @type {IOAuthClient}
   */
  constructor(client) {
    this.client = client;
  }

  async generateState() {
    const state = await generateState();
    return {
      v: state,
      t: time.unixNow(),
    }
  }

  /**
   * @description Test if OAuth state parameter is expired.
   * Its lifetime spans 5 minutes since creation.
   * @param {Object} state
   * @param {string} state.v
   * @param {number} state.t
   */
  isStateExpired(state) {
    const elapsed = time.unixNow() - state.t
    if (elapsed > 5 * 60 || elapsed < 0 ) {
      return true;
    }

    return false;
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

  /**
   * @description Fetch user account after `requestToken` step.
   * @param {IOAuthToken} token
   * @return {Promise<IAccount>}
   */
  async fetchAccount(token) {
    switch (token.loginMethod) {
      case "email": {
        const resp = await request
            .get(nextApi.account)
            .set(KEY_USER_ID, token.userId);

        /**
         * @type {IAccount}
         */
        return resp.body;
      };

      case "wechat": {
        const resp = await request
          .get(nextApi.wxAccount)
          .set(KEY_UNION_ID, token.userId);

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

module.exports = new OAuthClient(client);
