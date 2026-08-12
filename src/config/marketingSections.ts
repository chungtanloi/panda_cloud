import type { FaqItem } from "@/components/marketing/sections/FaqAccordion";
import type { ProcessStep } from "@/components/marketing/sections/HowItWorks";
import type { ProofStat, Testimonial } from "@/components/marketing/sections/SocialProof";
import type { UseCase } from "@/components/marketing/sections/UseCases";

/**
 * Copy for the extended marketing sections.
 *
 * ⚠ NOT from the Figma file. These sections were added on request because the
 * original frames were too thin to sell — Energy & Land had only two sections.
 * If the designer later extends the Figma file, the design wins and this
 * content should be reconciled against it.
 *
 * Everything here is grounded in claims the original design already makes
 * (99.99% uptime, Tier III+, 240 MW ready capacity, the four product tracks).
 * No customer names, logos or quotes are invented — see SOCIAL_PROOF below.
 */

/* ------------------------------- Landing -------------------------------- */

export const LANDING_STEPS: readonly ProcessStep[] = [
  {
    title: "Tell us your workload",
    description:
      "Answer a short assessment about capacity, timeline and energy profile. Takes about five minutes.",
  },
  {
    title: "Get a matched plan",
    description:
      "We return available hardware, sites and pricing that fit your constraints — not a generic catalogue.",
  },
  {
    title: "Review the numbers",
    description:
      "Costs, ESG score and lead times are shown before you commit, so procurement can sign off early.",
  },
  {
    title: "Deploy and scale",
    description:
      "Provision from the dashboard and add capacity as demand grows, without renegotiating from scratch.",
  },
];

export const LANDING_USE_CASES: readonly UseCase[] = [
  {
    audience: "AI teams",
    title: "Train without buying a data centre",
    description:
      "Reach thousands of current-generation GPUs on demand and release them when the run finishes.",
    outcomes: ["No long-term lock-in", "Per-second billing", "Dedicated InfiniBand fabric"],
  },
  {
    audience: "Land owners",
    title: "Turn power and land into revenue",
    description:
      "Find out what your parcel is worth to an AI data centre before committing to any development spend.",
    outcomes: ["Free feasibility assessment", "ESG score included", "No obligation to proceed"],
  },
  {
    audience: "Operators",
    title: "Build to Tier III+ from day one",
    description:
      "Site selection, cooling design and grid interconnection handled as one workstream rather than three.",
    outcomes: ["Pre-secured megawatts", "Cooling and PUE modelling", "RFP support"],
  },
];

export const LANDING_FAQ: readonly FaqItem[] = [
  {
    question: "How quickly can I get GPUs?",
    answer:
      "Cloud capacity is available immediately for the hardware marked live on the GPU Renting page. Dedicated clusters and owned hardware depend on configuration and shipping — the quote states the lead time before you commit.",
  },
  {
    question: "Do I have to sign a long-term contract?",
    answer:
      "No. Rented capacity is billed per second with no minimum term. Longer commitments are available and carry a discount, but they are opt-in.",
  },
  {
    question: "What does the land assessment cost?",
    answer:
      "Nothing. The assessment is free and carries no obligation. You receive an ESG score, an estimated carbon footprint and an indicative annual revenue figure.",
  },
  {
    question: "Where is the infrastructure located?",
    answer:
      "Live sites are in Taiwan (Hsinchu Science Park) and Norway (Oslo), with a 300 MW site in Dallas, Texas coming online. Full specifications are on the Energy & Land page.",
  },
  {
    question: "How is my data isolated?",
    answer:
      "Dedicated clusters are physically separate — you are not sharing a GPU with another tenant. Networking is isolated per customer on dedicated InfiniBand.",
  },
];

/**
 * ⚠ Stats only. `logos` and `testimonials` are deliberately left empty so the
 * components render their "pending real content" placeholder instead of
 * fabricated endorsements. Fill these from the approved customer list.
 */
export const SOCIAL_PROOF: {
  stats: readonly ProofStat[];
  logos: readonly string[];
  testimonials: readonly Testimonial[];
} = {
  stats: [
    { value: "10,240+", label: "GPUs in operation" },
    { value: "240 MW", label: "Ready capacity across live sites" },
    { value: "99.99%", label: "Guaranteed uptime" },
  ],
  logos: [],
  testimonials: [],
};

/* ----------------------------- GPU Renting ------------------------------- */

export const GPU_STEPS: readonly ProcessStep[] = [
  {
    title: "Pick your hardware",
    description: "Choose H100, H200 or B200 and the allocation window that matches your run.",
  },
  {
    title: "Reserve the cluster",
    description: "Capacity is held while you confirm. Nothing bills until the instance starts.",
  },
  {
    title: "Connect and run",
    description:
      "Standard tooling, dedicated InfiniBand between nodes, no proprietary runtime to adopt.",
  },
  {
    title: "Scale or stop",
    description: "Add nodes mid-project or release everything — billing stops at the second.",
  },
];

export const GPU_FAQ: readonly FaqItem[] = [
  {
    question: "What is the difference between H100 and H200?",
    answer:
      "Both deliver 3,958 TFLOPS at FP8. The H200 has 141GB of memory and 4.8 TB/s of bandwidth versus 80GB and 3.35 TB/s, so it suits models that are memory-bound rather than compute-bound.",
  },
  {
    question: "Is B200 available now?",
    answer:
      "B200 is early access. Pricing is by enquiry and allocation is limited — talk to sales about your timeline.",
  },
  {
    question: "How does per-second billing work?",
    answer:
      "You are charged for the exact runtime of the instance. There is no rounding up to the hour and no minimum charge.",
  },
  {
    question: "Can I move to owned hardware later?",
    answer:
      "Yes. Rented usage can be credited against a purchase — see the Buy GPU page for the trade-offs between OpEx and CapEx.",
  },
];

/* -------------------------------- Buy GPU -------------------------------- */

export const BUY_FAQ: readonly FaqItem[] = [
  {
    question: "Where is the hardware delivered?",
    answer:
      "To your facility, or racked at one of ours if you prefer colocation. Both options are quoted separately so you can compare.",
  },
  {
    question: "What warranty applies?",
    answer:
      "Manufacturer warranty applies as standard. An optional SLA adds on-site support and spares — this is the main practical difference from renting, where maintenance sits with the provider.",
  },
  {
    question: "What are the lead times?",
    answer:
      "Lead time depends on configuration and current supply. It is stated on the quote before you commit, not after.",
  },
  {
    question: "Can you help finance the purchase?",
    answer:
      "Yes. Leasing and staged-payment structures are available so a cluster does not have to land as a single capital event. See the Financing page.",
  },
];

/* ----------------------------- Energy & Land ----------------------------- */

export const ENERGY_STEPS: readonly ProcessStep[] = [
  {
    title: "Share your site",
    description:
      "Location, parcel size and whether a grid interconnection agreement is already in place.",
  },
  {
    title: "Confirm power",
    description:
      "Available megawatts, substation status and how long until power can actually be delivered.",
  },
  {
    title: "Set the energy mix",
    description:
      "Grid, renewable or hybrid supply, plus any PPA. This drives the ESG score and carbon figure.",
  },
  {
    title: "Get your assessment",
    description:
      "An ESG grade, estimated annual revenue and concrete next steps — free, with no obligation.",
  },
];

export const ENERGY_USE_CASES: readonly UseCase[] = [
  {
    audience: "Land owners",
    title: "Find out what your parcel is worth",
    description:
      "Before spending on feasibility consultants, get an indicative valuation based on power, land and energy profile.",
    outcomes: ["Free assessment", "No development commitment", "Results in minutes"],
  },
  {
    audience: "Developers",
    title: "De-risk site selection",
    description:
      "Compare candidate sites on the criteria that actually gate a data centre: megawatts, lead time and cooling viability.",
    outcomes: ["Substation capacity data", "Energization timelines", "Cooling suitability"],
  },
  {
    audience: "Operators",
    title: "Move into a ready site",
    description:
      "Skip greenfield entirely and take space at a location where power is already secured and energized.",
    outcomes: ["Live sites in Taiwan and Norway", "Tier III+ standard", "Direct-to-chip cooling"],
  },
];

export const ENERGY_FAQ: readonly FaqItem[] = [
  {
    question: "What does 'energization' mean?",
    answer:
      "The date power can actually be delivered to the site. It is the constraint that most often decides a data centre timeline, which is why it is listed on every site card.",
  },
  {
    question: "Do I need a PPA already in place?",
    answer:
      "No. A Power Purchase Agreement improves your ESG score and reduces residual emissions, but the assessment works either way and will show you the difference.",
  },
  {
    question: "What is a Core versus Expansion node?",
    answer:
      "Core nodes are fully energized and operating today. Expansion nodes are contracted and under construction. Edge nodes serve latency-sensitive workloads closer to users.",
  },
  {
    question: "How is the ESG score calculated?",
    answer:
      "From your energy mix, PPA status and available capacity. The letter grade, carbon footprint in tCO2e per year and renewable ratio update live as you change inputs during the assessment.",
  },
  {
    question: "Is the assessment binding?",
    answer:
      "No. It is a free feasibility indication. Nothing commits you to develop, lease or sell.",
  },
];
