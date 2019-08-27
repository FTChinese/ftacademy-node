const {
  baseUrl,
  urlPrefix,
} = require("./config");

// URL path used internally.
exports.sitemap = {
  home:         `${urlPrefix}/subscription`,
  pay: function(tier, cycle) {
    return `${urlPrefix}/subscription/${tier}/${cycle}`;
  },
  login:          `${urlPrefix}/login`,
  alipayDone:     `${urlPrefix}/pay/ali/done`,
  wxpayDone:      `${urlPrefix}/pay/wx/done`,
  logout:         `${urlPrefix}/logout`,
  androidLatest:  `${urlPrefix}/android/latest`,
  androidList:    `${urlPrefix}/android/releases`,
};

// Full URL used externally.
exports.ftaExternal = {
  // FTC's OAuth2 callback
  loginRedirect:  `${baseUrl.getFta()}/login/callback`,
  // Wechat's OAuth2 callback for scope=snsapi_base
  wxCallback:     `${baseUrl.getFta(true)}/wx/oauth2/callback`,
  aliReturnUrl:   `${baseUrl.getFta(true)}/pay/ali/done`,
  wxpayRedirectUrl: `${baseUrl.getFta(true)}/pay/wx/mobile`,
}

exports.nextUser = {
  subs:            `${baseUrl.getNextUser()}/subscription`,
  authorize:       `${baseUrl.getNextUser()}/oauth2/authorize`,
  wxCallback:         `${baseUrl.getNextUser()}/login/wechat/callback`,
}
