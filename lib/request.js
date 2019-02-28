const pkg = require("../package.json");

const baseUrl = "http://localhost:8200";

exports.KEY_USER_ID = "X-User-Id";
const KEY_CLIENT_TYPE = "X-Client-Type";
const KEY_CLIENT_VERSION = "X-Client-Version";
const KEY_USER_AGENT = "X-User-Agent";
const KEY_USER_IP = "X-User-Ip";

exports.subsApi = {
  wxpay: function (tier, cycle) {
    `${baseUrl}/wxpay/unified-order/${tier}/${cycle}`;
  },
  alipay: function (tier, cycle) {
    `${baseUrl}/alipay/app-order/${tier}/${cycle}`;
  },
  "plans": `${baseUrl}/paywall/plans`,
};

exports.clientHeaders = function (ip, ua) {
    return {
        KEY_CLIENT_TYPE: "web",
        KEY_CLIENT_VERSION: pkg.version,
        KEY_USER_AGENT: ua,
        KEY_USER_IP: ip,
    };
}
