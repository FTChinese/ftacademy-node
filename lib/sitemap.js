const {
  baseUrl,
  urlPrefix,
} = require("./config");

exports.sitemap = {
  home:         `${urlPrefix}/subscription`,
  pay: function(tier, cycle) {
    return `${urlPrefix}/subscription/${tier}/${cycle}`;
  },
  login:          `${urlPrefix}/login`,
  // FTC's OAuth2 callback
  loginRedirect:  `${baseUrl.getFta()}/login/callback`,
  logout:         `${urlPrefix}/logout`,
  // Wechat's OAuth2 callback for scope=snsapi_login
  wxConnecting:    `${baseUrl.getFta()}/wx/oauth2/connecting`,
  // Wechat's OAuth2 callback for scope=snsapi_base
  wxCallback:     `${baseUrl.getFta()}/wx/oauth2/callback`,
};

exports.nextUser = {
  subs:            `${baseUrl.getNextUser()}/subscription`,
  authorize:       `${baseUrl.getNextUser()}/oauth2/authorize`,
  wxCallback:         `${baseUrl.getNextUser()}/login/wechat/callback`,
}
