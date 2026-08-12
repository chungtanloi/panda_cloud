import type { IsoDateTime } from "./common";

/**
 * GPU Cluster Booking — a five-step wizard.
 *
 * Workload Type (1) → GPU Hardware (2) → Scale & Deployment (3)
 * → Power & Cooling (4) → Deployment Ready (5)
 *
 * Transcribed from the exported screens: GPU.png (entry), GPU_1.png,
 * GPU_2.png, ini.png, power.png, dev.png.
 */

/* ------------------------------ Step 1 ------------------------------ */

export type WorkloadType =
  | "llm_training"
  | "fine_tuning"
  | "inference"
  | "rendering"
  | "biotech";

export interface WorkloadStep {
  workload: WorkloadType;
}

/** The recommendation panel on step 1 — computed by the backend. */
export interface WorkloadRecommendation {
  /** e.g. "NVIDIA H100 80GB". */
  gpuName: string;
  rationale: string;
  /** e.g. "8x GPUs". */
  minNodeSize: string;
  /** e.g. "3.2 Tbps Infiniband". */
  interconnect: string;
}

/* ------------------------------ Step 2 ------------------------------ */

export type GpuStockStatus = "in_stock" | "limited" | "pre_order";

export interface GpuModel {
  id: string;
  /** e.g. "H100". */
  name: string;
  /** e.g. "80GB HBM3". */
  memory: string;
  /** e.g. "Hopper". */
  architecture: string;
  stock: GpuStockStatus;
  /** Null on pre-order models, where the design shows "TBD". */
  hourlyRateUsd: number | null;
  specs: GpuSpecSheet;
}

/** The "Specs & Perf Estimate" panel. */
export interface GpuSpecSheet {
  /** e.g. 67 → "67 TFLOPS". */
  fp64TensorTflops: number;
  /** e.g. 3.35 → "3.35 TB/s". */
  memoryBandwidthTbs: number;
  /** Watts, e.g. 700. */
  tdpWatts: number;
  vram: string;
  interconnect: string;
  formFactor: string;
  /** 0–100 bar fills, so the design's relative bars stay meaningful. */
  bars: { tensor: number; bandwidth: number; tdp: number };
}

export interface HardwareStep {
  gpuModelId: string;
}

/* ------------------------------ Step 3 ------------------------------ */

export type DeploymentTarget = "asap" | "within_30d" | "within_90d" | "scheduled";
export type CommitmentTerm = "on_demand" | "monthly" | "one_year" | "three_year";

export interface ScaleStep {
  /** 8 – 1024, in powers-of-two steps. */
  gpuCount: number;
  deploymentTarget: DeploymentTarget;
  commitment: CommitmentTerm;
}

/* ------------------------------ Step 4 ------------------------------ */

export type DeploymentModel = "cloud" | "bare_metal" | "hybrid";
export type CoolingTechnology = "air" | "liquid" | "immersion";
export type SlaTier = "standard" | "enterprise" | "critical";

export interface PowerCoolingStep {
  deploymentModel: DeploymentModel;
  cooling: CoolingTechnology;
  sla: SlaTier;
}

/* --------------------------- Aggregate draft ------------------------ */

export interface BookingDraft {
  workload?: Partial<WorkloadStep>;
  hardware?: Partial<HardwareStep>;
  scale?: Partial<ScaleStep>;
  powerCooling?: Partial<PowerCoolingStep>;
}

export interface BookingSubmission {
  workload: WorkloadStep;
  hardware: HardwareStep;
  scale: ScaleStep;
  powerCooling: PowerCoolingStep;
}

/* ------------------------------- Quote ------------------------------ */

/**
 * Live run-rate shown on step 3 and the monthly commitment on step 5.
 *
 * Every figure is a number in USD — the UI formats it. `lineItems` are signed:
 * discounts are negative, so the total is always the plain sum.
 */
export interface BookingQuote {
  /** Step 3 — the per-hour panel. */
  hourly: QuoteBreakdown;
  /** Step 5 — the per-month panel. */
  monthly: QuoteBreakdown;
  /** Effective discount applied by the chosen commitment, 0–100. */
  discountPercent: number;
  validUntil?: IsoDateTime;
}

export interface QuoteBreakdown {
  lineItems: QuoteLineItem[];
  /** Sum of `lineItems`. Sent explicitly so rounding is the server's decision. */
  total: number;
}

export interface QuoteLineItem {
  label: string;
  /** Negative for discounts. */
  amountUsd: number;
}

/* ------------------------------ Result ------------------------------ */

export interface BookingRequestResult {
  id: string;
  reference: string;
  status: "reserved" | "initializing" | "active" | "cancelled";
  /** Final architecture summary shown on the Deployment Ready screen. */
  architecture: ClusterArchitecture;
  quote: BookingQuote;
  /** Signed URL for the PDF quote; absent until generated. */
  quoteUrl?: string;
  createdAt: IsoDateTime;
}

export interface ClusterArchitecture {
  /** e.g. "NVIDIA H100". */
  primaryGpu: string;
  /** e.g. "SXM5". */
  formFactor: string;
  nodeCount: number;
  interconnect: string;
  vramPerGpu: string;
  systemMemory: string;
  storage: string;
  /** e.g. "Enterprise SLA Tier 1 Active (99.99% Uptime)". */
  slaLabel: string;
}
