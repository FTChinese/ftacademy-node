declare interface IBanner {
  heading: string;
  subHeading: string;
  coverUrl: string;
  content: string[];
}

declare interface IProduct {
  heading: string;
  benefits: string[];
  smallPrint?: string;
  tier: "standard" | "premium";
  currency: string;
  pricing: IPlan[];
}

declare interface IPlan {
  tier: "standard" | "premium";
  cycle: "month" | "year";
  listPrice: number;
  netPrice: number;
  description: string;
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
