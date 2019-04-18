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
  viper,
} = require("./config");
const {
  generateState,
} = require("./random");

const authorizeUrl = `${baseUrl.getNextUser()}/authorize`;

debug("Authorize url: %s", authorizeUrl);

const callbackUrl = `${baseUrl.getFta()}/callback`;

debug("Callback url: %s", callbackUrl);

const client = viper.getOAuthClient();

function nowInSeconds() {
  return Math.trunc(Date.now()/1000);
}

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
      t: nowInSeconds(),
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
    const elapsed = nowInSeconds() - state.t
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
}

module.exports = new OAuthClient(client);
