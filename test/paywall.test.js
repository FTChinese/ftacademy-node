const {
  DateTime,
} = require("luxon");
const {
  Promo,
  Paywall,
} = require("../model/paywall");
const promoData = require("../model/promo.json");

const currentPromo = {
  startAt: DateTime.utc().plus({"days": -1}),
  endAt: DateTime.utc().plus({"days": 1}),
  banner: promoData.banner,
  pricing: promoData.pricing
};

test("promo", () => {
  const promo = new Promo(promoData);

  console.log(promo.startAt.toISO());
  console.log(promo.endAt.toISO());

  expect(promo.isInEffect()).toBeFalsy();
});

test("default paywall", () => {
  const paywall = Paywall.getInstance();

  console.log(paywall.getPaywall());
  console.log(paywall.getPricing());

  paywall.setPromo(currentPromo);

  console.log(paywall.getPaywall());
  console.log(paywall.getPricing());
});

