declare interface IBanner {
    coverUrl: string;
    heading: string;
    subHeading: string;
    content: string[];
}

declare interface IPlan {
    tier: "standard" | "premium";
    cycle: "month" | "year";
    listPrice: number;
    netPrice: number;
    description: string;
    message?: string;
}

declare interface IPricing {
    standard_year: IPlan;
    standard_month: IPlan;
    premium_year: IPlan;
}

declare interface IPaywall {
    plans: IPricing;
    banner: IBanner;
}
declare interface IPromo extends IPaywall {
    startAt: string;
    endAt: string;
}

declare interface IProduct {
    heading: string;
    benefits: string[];
    tier: "standard" | "premium";
    currency: string;
    pricing: IPlan[];
    smallPrint?: string;
}
