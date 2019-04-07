const baseUrl = "http://localhost:4100/user/login";
const prefix = '';

exports.sitemap = {
  home: `${prefix}/subscription`,
  pay: function(tier, cycle) {
    return `${prefix}/subscription/${tier}/${cycle}`;
  },
  login:    `${prefix}/login`,
  logout:    `${prefix}/logout`,
  profile:    `${prefix}/profile`,
};
