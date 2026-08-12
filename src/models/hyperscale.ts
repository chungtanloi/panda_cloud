import type { IsoDateTime } from "./common";

/**
 * Hyperscale Data Center — 4-step wizard.
 * Project Stage (1) → Capacity & Cooling (2) → Geography & Timeline (3)
 * → RFP & Consultation (4)
 *
 * PROVISIONAL: verified against Figma as each screen is implemented.
 */

export type ProjectStage = "concept" | "site_selected" | "permitted" | "under_construction";

export interface ProjectStageStep {
  stage: ProjectStage;
}

export type CoolingType = "air" | "liquid_immersion" | "direct_to_chip" | "hybrid";

export interface CapacityCoolingStep {
  /** Target IT load in megawatts. */
  itLoadMw: number;
  cooling: CoolingType;
  /** Target Power Usage Effectiveness, e.g. 1.15. */
  targetPue: number;
}

export interface GeographyTimelineStep {
  country: string;
  region: string;
  /** Target go-live date. */
  targetOnlineDate: string;
  /** Whether the site must be in a specific latency zone. */
  latencyCritical: boolean;
}

export interface RfpConsultationStep {
  fullName: string;
  email: string;
  company: string;
  role: string;
  /** Free-text requirements captured on the final step. */
  requirements?: string;
  requestConsultation: boolean;
}

export interface HyperscaleDraft {
  projectStage?: Partial<ProjectStageStep>;
  capacityCooling?: Partial<CapacityCoolingStep>;
  geographyTimeline?: Partial<GeographyTimelineStep>;
  rfpConsultation?: Partial<RfpConsultationStep>;
}

export interface HyperscaleSubmission {
  projectStage: ProjectStageStep;
  capacityCooling: CapacityCoolingStep;
  geographyTimeline: GeographyTimelineStep;
  rfpConsultation: RfpConsultationStep;
}

export interface HyperscaleResult {
  id: string;
  reference: string;
  status: "received" | "in_review" | "scheduled";
  /** Populated once a consultation slot is booked. */
  consultationAt?: IsoDateTime;
  createdAt: IsoDateTime;
}
