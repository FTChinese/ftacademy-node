const { WxDetect } = require("../lib/wx-oauth");

const wxDetect = new WxDetect("Mozilla/5.0(iphone;CPU iphone OS 5_1_1 like Mac OS X) AppleWebKit/534.46(KHTML,like Geocko) Mobile/9B206").parse();

console.log(wxDetect);

