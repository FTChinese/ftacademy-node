const {
  DateTime,
} = require("luxon");
const debug = require("debug")("fta:paywall");
/**
 * @type {IPaywall}
 */
const defaultPaywall = require("./paywall-default.json");
/**
 * @type {IPromo}
 */
const promo = require("./paywall-promo");
/**
 * @type {IProduct[]}
 */
const products = require("./products.json");

/**
 * @returns {IPaywall}
 */
exports.getPaywall = function () {
  const startAt = DateTime.fromISO(promo.startAt);
  const endAt = DateTime.fromISO(promo.endAt);

  debug("Start time: %s", startAt);
  debug("End time: %s", endAt)

  if (!startAt.isValid || !endAt.isValid) {
    return defaultPaywall;
  }

  const now = DateTime.local();

  debug("Now: %s", now);

  if (now >= startAt && now <= endAt) {
    debug("Using promo")
    return promo;
  }

  debug("Using default paywall");
  return defaultPaywall;
}

/**
 * @param {IPricing} pricing
 * @returns {IProduct[]}
 */
exports.buildProducts = function (pricing) {
  return products.map(product => {
    const p = Object.assign({}, product);
    switch (product.tier) {
      case "standard":
        p.pricing = [pricing.standard_year, pricing.standard_month];
        break;

      case "premium":
        p.pricing = [pricing.premium_year];
        break;
    }

    return p;
  });
}
