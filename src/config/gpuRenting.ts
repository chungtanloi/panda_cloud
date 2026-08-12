/**
 * GPU Renting page content — transcribed verbatim from Figma node 2:5.
 *
 * The hardware table is static marketing copy in the design, so it lives here
 * rather than behind an API. If pricing later needs to be live, swap this for
 * `api.booking.listGpuModels()` — the card component takes the same shape.
 */

export const GPU_HERO = {
  badge: "LIVE AVAILABILITY: 99.99% UPTIME",
  /** Rendered white (node 2:12). */
  titleLead: "Rent dedicated GPUs",
  /** Rendered with the cyan→white gradient, regular weight. */
  titleAccent: "Unstoppable Compute",
  body:
    "Deploy high-performance AI infrastructure in seconds. Access premium NVIDIA " +
    "hardware without long-term commitments or hidden fees.",
  primaryCta: { label: "Reserve a Cluster", href: "/booking" },
  secondaryCta: { label: "View Docs", href: "/infrastructure" },
} as const;

/** Node 2:37 — pricing period tabs. */
export const TIMEFRAMES = ["Hourly", "Daily", "Monthly", "Yearly"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export interface GpuSpec {
  label: string;
  value: string;
  /** Renders the value in accent — used for the H200's standout figure. */
  highlight?: boolean;
}

export interface GpuOffer {
  id: string;
  /** Model name, shown in accent, e.g. "H100". */
  model: string;
  /** Memory/form factor, shown dimmer, e.g. "80GB SXM". */
  variant: string;
  /** Architecture chip under the title. */
  tag: string;
  /** Accent-tinted chip instead of the neutral one. */
  tagAccent: boolean;
  specs: readonly GpuSpec[];
  /** Formatted price, or null when the card shows "Contact Sales". */
  price: string | null;
  /** Suffix beside the price, e.g. "/hr" or "Sales". */
  priceSuffix: string;
  ctaLabel: string;
  ctaHref: string;
  /** The centre card sits 16px higher and carries the RECOMMENDED ribbon. */
  featured: boolean;
  /** Figma node id of the card's icon — see docs/FIGMA_ASSETS.md. */
  iconNode: string;
}

/** Order matches the bento in node 2:46: H100, H200 (featured), B200. */
export const GPU_OFFERS: readonly GpuOffer[] = [
  {
    id: "h100",
    model: "H100",
    variant: "80GB SXM",
    tag: "NVIDIA Hopper™ Architecture",
    tagAccent: false,
    specs: [
      { label: "TFLOPS (FP8)", value: "3,958" },
      { label: "Memory Bandwidth", value: "3.35 TB/s" },
      { label: "Interconnect", value: "NVLink 900 GB/s" },
    ],
    price: "$2.89",
    priceSuffix: "/hr",
    ctaLabel: "Deploy",
    ctaHref: "/booking",
    featured: false,
    iconNode: "2:52",
  },
  {
    id: "h200",
    model: "H200",
    variant: "141GB SXM",
    tag: "High Memory Capacity",
    tagAccent: true,
    specs: [
      { label: "TFLOPS (FP8)", value: "3,958" },
      { label: "Memory Bandwidth", value: "4.8 TB/s", highlight: true },
      { label: "Interconnect", value: "NVLink 900 GB/s" },
    ],
    price: "$4.15",
    priceSuffix: "/hr",
    ctaLabel: "Deploy",
    ctaHref: "/booking",
    featured: true,
    iconNode: "2:88",
  },
  {
    id: "b200",
    model: "B200",
    variant: "180GB SXM",
    tag: "Blackwell Architecture • Early Access",
    tagAccent: true,
    specs: [
      { label: "TFLOPS (FP4)", value: "9,000" },
      { label: "Memory Bandwidth", value: "8.0 TB/s" },
      { label: "Interconnect", value: "NVLink 1.8 TB/s" },
    ],
    price: null,
    priceSuffix: "Sales",
    ctaLabel: "Inquire",
    ctaHref: "/hyperscale",
    featured: false,
    iconNode: "2:120",
  },
] as const;

/** Node 2:152 — four advantage cards. */
export const PLATFORM_ADVANTAGES = [
  "No long-term lock-in",
  "Scale on demand",
  "Per-second billing",
  "Dedicated InfiniBand",
] as const;
