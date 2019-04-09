const nextBaseUrl = "http://localhost:4100/user";
const prefix = process.env.URL_PREFIX;

exports.sitemap = {
  home: `${prefix}/subscription`,
  pay: function(tier, cycle) {
    return `${prefix}/subscription/${tier}/${cycle}`;
  },
  login:    `${prefix}/login`,
  logout:    `${prefix}/logout`,
  profile:    `${nextBaseUrl}/profile`,
};
