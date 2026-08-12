import type { IsoDateTime } from "./common";

/**
 * Hyperscale Data Center — a four-step wizard.
 *
 * Project Stage (1) → Capacity & Cooling (2) → Geography & Timeline (3)
 * → RFP & Consultation (4)
 *
 * ⚠ The exported screens read "STEP 2 OF 4" then "STEP 3 OF 5", and both
 * steps 2 and 3 have a "Proceed to Network(ing)" button although no Networking
 * screen exists. Confirmed with the product owner on 2026-08-12 that the flow
 * is **four steps** and those button labels were leftovers; they now name the
 * screen they actually lead to.
 */

/* ------------------------------ Step 1 ------------------------------ */

export type ProjectStage = "greenfield" | "retrofit" | "modular" | "turnkey";

export interface ProjectStageStep {
  stage: ProjectStage;
}

/** Telemetry panel on step 1. */
export interface StageAnalysis {
  /** Pre-formatted, e.g. "24-36 Months". */
  estimatedTimeline: string;
  /** Free-text impact summary. */
  impact: string;
  /** 0–100 readiness bar. */
  buildReadiness: number;
}

/* ------------------------------ Step 2 ------------------------------ */

export type CoolingArchitecture =
  | "air_hot_cold"
  | "liquid_dtc"
  | "immersion"
  | "hybrid";

export interface CapacityStep {
  /** Target IT load in megawatts, 10 – 250. */
  targetCapacityMw: number;
  cooling: CoolingArchitecture;
}

/** Live CapEx projection on step 2. */
export interface CapexProjection {
  categories: CapexCategory[];
  /** Sum of `categories`. */
  totalUsd: number;
  /** Shown as a caveat under the total. */
  note: string;
}

export interface CapexCategory {
  label: string;
  amountUsd: number;
  /** Highlighted in accent — the cooling line in the design. */
  emphasis?: boolean;
}

/* ------------------------------ Step 3 ------------------------------ */

export interface GeographyStep {
  /** Region id, e.g. "us_east_1". */
  region: string;
  /** Target go-live date, ISO-8601 date. */
  targetGoLive: string;
}

export interface RegionFacts {
  id: string;
  label: string;
  /** Pre-formatted, e.g. "140 MW". */
  availablePower: string;
  /** Pre-formatted, e.g. "Liquid-to-Chip". */
  coolingType: string;
}

/** Auto-generated Gantt shown beside the form. */
export interface DeliverySchedule {
  phases: SchedulePhase[];
  /** Days added to the critical path by the chosen date. 0 when on track. */
  criticalPathDelayDays: number;
  /** Set when the target date triggers the expedite premium. */
  expediteWarning?: string;
}

export interface SchedulePhase {
  label: string;
  detail: string;
  /** Month index the bar starts at, 0-based. */
  startMonth: number;
  /** Length of the bar in months. */
  durationMonths: number;
  status: "active" | "pending";
}

/* ------------------------------ Step 4 ------------------------------ */

export interface RfpStep {
  /** Object ids from the upload endpoint. */
  documentIds: string[];
  requestConsultation: boolean;
  /** Chosen slot, when a consultation was booked. */
  consultationSlot?: string;
}

/** Terminal-style processing log on step 4. */
export interface RfpProcessingLog {
  entries: RfpLogEntry[];
  status: "idle" | "processing" | "complete" | "failed";
}

export interface RfpLogEntry {
  /** Pre-formatted timestamp, e.g. "10:42:01". */
  time: string;
  message: string;
  /** Renders in accent when the step passed. */
  outcome?: "pass" | "fail";
}

/* --------------------------- Aggregate draft ------------------------ */

export interface HyperscaleDraft {
  projectStage?: Partial<ProjectStageStep>;
  capacity?: Partial<CapacityStep>;
  geography?: Partial<GeographyStep>;
  rfp?: Partial<RfpStep>;
}

export interface HyperscaleSubmission {
  projectStage: ProjectStageStep;
  capacity: CapacityStep;
  geography: GeographyStep;
  rfp: RfpStep;
}

export interface HyperscaleResult {
  id: string;
  reference: string;
  status: "received" | "in_review" | "scheduled";
  consultationAt?: IsoDateTime;
  createdAt: IsoDateTime;
}
