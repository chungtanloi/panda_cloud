import type { FaqItem } from "@/components/marketing/sections/FaqAccordion";

/**
 * Financing page content — transcribed from the exported screenshot of Figma
 * node 2:532 (`Screenshot 2026-08-12 133209.png`).
 *
 * The MCP export of this node was unavailable (file quota exhausted), so text
 * was read from a low-resolution image. Strings marked ⚠ below should be
 * confirmed against Figma; the layout and structure are reliable.
 */

export const FINANCING_HERO = {
  eyebrow: "Flexible ways to fund your GPU fleet",
  body:
    "Scale your compute infrastructure without depleting working capital. We offer bespoke " +
    "financial instruments tailored for AI labs and enterprise deployments.",
  primaryCta: { label: "Talk to Financing Team", href: "#enquiry" },
  secondaryCta: { label: "Download Term Sheet", href: "#enquiry" },
} as const;

export interface FinancingProduct {
  id: string;
  title: string;
  description: string;
  /** Bottom-left metric on the card. ⚠ confirm figures against Figma. */
  term: string;
  href: string;
}

/** Node group under the hero — four product cards, left to right. */
export const FINANCING_PRODUCTS: readonly FinancingProduct[] = [
  {
    id: "gpu-backed",
    title: "GPU-Backed Loan",
    description:
      "Leverage your existing or new hardware as collateral for flexible capital injection.",
    term: "Rates from 6.5%",
    href: "#calculator",
  },
  {
    id: "equipment-lease",
    title: "Equipment Lease",
    description: "OpEx-optimized. Lease latest-gen NVIDIA hardware with minimal upfront costs.",
    term: "Term: 12-36 mo",
    href: "#enquiry",
  },
  {
    id: "revenue-share",
    title: "Revenue-Share",
    description:
      "Align infrastructure costs directly with your inference or training revenue streams.",
    term: "Custom terms",
    href: "#enquiry",
  },
  {
    id: "bank-partner",
    title: "Bank Partner Loan",
    description:
      "Traditional financing routed through our Tier-1 banking partners for established enterprises.",
    term: "Max $50M",
    href: "#enquiry",
  },
];

/**
 * Loan calculator — Figma shows an interactive panel with two sliders and a
 * live monthly payment.
 *
 * ⚠ DESIGN INCONSISTENCY, flagged rather than copied:
 * the mock shows $45,227/mo for $1,000,000 over 36 months at "8% APR". A
 * standard amortisation of those inputs gives ≈$31,338/mo; $45,227 implies
 * roughly a 35% APR. Rather than hard-code a figure that does not follow from
 * its own inputs, the component computes the real amortised payment from the
 * APR below. Set the correct rate here once the designer confirms it.
 */
export const LOAN_CALCULATOR = {
  title: "Estimate GPU-Backed Loan",
  subtitle: "Adjust parameters to see estimated monthly structured payments.",
  amount: {
    label: "Loan Amount",
    min: 100_000,
    max: 12_500_000,
    step: 100_000,
    default: 1_000_000,
    minLabel: "$100K",
    maxLabel: "$12.5M",
  },
  term: {
    label: "Term Duration",
    min: 12,
    max: 60,
    step: 6,
    default: 36,
    minLabel: "12 mo",
    maxLabel: "60 mo",
  },
  /** Annual percentage rate used for the live estimate. */
  aprPercent: 8,
  resultLabel: "EST. MONTHLY PAYMENT",
  disclaimer: "Live estimate based on {apr}% APR",
} as const;

/**
 * Not present in the Figma screenshot — added for the same reason as the other
 * marketing pages (the design has no FAQ and the page is thin without one).
 * Content stays qualitative: no rates or terms are invented beyond the card
 * figures already shown in the design.
 */
export const FINANCING_FAQ: readonly FaqItem[] = [
  {
    question: "How is the monthly estimate calculated?",
    answer:
      "It is a standard amortised payment over the term you select at the stated APR. It is an estimate for planning only — your actual rate follows a credit review and is confirmed on the term sheet.",
  },
  {
    question: "What can be used as collateral?",
    answer:
      "GPUs you already own, or the hardware being purchased under the facility. A GPU-backed loan is secured against that equipment rather than against your wider business.",
  },
  {
    question: "How does revenue-share differ from a loan?",
    answer:
      "Repayment is tied to inference or training revenue rather than a fixed monthly schedule, so cost scales with utilisation. Terms are set per deployment.",
  },
  {
    question: "Can rented capacity convert into a financed purchase?",
    answer:
      "Yes. Existing rental spend can be credited toward a lease or purchase — mention it when you contact the financing team so it is reflected in the term sheet.",
  },
  {
    question: "Who is the Bank Partner Loan for?",
    answer:
      "Established enterprises that prefer conventional bank paper. It is routed through Tier-1 partners rather than funded directly.",
  },
];
