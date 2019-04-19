const {
  baseUrl,
} = require("./config");

exports.nextApi = {
  oauthToken: `${baseUrl.getNextApi()}/oauth/token`,
  account: `${baseUrl.getNextApi()}/user/account`,
  wxAccount: `${baseUrl.getNextApi()}/wx/account`,
};

exports.subsApi = {
  wxDesktopOrder: function (tier, cycle) {
    return `${baseUrl.getSubsApi()}/wxpay/desktop/${tier}/${cycle}`;
  },

  wxMobileOrder: function (tier, cycle) {
    return `${baseUrl.getSubsApi()}/wxpay/mobile/${tier}/${cycle}`;
  },

  wxBrowserOrder: function(tier, cycle) {
    return `${baseUrl.getSubsApi()}/wxpay/jsapi/${tier}/${cycle}`;
  },

  aliDesktopOrder: function (tier, cycle) {
    return `${baseUrl.getSubsApi()}/alipay/desktop/${tier}/${cycle}`;
  },

  aliMobileOrder: function (tier, cycle) {
    return `${baseUrl.getSubsApi()}/alipay/mobile/${tier}/${cycle}`;
  }
};

exports.wxOAuthApi = {
  code: "https://open.weixin.qq.com/connect/oauth2/authorize",
  accessToken: "https://api.weixin.qq.com/sns/oauth2/access_token",
}
