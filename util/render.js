const path = require("path");
const nunjucks = require("nunjucks");
const util = require("util");
const numeral = require("numeral");
const localized = require("../model/localized.json");

const env = nunjucks.configure(
  [
    path.resolve(__dirname, "../view"),
    path.resolve(__dirname, "../client")
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

module.exports = util.promisify(nunjucks.render);
