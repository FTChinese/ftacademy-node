const path = require("path");
const nunjucks = require("nunjucks");
const util = require("util");
const numeral = require("numeral");
const localized = {
  "year": "年",
  "month": "月",
  "CNY": "¥",
  "standard": "标准会员",
  "premium": "高端会员",
  "tenpay": "微信支付",
  "alipay": "支付宝",
};

const env = nunjucks.configure(
  [
    path.resolve(__dirname, "../view")
  ],
  {
    noCache: process.env.NODE_ENV === "development",
    watch: process.env.NODE_ENV === "development"
  }
);

/**
 * Conert a number to currency string.
 */
env.addFilter("toCurrency", function(num) {
  return numeral(num).format("0,0.00");
});

env.addFilter("localize", function(key) {
  if (localized.hasOwnProperty(key)) {
    return localized[key];
  }

  return key;
});

env.addFilter("formatWxPrice", function(price) {
  if (typeof price !== "number") {
    return price;
  }

  return price / 100;
});

module.exports = util.promisify(nunjucks.render);
