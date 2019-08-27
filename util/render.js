const path = require("path");
const debug = require("debug")("fta:render");
const nunjucks = require("nunjucks");
const markdown = require('nunjucks-markdown');
const marked = require('marked');
const util = require("util");
const numeral = require("numeral");
const { DateTime } = require("luxon");
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

env.addFilter("toCST", function(str) {
  if (!str) {
    return "";
  }

  try {
    return DateTime.fromISO(str).setZone("Asia/Shanghai").toFormat("yyyy年LL月dd日 HH:mm:ss")
  } catch (e) {
    debug(e);
    return str
  }
});

env.addFilter("formatWxPrice", function(price) {
  if (typeof price !== "number") {
    return price;
  }

  return price / 100;
});

marked.setOptions({
  gfm: true,
  breaks: true,
});

markdown.register(env, marked);

module.exports = util.promisify(nunjucks.render);
