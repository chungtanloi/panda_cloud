/** Static marketing copy only. GPU catalog, pricing and stock come from the API. */
export const GPU_HERO = {
  badge: "LIVE AVAILABILITY: 99.99% UPTIME",
  titleLead: "Rent dedicated GPUs",
  titleAccent: "Unstoppable Compute",
  body:
    "Deploy high-performance AI infrastructure in seconds. Access premium NVIDIA " +
    "hardware without long-term commitments or hidden fees.",
  primaryCta: { label: "Reserve a Cluster", href: "/booking" },
  secondaryCta: { label: "View Docs", href: "/infrastructure" },
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
  "No long-term lock-in",
  "Scale on demand",
  "Per-second billing",
  "Dedicated InfiniBand",
] as const;
