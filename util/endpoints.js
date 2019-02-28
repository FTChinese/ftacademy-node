const baseUrl = "http://localhost:8200";

module.exports = {
  wxpay: function (tier, cycle) {
    `${baseUrl}/wxpay/unified-order/${tier}/${cycle}`;
  },
  alipay: function (tier, cycle) {
    `${baseUrl}/alipay/app-order/${tier}/${cycle}`;
  },
  "plans": `${baseUrl}/paywall/plans`,
};