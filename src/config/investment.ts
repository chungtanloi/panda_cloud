import type {
  InvestmentIntent,
  PaymentMethodType,
  SettlementNetwork,
} from "@/models/investment";

/**
 * AI Token Investment content, transcribed from the exported screens:
 * AI.png (landing + step 1), invest2.png (step 2), payment.png (step 3),
 * KYC.png (step 4), conf.png (step 5).
 *
 * ⚠ Step indicators are normalised to "of 5". The screens themselves read
 * 1 of 4, Phase 02/03 and Step 03/04 — see the note on models/investment.ts.
 */

export const INVESTMENT_TOTAL_STEPS = 5;

/* ------------------------------- Landing -------------------------------- */

export const INVESTMENT_LANDING = {
  badge: "Live Funding Round",
  titleLead: "AI Token ",
  titleAccent: "Investment",
  body:
    "Earn passive income from AI infrastructure. Stake your compute tokens to participate in " +
    "the high-yield GPU economy and secure your position in the future of distributed " +
    "intelligence.",
  primaryCta: { label: "Invest Now", href: "/investment/intent" },
  secondaryCta: { label: "View Prospectus", href: "/submit-request" },
  chips: ["Instant USDC settlement", "Fiat wire supported", "SEC Reg D Compliant"],
  cards: [
    {
      title: "Staking yield 8-15% APY",
      badge: "Live APR",
      body:
        "Daily payouts in USDC or compounded compute credits derived directly from global GPU " +
        "leasing revenue.",
    },
    {
      title: "Compute Redemption",
      body: "Convert tokens directly into priority H100 processing time.",
    },
    {
      title: "Asset Holding",
      body: "Tokens represent fractional ownership in physical datacenter assets.",
    },
  ],
} as const;

/* -------------------------------- Step 1 -------------------------------- */

export const STEP_INTENT = {
  title: "What are you looking for?",
  body:
    "Select your primary objective to configure your custom AI infrastructure track. You can " +
    "adjust this later.",
  exitLabel: "Exit Setup",
  options: [
    {
      value: "compute_redemption",
      title: "Compute Redemption",
      body:
        "Exchange tokens directly for high-performance GPU instances and dedicated bare-metal " +
        "rendering.",
    },
    {
      value: "staking_yield",
      title: "Staking Yield",
      body: "Lock assets into liquidity pools to secure the network and earn infrastructure-backed rewards.",
    },
    {
      value: "asset_holding",
      title: "Asset Holding",
      body:
        "Store assets securely with long-term capital appreciation in mind. Access to " +
        "ecosystem-governance.",
      wide: true,
    },
  ] as readonly { value: InvestmentIntent; title: string; body: string; wide?: boolean }[],
  panel: {
    title: "PERSONALIZED TRACK",
    empty: "Select an objective to generate your custom onboarding path.",
    cta: "INITIALIZE TRACK",
  },
} as const;

/* -------------------------------- Step 2 -------------------------------- */

export const STEP_VOLUME = {
  backLabel: "STEP 01: INTENT",
  statusRight: "SYS.SECURE",
  title: "Determine Volume",
  phaseLabel: "PHASE 02 / 05",
  allocationLabel: "CAPITAL ALLOCATION (USD)",
  sliderLabel: "ADJUST VOLUME",
  tierBadge: "MID-TIER NODE",
  /** Slider bounds read from the design's tick labels. */
  min: 1_000,
  max: 1_000_000,
  step: 1_000,
  default: 25_000,
  ticks: [
    { at: 1_000, label: "$1K (Micro)" },
    { at: 500_000, label: "$500K (Custom)" },
    { at: 1_000_000, label: "$1000K+ (Enterprise)" },
  ],
  resetLabel: "RESET",
  next: "INITIALIZE COMPUTE",
  panel: {
    title: "LIVE OUTPUT PROJECTION",
    tokenLabel: "PREDICTED TOKEN ALLOCATION",
    hashLabel: "EST. HASH RATE POWER",
    roiLabel: "5-YEAR ROI PROJECTION",
    breakEvenLabel: "Break Even",
    maxYieldLabel: "Max Yield",
  },
  footer: "© 2024 Panda Cloud Inc. Secure Transaction Gateway.",
} as const;

/* -------------------------------- Step 3 -------------------------------- */

export const STEP_PAYMENT = {
  statusRight: "SECURE CHECKOUT",
  stepLabel: "STEP 03 / 05",
  title: "Payment Method",
  body: "Record a preferred funding route for compliance follow-up. No payment or settlement occurs in this inquiry.",
  methods: [
    {
      value: "usdc",
      title: "USDC",
      body: "Record USDC and network preference for a later compliance discussion.",
      badge: "Recommended",
      networkLabel: "Select Network",
    },
    {
      value: "bank_wire",
      title: "Bank Wire",
      body: "Record bank-wire preference; Sales will provide next steps after review.",
    },
    {
      value: "credit_card",
      title: "Credit Card",
      body: "Record card preference only; no card is charged in this flow.",
    },
  ] as readonly {
    value: PaymentMethodType;
    title: string;
    body: string;
    badge?: string;
    networkLabel?: string;
  }[],
  networks: [
    { value: "polygon", label: "Polygon" },
    { value: "ethereum", label: "Ethereum" },
    { value: "arbitrum", label: "Arbitrum" },
  ] as readonly { value: SettlementNetwork; label: string }[],
  panel: {
    title: "Settlement Details",
    rows: {
      volume: "Token Allocation Volume",
      value: "Estimated USD Value",
      fee: "Network Fee (Est.)",
      time: "Settlement Time",
    },
    notice: "These are non-binding estimates. Rates are not locked and no payment or token allocation is executed.",
  },
  next: "REVIEW & EXECUTE",
  back: "BACK TO VOLUME",
} as const;

/* -------------------------------- Step 4 -------------------------------- */

export const STEP_KYC = {
  eyebrow: "COMPLIANCE",
  statusRight: "Secure Connection Active",
  title: "Identity Verification",
  body:
    "Regulatory compliance requires identity details to comply with regulatory requirements. " +
    "Your data is encrypted end-to-end and processed via distributed validation nodes.",
  classificationLabel: "INVESTOR CLASSIFICATION",
  classifications: [
    {
      value: "individual",
      title: "Individual Investor",
      body: "Investing on behalf of yourself as a natural person.",
    },
    {
      value: "institutional",
      title: "Institutional Entity",
      body: "Investing on behalf of a registered corporation or fund.",
    },
  ],
  organizationLabel: "ORGANIZATION NAME",
  organizationOptional: "OPTIONAL",
  uploadLabel: "ACCREDITED INVESTOR PROOF",
  upload: {
    title: "Drag & Drop Documents",
    body: "Upload government ID, proof of address, or accreditation certificates.",
    security: "Secure 256-bit AES encryption applied locally.",
    formats: "Supported: PDF, JPG, PNG (Max 10MB)",
  },
  progress: {
    title: "PROCESSING STATUS",
    steps: {
      secureConnection: { label: "Secure Connection", detail: "TLS 1.3 established" },
      walletSignature: { label: "Wallet Signature", detail: "0x7B_3a9B verified" },
      sourcingDocuments: { label: "Sourcing Documents", detail: "Ready for upload" },
      nodeValidation: { label: "Node Validation", detail: "Pending verification" },
    },
  },
  zkNotice: {
    title: "Zero-Knowledge Proof",
    body:
      "We use ZK-SNARKs to verify your accreditation status without moving plain-text PII on " +
      "our main servers.",
  },
  back: "Back to Payment",
  next: "VERIFY IDENTITY",
} as const;

/* -------------------------------- Step 5 -------------------------------- */

export const STEP_CONFIRMATION = {
  title: "Inquiry Received",
  body:
    "Your non-binding investment inquiry has been received. Compliance and Sales will follow up " +
    "before any payment, settlement, token allocation or investment commitment.",
  totalLabel: "ESTIMATED INTEREST",
  allocationLabel: "PROJECTED TOKEN AMOUNT",
  meta: {
    reference: "Inquiry reference",
    date: "Date",
    network: "Network",
    status: "Status",
  },
  projections: {
    title: "Projections",
    apyLabel: "Estimated APY",
    valueLabel: "5-Year Est. Value",
    liveNote: "Live GPU yield tracking enabled",
  },
  riskTitle: "RISK CONSIDERATIONS",
  riskBody:
    "All investments carry risk. Projected yields are based on current cloud compute demand and " +
    "are not guaranteed. Token values may fluctuate based on hardware depreciation and energy " +
    "costs. Please review the full prospectus.",
  actions: {
    prospectus: "Prospectus",
    expertCall: "Expert Call",
    dashboard: "Return to Panda Cloud",
  },
} as const;
