const wxUA = "Mozilla/5.0(iphone;CPU iphone OS 5_1_1 like Mac OS X) AppleWebKit/534.46(KHTML,like Geocko) Mobile/9B206 MicroMessenger/5.0";
const {
  Viper,
} = require("../lib/config");

const viper = Viper.getInstance();

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
