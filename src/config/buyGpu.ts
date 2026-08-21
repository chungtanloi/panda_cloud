/**
 * Buy GPU page content — transcribed verbatim from Figma node 2:219.
 *
 * Note the hero headline is genuinely small (16px, node 2:226). The large
 * "Own your compute outright" wordmark visible on this screen lives *inside*
 * the mockup screenshot (node 2:231), not in page text. Verified against the
 * rendered node before implementing — do not "fix" this.
 */

export const BUY_HERO = {
  badge: "GPU PROCUREMENT CONSULTATION",
  /** Split so "compute" can be accented (node 2:226). */
  titleLead: "Own your ",
  titleAccent: "compute",
  titleTail: " outright",
  body:
    "Plan an owned GPU deployment with a requirements review covering configuration, " +
    "location, quantity, timing, commercial terms, and operational responsibilities.",
} as const;

export interface HardwareOffer {
  id: string;
  title: string;
  description: string;
  /** Small caps label above the figure, e.g. "STARTING AT". */
  priceLabel: string;
  /** Accent figure, e.g. "$28,500" or "Custom Quote". */
  priceValue: string;
  /** Dimmed suffix, e.g. "/ GPU". Omitted on non-numeric cards. */
  priceSuffix?: string;
  ctaLabel: string;
  ctaHref: string;
  /** The centre card carries a POPULAR ribbon (node 2:270). */
  popular: boolean;
  /** Figma node id of the card icon — see docs/FIGMA_ASSETS.md. */
  iconNode: string;
}

/** Node 2:233 — three cards, left to right. */
export const HARDWARE_OFFERS: readonly HardwareOffer[] = [
  {
    id: "h100-80",
    title: "NVIDIA H100 80GB",
    description: "The industry standard for generative AI and LLM training at scale.",
    priceLabel: "STARTING AT",
    priceValue: "$28,500",
    priceSuffix: "/ GPU",
    ctaLabel: "Configure Node",
    ctaHref: "/booking",
    popular: false,
    iconNode: "2:237",
  },
  {
    id: "h100-h200-mix",
    title: "H100 / H200 Mix",
    description:
      "Optimized heterogeneous clusters balancing compute power and memory bandwidth.",
    priceLabel: "STARTING AT",
    priceValue: "Custom Quote",
    ctaLabel: "Consult Engineering",
    ctaHref: "/hyperscale",
    popular: true,
    iconNode: "2:256",
  },
  {
    id: "custom-hgx",
    title: "Custom HGX Pods",
    description:
      "Turnkey supercomputing pods with integrated networking and cooling solutions.",
    priceLabel: "ARCHITECTURE",
    priceValue: "Bespoke Design",
    ctaLabel: "Request Architecture",
    ctaHref: "/hyperscale",
    popular: false,
    iconNode: "2:275",
  },
] as const;

export const COMPARISON = {
  title: "Renting vs Buying",
  subtitle: "Strategic considerations for your infrastructure scaling.",
  columns: { parameter: "PARAMETER", rent: "Rent (Cloud)", buy: "Buy (Owned)" },
  /** Node 2:303 onward. `highlight` marks the accent-coloured final row. */
  rows: [
    { parameter: "Upfront Cost", rent: "Low (OpEx)", buy: "High (CapEx)", highlight: false },
    { parameter: "Ownership", rent: "None", buy: "Full Asset Equity", highlight: false },
    {
      parameter: "Warranty & Maintenance",
      rent: "Managed by Provider",
      buy: "Manufacturer + Optional SLA",
      highlight: false,
    },
    {
      parameter: "Best For",
      rent: "Variable workloads, fast scaling",
      buy: "Sustained baselines, sovereign AI",
      highlight: true,
    },
  ],
} as const;

export const BUY_CTA = { label: "Request Purchase Consultation", href: "/buy-gpu" } as const;
