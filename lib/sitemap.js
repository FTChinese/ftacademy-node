const {
  baseUrl,
  urlPrefix,
} = require("./config");

exports.sitemap = {
  home:     `${urlPrefix}/subscription`,
  pay: function(tier, cycle) {
    return `${urlPrefix}/subscription/${tier}/${cycle}`;
  },
  login:      `${urlPrefix}/login`,
  logout:    `${urlPrefix}/logout`,
  profile:    `${baseUrl.getNextUser()}/profile`,
  subs:      `${baseUrl.getNextUser()}/subscription`
};
