import type { IsoDateTime } from "./common";

/**
 * GPU Cluster Booking — 5-step wizard.
 * Workload Type (1) → GPU Hardware (2) → Scale & Deployment (3)
 * → Submit Request (4) → Quote & Next Steps (5)
 *
 * PROVISIONAL: field names below are modelled from the screen names and the
 * shared wizard pattern. They are verified against Figma node-by-node as each
 * screen is implemented — see docs/FIGMA_SCREEN_MAP.md for the node IDs.
 */

export type WorkloadType = "training" | "inference" | "fine_tuning" | "rendering";

export interface WorkloadTypeStep {
  workload: WorkloadType;
}

export interface GpuModel {
  id: string;
  /** e.g. "NVIDIA H100 SXM". */
  name: string;
  vramGb: number;
  /** Price per GPU per hour in USD. */
  hourlyRateUsd: number;
  available: boolean;
}

export interface GpuHardwareStep {
  gpuModelId: string;
  gpuCount: number;
}

export type DeploymentRegion = "us_east" | "us_west" | "eu_central" | "apac_southeast";
export type CommitmentTerm = "on_demand" | "monthly" | "annual";

export interface ScaleDeploymentStep {
  region: DeploymentRegion;
  commitment: CommitmentTerm;
  /** Requested start date. */
  startDate: string;
  durationMonths: number;
}

export interface BookingContactStep {
  fullName: string;
  email: string;
  company: string;
  notes?: string;
}

export interface BookingDraft {
  workloadType?: Partial<WorkloadTypeStep>;
  gpuHardware?: Partial<GpuHardwareStep>;
  scaleDeployment?: Partial<ScaleDeploymentStep>;
  contact?: Partial<BookingContactStep>;
}

export interface BookingSubmission {
  workloadType: WorkloadTypeStep;
  gpuHardware: GpuHardwareStep;
  scaleDeployment: ScaleDeploymentStep;
  contact: BookingContactStep;
}

/** Live cost estimate shown alongside the wizard. */
export interface BookingQuote {
  id: string;
  monthlyCostUsd: number;
  totalCostUsd: number;
  effectiveHourlyRateUsd: number;
  discountPercent: number;
  /** Free-form line items rendered on the Quote screen. */
  lineItems: QuoteLineItem[];
  validUntil: IsoDateTime;
}

export interface QuoteLineItem {
  label: string;
  amountUsd: number;
}

export interface BookingRequestResult {
  id: string;
  reference: string;
  status: "received" | "in_review" | "approved" | "rejected";
  quote?: BookingQuote;
  createdAt: IsoDateTime;
}
