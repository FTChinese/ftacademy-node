declare interface IBanner {
  heading: string;
  subHeading: string;
  coverUrl: string;
  content: string[];
}

declare interface IPlan {
  tier: "standard" | "premium";
  cycle: "month" | "year";
  listPrice: number;
  netPrice: number;
  description?: string;
}

// Saved in session so that we can tell user what they buy after being redirected from payment providers.
declare interface ISubsOrder extends IPlan {
  orderId: string;
  appId?: string; // wx app id.
  payMethod: "alipay" | "wechat";
}

declare interface IProduct {
  heading: string;
  benefits: string[];
  smallPrint?: string;
  tier: "standard" | "premium";
  currency: string;
  pricing: IPlan[];
}

declare interface IPricing {
  standard_year: IPlan;
  standard_month: IPlan;
  premium_year: IPlan;
}

declare interface IPaywall {
  banner: IBanner;
  products: IProduct[];
}

declare interface IPromo {
  startAt: string;
  endAt: string;
  banner: IBanner;
  pricing: IPricing;
  createdAt: string;
}

declare interface IOAuthClient {
  client_id: string;
  client_secret: string;
}

// This is not the standard OAuth token.
declare interface IOAuthToken {
  userId: string;
  loginMethod: "email" | "wechat"
}

declare interface ICredentials {
  email: string;
  password: string;
}

declare interface IMembership {
  tier?: "standard" | "premium";
  cycle?: "year" | "month";
  expireDate?: string;
}

declare interface IWechat {
  nickname?: string;
  avatarUrl?: string;
}

declare interface IAccount {
  id: string;
  unionId?: string;
  userName?: string;
  email: string;
  isVerified: boolean;
  avatar?: string;
  isVip: boolean;
  loginMethod: "email" | "wechat";
  wechat: IWechat;
  membership: IMembership;
}

declare interface IAPIError {
  message: string;
  error?: {
    field: string;
    code: string;
  }
}

declare interface IConfig {
  wxapp: {
    m_ftc: IWxApp;
    o_ftcsupport: IWxAccess;
  };
  oauth_client: {
    fta_dev: IFtcClient;
    fta_sandbox: IFtcClient;
    fta_prod: IFtcClient;
  };
  koa_session: {
    superyard: string;
    next_user: string;
    ftacacemy: string;
  };
}

// FTC OAuth2 client.
declare interface IFtcClient {
  client_id: string;
  client_secret: string;
}

declare interface IWxApp {
  app_id: string;
  secret: string;
}

declare interface IWxAccess {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
}

declare interface IWxQRPay {
  ftcOrderId: string;
  listsPrice: number;
  netPrice: number;
  appId: string;
  codeUrl: string;
}

declare interface IWxMobilePay {
  ftcOrderId: string;
  listPrice: number;
  netPrice: number;
  appId: string;
  mWebUrl: string;
}

declare interface IWxBrowserPay {
  ftcOrderId: string;
  listPrice: number,
  netPrice: number,
  appId: string;
  timestamp: string;
  nonce: string;
  pkg: string;
  signature: string;
  signType: string;
}

declare interface IWxQuery {
  paymentState: string;
  paymentStateDesc: string;
  totalFee: number;
  transactionId: string;
  ftcOrderId: string;
  paidAt: string;
}

declare interface IAliWebPay {
  ftcOrderId: string;
  listPrice: string;
  netPrice: string;
  payUrl: string;
}

declare interface IAliPayResult {
  totalAmount: string;
  transactionId: string;
  ftcOrderId: string;
  paidAt: string;
}
