import type {
  CommitmentTerm,
  CoolingTechnology,
  DeploymentModel,
  DeploymentTarget,
  SlaTier,
  WorkloadType,
} from "@/models/booking";

/**
 * GPU Cluster Booking content, transcribed from the exported screens.
 *
 * Sources: GPU.png (entry), GPU_1.png (step 1), GPU_2.png (step 2),
 * ini.png (step 3), power.png (step 4), dev.png (step 5).
 *
 * Numbers that appear here are the design's own sample values. Prices are
 * computed at runtime from the GPU catalogue, not stored as display strings.
 */

export const BOOKING_TOTAL_STEPS = 5;

/* -------------------------------- Entry --------------------------------- */

export const BOOKING_INTRO = {
  badge: "SYSTEM ONLINE",
  titleLead: "GPU Cluster ",
  titleAccent: "Booking",
  body:
    "Rent enterprise GPUs instantly. Deploy massively parallel compute architectures with " +
    "sub-millisecond latency.",
  cards: [
    {
      title: "Real-time pricing",
      body: "Spot market rates updated dynamically based on global cluster availability.",
    },
    {
      title: "Instant deployment",
      body: "Bare-metal access provisioned in seconds. Bypass complex infrastructure setup.",
    },
    {
      title: "99.99% SLA",
      body: "Enterprise-grade reliability guaranteed by redundant global node clusters.",
    },
  ],
  chips: ["No vendor lock-in", "Dedicated InfiniBand", "Scale to zero"],
  cta: { label: "Get Quote", href: "/booking/workload" },
} as const;

/* -------------------------------- Step 1 -------------------------------- */

export interface WorkloadOption {
  value: WorkloadType;
  title: string;
  caption: string;
  /** Full-width on the grid — "Biotech Compute" in the design. */
  wide?: boolean;
}

export const STEP_WORKLOAD = {
  statusLine: "STEP 1 OF 5 // INITIALIZATION",
  titleLead: "What is your ",
  titleAccent: "primary workload?",
  body:
    "Select the primary computation profile for your cluster. Our intelligent scheduler will " +
    "optimize hardware recommendations based on this selection.",
  options: [
    { value: "llm_training", title: "LLM Training", caption: "High VRAM / High Interconnect" },
    { value: "fine_tuning", title: "Fine-tuning", caption: "Moderate VRAM / Scalable" },
    { value: "inference", title: "Inference", caption: "Low Latency / High Throughput" },
    { value: "rendering", title: "Rendering", caption: "Compute Heavy / Parallel" },
    {
      value: "biotech",
      title: "Biotech Compute",
      caption: "Molecular Dynamics / Protein Folding",
      wide: true,
    },
  ] as readonly WorkloadOption[],
  output: {
    title: "LIVE OUTPUT // SYNC",
    badge: "PREDICTING",
    sectionLabel: "TARGET ARCHITECTURE",
    minNodeLabel: "MIN. NODE SIZE",
    interconnectLabel: "INTERCONNECT",
    empty: "Select a workload to see the recommended architecture.",
  },
  next: "PROCEED TO CONFIG",
} as const;

/* -------------------------------- Step 2 -------------------------------- */

export const STEP_HARDWARE = {
  statusLine: "STEP 02/05",
  title: "GPU Hardware",
  body: "Select your preferred GPU model to provision your cluster.",
  stockLabels: {
    in_stock: "IN STOCK",
    limited: "LIMITED",
    pre_order: "PRE-ORDER",
  },
  architectureLabel: "Architecture",
  /** Shown instead of a rate on pre-order models. */
  priceTbd: "TBD",
  panel: {
    title: "Specs & Perf Estimate",
    bars: {
      tensor: "FP64 TENSOR CORE",
      bandwidth: "MEMORY BANDWIDTH",
      tdp: "TDP",
    },
    rows: { vram: "VRAM", interconnect: "Interconnect", formFactor: "Form Factor" },
    footnote: "Estimates based on reference architecture.",
    empty: "Select a GPU to see its specifications.",
  },
  back: "Back",
  next: "NEXT STEP",
} as const;

/* -------------------------------- Step 3 -------------------------------- */

export const STEP_SCALE = {
  breadcrumb: ["Cluster config", "Scale & Deployment", "Review"],
  title: "Initialize Cluster.",
  body:
    "Configure your GPU topology and deployment schedule. Resources are provisioned in tier-1 " +
    "data centers.",
  scaleCard: {
    title: "Compute Scale",
    allocationLabel: "CURRENT ALLOCATION",
    /** Slider bounds from the design: 8 → 1024 GPUs. */
    min: 8,
    max: 1024,
    minLabel: "8 GPUs",
    maxLabel: "1024 GPUs",
  },
  targetField: {
    label: "Deployment Target",
    options: [
      { value: "asap", label: "ASAP (Subject to availability)" },
      { value: "within_30d", label: "Within 30 days" },
      { value: "within_90d", label: "Within 90 days" },
      { value: "scheduled", label: "Scheduled date" },
    ] as readonly { value: DeploymentTarget; label: string }[],
  },
  commitmentField: {
    label: "Commitment Term",
    options: [
      { value: "on_demand", label: "On-demand (No commit)" },
      { value: "monthly", label: "Monthly" },
      { value: "one_year", label: "1 year" },
      { value: "three_year", label: "3 years" },
    ] as readonly { value: CommitmentTerm; label: string }[],
  },
  terminal: {
    title: "Terminal",
    badge: "LIVE CALC",
    totalLabel: "Estimated Run Rate",
    unit: "USD / HOUR",
  },
  next: "DEPLOY TOPOLOGY",
} as const;

/**
 * Commitment discounts, as a fraction of the compute base.
 *
 * ⚠ These are the frontend's working assumption, not a quoted rate. The design
 * shows a "-$65.00/hr" discount line for a 1-year term but does not state the
 * percentage, and its own figures do not add up (245.60 + 13.00 − 65.00 =
 * 193.60, while the panel displays 288.48). Rather than reproduce a total that
 * contradicts its own line items, the calculator sums what it shows. Replace
 * these rates with the real commercial terms before launch.
 */
export const COMMITMENT_DISCOUNTS: Record<CommitmentTerm, number> = {
  on_demand: 0,
  monthly: 0.08,
  one_year: 0.2,
  three_year: 0.32,
};

/** Network egress estimate per GPU per hour, in USD. Placeholder. */
export const EGRESS_PER_GPU_HOUR = 0.1;

/* -------------------------------- Step 4 -------------------------------- */

export interface OptionCard<T extends string> {
  value: T;
  title: string;
  caption: string;
  /** The design greys out options that are unsuitable for the chosen GPU. */
  discouraged?: boolean;
  discouragedReason?: string;
}

export const STEP_POWER_COOLING = {
  title: "Power & Cooling",
  body:
    "Configure environmental parameters for your cluster deployment. Optimal cooling and power " +
    "redundancy are critical for sustained H100 performance.",
  deployment: {
    title: "Deployment Model",
    options: [
      {
        value: "cloud",
        title: "Cloud",
        caption: "Fully managed infrastructure. Instant provisioning.",
      },
      {
        value: "bare_metal",
        title: "Bare Metal",
        caption: "Direct hardware access. Maximum IOPS.",
      },
      {
        value: "hybrid",
        title: "Hybrid",
        caption: "On-premise integration via Direct fiber.",
      },
    ] as readonly OptionCard<DeploymentModel>[],
  },
  cooling: {
    title: "Cooling Technology",
    options: [
      {
        value: "air",
        title: "Air Cooling",
        caption: "Not recommended for H100 density.",
        discouraged: true,
        discouragedReason: "Insufficient thermal headroom for high-density GPU racks.",
      },
      {
        value: "liquid",
        title: "Liquid Cooling",
        caption: "Direct-to-chip closed loop. 1.2 PUE.",
      },
      {
        value: "immersion",
        title: "Immersion",
        caption: "Maximum immersion. 1.05 PUE. Premium.",
      },
    ] as readonly OptionCard<CoolingTechnology>[],
  },
  summary: {
    title: "Configuration Summary",
    rows: { cluster: "Base Cluster", deployment: "Deployment", cooling: "Cooling" },
    slaTitle: "SLA Agreement",
    slaOptions: [
      { value: "standard", label: "99.5% Uptime (Standard)" },
      { value: "enterprise", label: "99.99% Uptime (Enterprise)" },
      { value: "critical", label: "99.999% Uptime (Critical)" },
    ] as readonly { value: SlaTier; label: string }[],
  },
  next: "CONFIRM CONFIGURATION",
  back: "BACK",
} as const;

/* -------------------------------- Step 5 -------------------------------- */

export const STEP_DEPLOYMENT_READY = {
  badge: "ALLOCATION SECURED",
  title: "Deployment Ready",
  body:
    "Your high-performance compute cluster has been reserved. Review the final specifications " +
    "before initialization.",
  architectureTitle: "Cluster Architecture",
  labels: {
    primaryGpu: "PRIMARY GPU",
    nodeCount: "NODE COUNT",
    instances: "instances",
    interconnect: "Interconnect",
    vram: "VRAM / GPU",
    systemMemory: "System Memory",
    storage: "Storage",
  },
  riskTitle: "Risk Considerations & Acknowledgement",
  riskBody:
    "By proceeding with this deployment, you acknowledge that cluster provisioning is binding. " +
    "Cancellation policies apply as per standard enterprise agreements. Hardware availability " +
    "is guaranteed for the selected duration upon initialization.",
  commitmentTitle: "Estimated Monthly Commitment",
  perMonth: "/mo",
  primaryCta: "Initialize Deployment",
  pdfCta: "PDF Quote",
  callCta: "Expert Call",
} as const;
