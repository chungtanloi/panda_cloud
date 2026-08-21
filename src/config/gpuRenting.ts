/** Static marketing copy only. GPU catalog, pricing and stock come from the API. */
export const GPU_HERO = {
  badge: "PARTNER-MANAGED GPU RENTAL",
  titleLead: "Plan dedicated GPU capacity",
  titleAccent: "with Panda Cloud",
  body:
    "Panda Cloud is preparing a quote-led rental service for dedicated GPU and node " +
    "capacity operated by approved infrastructure partners.",
  primaryCta: { label: "Request a consultation", href: "#gpu-consultation" },
  secondaryCta: { label: "Explore GPU purchase", href: "/buy-gpu" },
} as const;

/** Presentation options retained for the reusable tab component. */
export const TIMEFRAMES = ["Hourly", "Daily", "Monthly", "Yearly"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export interface GpuSpec {
  label: string;
  value: string;
  highlight?: boolean;
}

/** View model produced from the backend GpuModel response by the page adapter. */
export interface GpuOffer {
  id: string;
  model: string;
  variant: string;
  tag: string;
  tagAccent: boolean;
  specs: readonly GpuSpec[];
  price: string | null;
  priceSuffix: string;
  ctaLabel: string;
  ctaHref: string;
  featured: boolean;
  iconNode: string;
}

export const PLATFORM_ADVANTAGES = [
  "Dedicated GPU or node capacity only",
  "Availability reconfirmed before quote issue",
  "Offer-specific lead time, term, billing, and SLA",
  "Panda Cloud L1 support with disclosed operator support",
] as const;
