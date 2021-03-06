const wxUA = "Mozilla/5.0(iphone;CPU iphone OS 5_1_1 like Mac OS X) AppleWebKit/534.46(KHTML,like Geocko) Mobile/9B206 MicroMessenger/5.0";
process.env.NODE_ENV = "sandbox"
process.env.URL_PREFIX = "/sandbox";

const {
  Viper,
} = require("../lib/config");

Viper.getInstance();

const {
  WxDetect,
  wxOAuthClient,
} = require("../lib/wx-oauth");


test("parse", () => {
  const found = /(MicroMessenger)\/([0-9]+)\.([0-9]+)/i.exec(ua);

  console.log(found);

  const [, name, major, minor] = found;

  console.log(`name: ${name}, major: ${major}, minor: ${minor}`);
});

test("wxbrowser", () => {
  const wxBrowser = new WxBrowser(wxUA).parse();

  console.log(wxBrowser.isWxBrowser());
  console.log(wxBrowser.isPaySupported());
});

test("code", async() => {

  const state = await wxOAuthClient.generateState();
  const url = wxOAuthClient.buildCodeUrl(state.v);

  console.log(url);
});

test("token-url", () => {
  const code = "011IATIi1dmjnv0f56Ji19jWIi1IATIm";
  const tokenUrl = wxOAuthClient.buildTokenUrl(code);

  console.log(tokenUrl);
});

test("get-token", async () => {
  const code = "001l4SvN0zJggb2cCpwN00HvvN0l4SvY";

  const result = await wxOAuthClient.getAccessToken(code);

  console.log(result);
});
