const request = require("superagent");
const debug = require("debug")("fta:wxoauth-client");
const {
  URL,
  URLSearchParams,
} = require("url");
const {
  wxOAuthApi,
} = require("./endpoints");
const {
  Viper,
} = require("./config");
const {
  sitemap,
  ftaExternal,
} = require("./sitemap");
const {
  generateState,
} = require("./random");
const time = require("./time");

const wxApp = Viper.getInstance()
  .getConfig()
  .wxapp.o_ftcsupport;

class WxDetect {
  constructor(ua) {
    this.ua = ua;
  }

  parse() {
    const found = /(MicroMessenger)\/([0-9]+)\.([0-9]+)/i.exec(this.ua);

    if (!found) {
      this.browser = null;
      return;
    }

    const [, name, major, minor] = found;

    this.browser = {
      name,
      major,
      minor,
    };

    return this;
  }

  isWxBrowser() {
    return !!this.browser;
  }

  isPaySupported() {
    const major = Number.parseInt(this.browser.major, 10);
    if (major >= 5) {
      return true;
    }

    return false;
  }
}

class WxOAuthClient {
  /**
   *
   * @param {IWxApp} app
   */
  constructor(app) {
    this.client = app;
  }

  async generateState() {
    const state = await generateState();
    return {
      v: state,
      t: time.unixNow(),
    };
  }

  /**
   * @description Test if OAuth state parameter is expired.
   * Its lifetime spans 5 minutes since creation.
   * @param {Object} state
   * @param {string} state.v
   * @param {number} state.t
   */
  isStateExpired(state) {
    return time.isExpired(state.t, 5 * 60);
  }

  /**
   * @description Build the url to get OAuth code.
   * This url must be opened in wechat browser.
   * When user is redirected to this link, wechat
   * already knows user's identity, that is, the
   * open id is determined in this step.
   * @param {string} state
   */
  buildCodeUrl(state) {
    debug("Wx OAuth redirect uri: %s", ftaExternal.wxCallback);

    const params = new URLSearchParams();
    params.set("appid", this.client.app_id);
    params.set("redirect_uri", ftaExternal.wxCallback);
    params.set("response_type", "code");
    params.set("scope", "snsapi_base");
    params.set("state", state);

    const redirectTo = new URL(wxOAuthApi.code);
    redirectTo.search = params.toString();
    redirectTo.hash = "wechat_redirect";

    return redirectTo.href;
  }

  /**
   * @description Build the url to request for access t oken.
   * This url can be opened anywhere.
   * @param {string} code
   */
  buildTokenUrl(code) {
    const params = new URLSearchParams();
    params.set("appid", this.client.app_id);
    params.set("secret", this.client.secret);
    params.set("code", code);
    params.set("grant_type", "authorization_code");

    const url = new URL(wxOAuthApi.accessToken);
    url.search = params.toString();

    return url.href;
  }

  /**
   * @param {string} code
   * @return {Promise<IWxAccess>}
   *
   * {
      "errcode": 40163,
      "errmsg": "code been used, hints: [ req_id: 1fJBvNLnRa-mXkovA ]"
    }
   */
  async getAccessToken(code) {
    const url = this.buildTokenUrl(code);

    // WARNING: wechat response header `Content-Type: text/plain`.
    // It's not `application/json`, even though they claim it is.
    // Standard http request libraries, like the one used here, will not parse the request body to JSON.
    const resp = await request.get(url);

    debug("Wechat API response type: %s, charset: %s", resp.type, resp.charset);

    return JSON.parse(resp.text);
  }
}

exports.WxDetect = WxDetect;
exports.wxOAuthClient = new WxOAuthClient(wxApp);
