function parseWxUa(ua) {
  const found = /(MicroMessenger)\/([0-9]+)\.([0-9]+)/i.exec(this.ua);

  if (!found) {
    return {
      isWxBrowser: function() {
        return false;
      },
      isPaySupported: function() {
        return false;
      }
    };
  }

  const [, name, major, minor] = found;

  return {
    isWxBrowser: function() {
      return true;
    },
    isPaySupported: function() {
      const vMajor = Number.parseInt(major, 10);
      if (vMajor >= 5) {
        return true;
      }

      return false;
    }
  }
}



function initWxBrowserPay() {
  const parsedUa = parseWxUa(window.navigator.userAgent);
  if (!parsedUa.isWxBrowser()) {
    return;
  }

  if (!parsedUa.isPaySupported()) {
    alert("You wechat version is too old to support pay");
    return;
  }


  if (typeof WeixinJSBridge == "undefined") {
    if (document.addEventListener) {
      document.addEventListener("WeixinJSBridgeReady", onBridgeReady, false);
    } else if (document.attachEvent) {
      document.attachEvent("WeixinJSBridgeReady", onBridgeReady);
      document.attachEvent("onWeixinJSBridgeReady", onBridgeReady);
    }
  } else {
    onBridgeReady();
  }
}
