const subsBaseUrl = getSubsAPIBaseUrl();
const nextBaseUrl = getNextAPIBaseUrl();

function getSubsAPIBaseUrl() {
  switch (process.env.NODE_ENV) {
    case "sandbox":
      return "http://www.ftacademy.cn/api/sandbox";

    case "production":
      return "http://www.ftacademy.cn/api/v1";

    default:
      return "http://localhost:8200";
  }
}

function getNextAPIBaseUrl() {
  switch (process.env.NODE_ENV) {
    case "sandbox":
    case "production":
      return "http://api.ftchinese.com/v1";

    default:
      return "http://localhost:8000";
  }
}

exports.nextApi = {
  oauthToken: `${nextBaseUrl}/oauth/token`,
  account: `${nextBaseUrl}/user/account`,
  wxAccount: `${nextBaseUrl}/wx/account`,
};

exports.subsApi = {
  wxDesktopOrder: function (tier, cycle) {
    return `${subsBaseUrl}/wxpay/desktop/${tier}/${cycle}`;
  },

  wxMobileOrder: function (tier, cycle) {
    return `${subsBaseUrl}/wxpay/mobile/${tier}/${cycle}`;
  },

  wxBrowserORder: function(tier, cycle) {
    return `${subsBaseUrl}/wxpay/jsapi/${tier}/${cycle}`;
  },

  aliDesktopOrder: function (tier, cycle) {
    return `${subsBaseUrl}/alipay/desktop/${tier}/${cycle}`;
  },

  aliMobileOrder: function (tier, cycle) {
    return `${subsBaseUrl}/alipay/mobile/${tier}/${cycle}`;
  }
};
