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
