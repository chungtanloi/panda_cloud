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
 * Product claims must be backed by approved evidence. GPU Rental and Purchase
 * copy remains consultation-only until their contracts and offers are released.
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
      "Panda Cloud reviews the applicable product path and identifies the evidence and approvals needed for a proposal.",
  },
  {
    title: "Review the numbers",
    description:
      "Costs, ESG score and lead times are shown before you commit, so procurement can sign off early.",
  },
  {
    title: "Deploy and scale",
    description:
      "Proceed only after the applicable offer, contract, operational readiness, and payment conditions are approved.",
  },
];

export const LANDING_USE_CASES: readonly UseCase[] = [
  {
    audience: "AI teams",
    title: "Plan dedicated compute capacity",
    description:
      "Share workload, region, quantity, and timing requirements for partner and commercial review.",
    outcomes: ["Quote-led review", "Dedicated GPU or node scope", "Offer-specific terms"],
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
      "Lead time depends on an approved offer and operator confirmation. Published capacity will be indicative until it is reconfirmed during quote review.",
  },
  {
    question: "Do I have to sign a long-term contract?",
    answer:
      "Billing unit and minimum term are offer-specific. They will be shown in an issued quote before acceptance.",
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
      "The approved offer and contract define tenancy, network, access, and security responsibilities. Panda Cloud reviews those controls before quote issue.",
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
  stats: [],
  logos: [],
  testimonials: [],
};

/* ----------------------------- GPU Renting ------------------------------- */

export const GPU_STEPS: readonly ProcessStep[] = [
  {
    title: "Share requirements",
    description: "Describe workload, quantity, region, term, and requested start date.",
  },
  {
    title: "Review an offer",
    description: "Panda Cloud reviews operator capacity and prepares approved commercial terms.",
  },
  {
    title: "Accept the quote",
    description: "Confirm the issued quote before contract and payment readiness are completed.",
  },
  {
    title: "Coordinate delivery",
    description: "Provisioning starts only after the required readiness conditions are satisfied.",
  },
];

export const GPU_FAQ: readonly FaqItem[] = [
  {
    question: "What is the difference between H100 and H200?",
    answer:
      "Both deliver 3,958 TFLOPS at FP8. The H200 has 141GB of memory and 4.8 TB/s of bandwidth versus 80GB and 3.35 TB/s, so it suits models that are memory-bound rather than compute-bound.",
  },
  {
    question: "Which GPU models are available?",
    answer:
      "Models, regions, delivery types, and quantities will appear only in approved, non-expired offers. Availability still requires operator reconfirmation.",
  },
  {
    question: "How is billing determined?",
    answer:
      "The approved offer defines billing unit, price version, minimum term, fees, and any metered overage. The issued quote records the applicable terms.",
  },
  {
    question: "Can I move to owned hardware later?",
    answer:
      "GPU Purchase is a separate procurement process. A purchase consultation is required and rental terms do not transfer automatically.",
  },
];

/* -------------------------------- Buy GPU -------------------------------- */

export const BUY_FAQ: readonly FaqItem[] = [
  {
    question: "Where is the hardware delivered?",
    answer:
      "Delivery location and responsibility must be reviewed for each procurement request and stated in an approved offer.",
  },
  {
    question: "What warranty applies?",
    answer:
      "Warranty, support, spares, exclusions, and responsible parties are offer-specific and require procurement and legal review.",
  },
  {
    question: "What are the lead times?",
    answer:
      "Lead time depends on configuration and current supply. It is stated on the quote before you commit, not after.",
  },
  {
    question: "Can you help finance the purchase?",
    answer:
      "Financing is a separate review. No leasing or staged-payment structure is promised by the purchase consultation page.",
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
