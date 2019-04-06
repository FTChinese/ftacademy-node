const fs = require("fs");
const path = require("path");
const {
  URL,
  URLSearchParams,
} = require("url");
const configFile = path.resolve(process.env.HOME, "config/oauth.toml");
const toml = require("toml");
/**
 * @type {{dev: IOAuthClient, fta: IOAuthClient}}
 */
const config = toml.parse(fs.readFileSync(configFile, "utf-8"));

const {
  generateState,
} = require("./random");
const authBaseUrl = "http://localhost:4100/user/authorize";
const callbackUrl = "http://localhost:4200/callback";
const isProduction = process.env.NODE_ENV === 'production';
const client = isProduction ? config.fta : config.dev;

/**
 * @returns {string}
 */
async function buildOAuthUrl () {
  const params = new URLSearchParams();
  params.set("response_type", "code");
  params.set("client_id", client.client_id);
  params.set("redirect_uri", "http://localhost:4200/callback");
  const state = await generateState();
  params.set("state", state);

  const redirectTo = new URL(authBaseUrl);
  redirectTo.search = params.toString();

  return redirectTo.href;
}


exports.buildOAuthUrl = buildOAuthUrl;
