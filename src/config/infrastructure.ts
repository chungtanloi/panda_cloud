import type { FaqItem } from "@/components/marketing/sections/FaqAccordion";

/**
 * Infrastructure page content — transcribed from the exported screenshot of
 * Figma node 2:701 (`Infrastuce.png`).
 *
 * As with Financing, the MCP export was unavailable so text was read from a
 * low-resolution image. The technical specification strings marked ⚠ are the
 * least legible and should be confirmed against Figma.
 */

export const INFRA_HERO = {
  badge: "HARDWARE PROCUREMENT ACTIVE",
  titleLead: "Source the ",
  titleAccent: "infrastructure",
  titleTail: " behind the racks",
  body:
    "Enterprise-grade hardware components for high-density AI clusters. Procure transformers, " +
    "advanced cooling, and high-throughput networking gear with transparent lead times.",
  primaryCta: { label: "View Inventory", href: "#inventory" },
  secondaryCta: { label: "Contact Sales", href: "#enquiry" },
} as const;

export const INVENTORY = {
  title: "Available Infrastructure",
  subtitle: "Global supply chain verified. Real-time availability metrics.",
  columns: {
    component: "COMPONENT TYPE",
    specs: "TECHNICAL SPECIFICATIONS",
    leadTime: "LEAD TIME",
    action: "ACTION",
  },
  actions: { filter: "Filter", export: "Export List" },
  ctaLabel: "Request Quote",
} as const;

export interface InventoryItem {
  id: string;
  name: string;
  /** Small dim line under the name. */
  category: string;
  /** ⚠ Confirm against Figma — smallest text in the export. */
  specs: readonly string[];
  leadTime: string;
  /** Drives the lead-time chip colour: shorter lead times read as healthier. */
  availability: "fast" | "standard" | "long";
}

/** Table rows, top to bottom, from node 2:701. */
export const INVENTORY_ITEMS: readonly InventoryItem[] = [
  {
    id: "transformers",
    name: "Transformers",
    category: "Power Distribution",
    specs: ["2.5 – 10 MVA", "Oil-immersed", "Cast Resin"],
    leadTime: "12–16 Weeks",
    availability: "long",
  },
  {
    id: "cooling",
    name: "Cooling Systems",
    category: "Thermal Management",
    specs: ["In-Row CRAH", "Rear Door HX", "Liquid-to-Chip"],
    leadTime: "4–6 Weeks",
    availability: "fast",
  },
  {
    id: "network",
    name: "Network Gear",
    category: "High Throughput",
    specs: ["400G HDR InfiniBand", "800G Ethernet", "Optical Transceivers"],
    leadTime: "8–12 Weeks",
    availability: "standard",
  },
  {
    id: "racks",
    name: "Racks & PDUs",
    category: "Physical Infrastructure",
    specs: ["42U–52U Racks", "Intelligent PDUs", "Busways"],
    leadTime: "2–4 Weeks",
    availability: "fast",
  },
];

/**
 * Not in the Figma screenshot — added for the same reason as on the other
 * marketing pages. Answers stay within claims the design already makes
 * (transparent lead times, verified supply chain, Tier III+ standard).
 */
export const INFRA_FAQ: readonly FaqItem[] = [
  {
    question: "Are the lead times guaranteed?",
    answer:
      "They are current supply-chain estimates, refreshed against our vendors rather than published once and left. The committed date is fixed on the quote, before you order.",
  },
  {
    question: "Can you supply a full build rather than components?",
    answer:
      "Yes. Component-level procurement is what this page covers; a complete Tier III+ build, including site and cooling design, goes through the Hyperscale Data Center track.",
  },
  {
    question: "What does 'supply chain verified' mean?",
    answer:
      "Components are sourced through vetted vendors with traceable origin, so you are not buying grey-market hardware with no warranty path.",
  },
  {
    question: "Do you handle installation?",
    answer:
      "Procurement is standard. Installation and commissioning can be included for larger deployments — raise it in the quote request.",
  },
  {
    question: "Can I order a single component type?",
    answer:
      "Yes. Each row can be quoted independently; there is no requirement to take a full stack.",
  },
];
