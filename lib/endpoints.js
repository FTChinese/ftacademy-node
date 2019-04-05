const subsBaseUrl = "http://localhost:8200";

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
