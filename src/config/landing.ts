/**
 * Landing page copy — transcribed verbatim from Figma node 1:3.
 *
 * Kept as data rather than inline JSX so the same content can later be served
 * from a CMS endpoint through `services/api.ts` without touching the layout.
 * Do not reword; this is the designer's copy.
 */

export const HERO = {
  badge: "Latest Cloud Ecosystem",
  /** Rendered in white (node 1:57). */
  titleLead: ["Unleash the", "Power of"],
  /** Rendered with the cyan gradient. */
  titleAccent: ["AI & High-", "Performance", "Computing"],
  body:
    "Panda Cloud provides world-class GPU infrastructure, combining flexible cloud " +
    "computing solutions, sustainable energy, and specialized financial services. " +
    "Build your digital future on the most solid foundation.",
  primaryCta: { label: "Explore Services", href: "/gpu-renting" },
  secondaryCta: { label: "Contact for Consultation", href: "/hyperscale" },
} as const;

export const ABOUT = {
  eyebrow: "About Panda Cloud.AI",
  title: "We build and operate the physical foundation of AI.",
  paragraphs: [
    "With over fifteen years across high-performance computing, data centers, cloud, GPUs, energy, land and investments, our team has worked every layer of the stack — from securing power and sites to deploying compute, delivering it as cloud, and structuring the capital behind it.",
    "That range is the point. AI infrastructure sits at the intersection of hardware, real estate, and energy, and deals fail when those pieces are handled in isolation. Panda Cloud.AI brings them together.",
  ],
  principles: [
    { label: "15+ years", detail: "Across the full infrastructure stack" },
    { label: "One integrated view", detail: "Hardware, sites, energy and capital" },
    { label: "Long-term by design", detail: "Structures built to hold up" },
  ],
  closing:
    "Every deal we structure is built around the client's economics first. We take a long view: we would rather build one relationship that lasts a decade than close ten transactions that don't. Our clients come back because the structures we put in place hold up.",
} as const;

export const ECOSYSTEM = {
  eyebrow: "Service Ecosystem",
  subtitle:
    "Comprehensive solutions meeting all needs for computing power and digital infrastructure.",
} as const;

export interface ServiceCard {
  id: string;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  /** Figma node id of the card's icon — see docs/FIGMA_ASSETS.md. */
  iconNode: string;
}

/** Order matches the bento layout in node 1:102. */
export const SERVICES: readonly ServiceCard[] = [
  {
    id: "gpu-renting",
    title: "GPU Renting",
    description:
      "Instant access to thousands of latest generation GPUs (H100, A100) on a flexible " +
      "cloud platform. Cost optimization, no initial infrastructure investment needed.",
    linkLabel: "Rent now",
    href: "/gpu-renting",
    iconNode: "1:132",
  },
  {
    id: "buy-hardware",
    title: "Buy Hardware",
    description:
      "Providing genuine hardware equipment, dedicated servers, and AI components with a " +
      "reputable global supply network.",
    linkLabel: "View catalog",
    href: "/buy-gpu",
    iconNode: "1:105",
  },
  {
    id: "energy-land",
    title: "Energy & Land",
    description:
      "Consulting and providing land for building Tier III/IV standard Data Centers, " +
      "accompanied by green and sustainable energy solutions.",
    linkLabel: "Learn more",
    href: "/energy-land",
    iconNode: "1:118",
  },
  {
    id: "financing",
    title: "Financing & Leasing",
    description:
      "Flexible financial solutions helping businesses easily own or long-term lease " +
      "high-tech equipment. Optimize cash flow and increase competitive advantage.",
    linkLabel: "Learn more",
    href: "/financing",
    iconNode: "1:146",
  },
] as const;

export interface Metric {
  value: string;
  label: string;
}

/** Node 1:6 — 2×2 grid. */
export const METRICS: readonly Metric[] = [
  { value: "10,240+", label: "GPUs in Operation" },
  { value: "240 MW", label: "Ready Capacity" },
  { value: "Tier III+", label: "Data Center Standard" },
  { value: "99.99%", label: "Guaranteed Uptime" },
] as const;

export interface NetworkNode {
  region: string;
  tier: string;
  /** The Taiwan row carries an accent border in the design (node 1:33). */
  primary: boolean;
}

export const NETWORK = {
  title: "Global Network",
  body:
    "Our infrastructure spans across top global tech hubs, ensuring low latency and " +
    "limitless scalability for clients.",
  nodes: [
    { region: "Taiwan", tier: "Core Node", primary: true },
    { region: "United States", tier: "Expansion Node", primary: false },
    { region: "Europe", tier: "Edge Node", primary: false },
  ] as readonly NetworkNode[],
} as const;
