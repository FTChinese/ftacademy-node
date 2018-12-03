declare interface Banner {
    coverUrl: string;
    heading: string;
    subHeading: string;
    content: string[];
}

declare interface Plan {
    tier: "standard" | "premium";
    cycle: "year" | "month";
    price: number;
    id: number;
    description: string;
    ignore?: boolean;
}

declare interface Pricing {
    standard_year: Plan;
    standard_month: Plan;
    premium_year: Plan;
}

declare interface Promotion {
    startAt: string;
    endAt: string;
    plans: Pricing;
    banner: Banner;
}

/**
 * Show original price and sale price side by side.
 */
declare interface PriceTag {
    cycle: "year" | "month";
    original: number;
    sale?: number;
}

declare interface Product {
    tier: "standard" | "premium";
    cycles: ["year", "month"];
    prices: PriceTag[];
    currency: "CNY";
    heading: string;
    benefits: string[];
    smallPrint?: string;
}