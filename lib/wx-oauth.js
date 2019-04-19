const request = require("superagent");
const debug = require("debug")("fta:wxoauth-client");
const {
  URL,
  URLSearchParams,
} = require("url");
const {
  nextApi,
  wxOAuthApi,
} = require("./endpoints");
const {
  baseUrl,
  viper,
} = require("./config");
const {
  sitemap,
} = require("./sitemap");
const {
  generateState,
} = require("./random");
const time = require("./time");
const {
  KEY_UNION_ID,
  KEY_USER_ID,
} = require("./request");

const wxApp = viper.getConfig().wxapp.o_ftcsupport;

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

  buildCodeUrl(state) {
    debug("Wx OAuth redirect uri: %s", sitemap.wxCallback);

    const params = new URLSearchParams();
    params.set("appid", this.client.app_id);
    params.set("redirect_uri", sitemap.wxCallback);
    params.set("response_type", "code");
    params.set("scope", "snsapi_base");
    params.set("state", state);

    const redirectTo = new URL(wxOAuthApi.code);
    redirectTo.search = params.toString();
    redirectTo.hash = "wechat_redirect";

    return redirectTo.href;
  }

  /**
   * @param {string} code
   * @return {Promise<IWxAccess>}
   */
  async getAccessToken(code) {
    const params = new URLSearchParams();
    params.set("appid", this.client.app_id);
    params.set("secret", this.client.secret);
    params.set("code", code);
    params.set("grant_type", "authorization_code");

    const url = new URL(wxOAuthApi.accessToken);
    url.search = params.toString();

    const resp = await request.get(url.href);

    return resp.body;
  }
}

exports.WxDetect = WxDetect;
exports.wxOAuthClient = new WxOAuthClient(wxApp);
