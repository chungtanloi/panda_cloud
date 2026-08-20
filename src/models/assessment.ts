import type { IsoDateTime } from "./common";

/**
 * Land Owner Assessment — a FIVE-step wizard producing a feasibility report.
 *
 * Land Profile (1) → Power Capacity (2) → Energy Source (3)
 * → Facilities & Infrastructure (4) → Assessment Results (5)
 *
 * ⚠ CONTRACT CHANGE (2026-08-12), agreed with the product owner:
 *   - `PowerCapacityStep` gained `substationDistance` and `voltage`. The
 *     earlier three-field version did not match the design.
 *   - `FacilitiesStep` is new — step 4 was missing entirely.
 *   - `LivePreview` now covers every step's output panel, not just step 3.
 * Backend must update to match; see docs/API_CONTRACT.md § 3.
 */

/* ------------------------------ Step 1 ------------------------------ */

export type LandUseType = "greenfield" | "brownfield" | "industrial" | "agricultural";

export interface LandProfileStep {
  /** Parcel size. The design labels this field "LAND SIZE (ACRES)". */
  areaAcres: number;
  landUse: LandUseType;
  /** Free-text location, e.g. "Can Tho, Vietnam". Optional in the design. */
  location?: string;
}

/* ------------------------------ Step 2 ------------------------------ */

export type GridTier = "sub_10mw" | "10_50mw" | "50_200mw" | "over_200mw";
export type SubstationDistance = "on_site" | "under_1km" | "1_5km" | "over_5km";
export type LineVoltage = "under_66kv" | "66_138kv" | "138_345kv" | "over_345kv";

export interface PowerCapacityStep {
  /** "Megawatts Available" — a banded selection, not a free number. */
  gridTier: GridTier;
  substationDistance: SubstationDistance;
  voltage: LineVoltage;
}

/* ------------------------------ Step 3 ------------------------------ */

/** The three radio cards in Figma node 2:1060. */
export type EnergyMix = "standard_grid" | "renewable_100" | "hybrid";

export interface EnergySourceStep {
  energyMix: EnergyMix;
  /** "PPA Available?" toggle — Figma node 2:1103. */
  ppaAvailable: boolean;
}

/* ------------------------------ Step 4 ------------------------------ */

export type BuildingClassification =
  | "none"
  | "warehouse"
  | "industrial"
  | "office"
  | "purpose_built";

export type FiberProximity = "on_site" | "under_1km" | "1_5km" | "over_5km" | "unknown";

export interface FacilitiesStep {
  /** Existing building footprint in square feet. 0 when the site is bare land. */
  buildingSqft: number;
  buildingClassification: BuildingClassification;
  /** Distance to the nearest dark fiber route. */
  fiberProximity: FiberProximity;
}

/* --------------------------- Aggregate draft ------------------------ */

export interface AssessmentDraft {
  landProfile?: Partial<LandProfileStep>;
  powerCapacity?: Partial<PowerCapacityStep>;
  energySource?: Partial<EnergySourceStep>;
  facilities?: Partial<FacilitiesStep>;
}

export interface AssessmentSubmission {
  landProfile: LandProfileStep;
  powerCapacity: PowerCapacityStep;
  energySource: EnergySourceStep;
  facilities: FacilitiesStep;
}

/**
 * Proposed AI Assessment integration contract.
 *
 * This is the normalized payload sent by the backend gateway to the AI
 * orchestration boundary. It deliberately mirrors the existing Land Owner
 * wizard fields so the AI layer does not create a second form or ask the user
 * to re-enter known values.
 */
export type AssessmentType = "land";

export interface LandIntakeData {
  areaAcres: number;
  landUse: LandUseType;
  location?: string | null;
  gridTier: GridTier;
  substationDistance: SubstationDistance;
  voltage: LineVoltage;
  energyMix: EnergyMix;
  ppaAvailable: boolean;
  buildingSqft: number;
  buildingClassification: BuildingClassification;
  fiberProximity: FiberProximity;
}

export type AssessmentSessionStatus =
  | "draft"
  | "in_progress"
  | "needs_information"
  | "ready_for_review"
  | "human_review"
  | "completed"
  | "stuck"
  | "needs_verification";

export interface AssessmentSession {
  sessionId: string;
  assessmentType: AssessmentType;
  status: AssessmentSessionStatus;
  revision: number;
  questionCount: number;
  paidQuestionCount?: number;
  maxPaidQuestions?: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  accessTier?: "free" | "paid";
  assessmentStage?: string;
  leadId?: string;
  paidReport?: AssessmentCompletedResult;
}

export interface AssessmentEntitlementResponse {
  accessTier: "free" | "paid";
  assessmentStage: string;
  entitlement: { status: "active" | "revoked"; productCode: string; grantedAt: number } | null;
}

export interface AssessmentCheckoutResponse {
  checkoutUrl: string;
  checkoutSessionId: string;
  amountMinor: number;
  currency: string;
  status: "pending";
}

export interface AssessmentContextSnapshot {
  knownFields: Record<string, unknown>;
  missingFields: string[];
  currentQuestion?: AssessmentQuestionResult;
}

export interface AssessmentQuestionResult {
  type: "question";
  questionId: string;
  targetField: string;
  question: string;
  evidenceRequired: boolean;
}

export interface AssessmentCompletedResult {
  type: "completed";
  summary?: string;
  overallRecommendation: "pass" | "fail" | "unknown" | "needs_verification" | "not_ready";
  informationCoveragePercent: number;
  criticalGaps: string[];
  missingEvidence: string[];
  recommendations: string[];
  needsHumanReview: boolean;
  feasibilityScore?: number;
  scoreBreakdown?: Record<string, unknown>;
  criticalBlockers?: Array<Record<string, unknown>>;
  infrastructureAssessment?: Record<string, unknown>;
  planningEvidence?: Array<Record<string, unknown>>;
  developmentPlan?: Array<Record<string, unknown>>;
  actionPlan?: Record<string, unknown>;
  salesHandoff?: Record<string, unknown>;
}

export type AssessmentMessageResult = AssessmentQuestionResult | AssessmentCompletedResult;

export interface CreateAssessmentSessionRequest {
  assessmentType: AssessmentType;
  landIntakeData: LandIntakeData;
  clientRequestId: string;
}

export interface SubmitAssessmentMessageRequest {
  clientMessageId: string;
  text: string;
  expectedSessionRevision: number;
}

export interface AssessmentSessionResponse {
  session: AssessmentSession;
  initialQuestion?: AssessmentQuestionResult;
}

export interface AssessmentSessionDetailResponse extends AssessmentSessionResponse {
  context: AssessmentContextSnapshot;
}

export interface AssessmentMessageResponse extends AssessmentSessionResponse {
  result: AssessmentMessageResult;
}

export interface AssessmentSummaryResponse extends AssessmentSessionResponse {
  summary: AssessmentCompletedResult;
}
export function toLandIntakeData(submission: AssessmentSubmission): LandIntakeData {
  return {
    areaAcres: submission.landProfile.areaAcres,
    landUse: submission.landProfile.landUse,
    location: submission.landProfile.location ?? null,
    gridTier: submission.powerCapacity.gridTier,
    substationDistance: submission.powerCapacity.substationDistance,
    voltage: submission.powerCapacity.voltage,
    energyMix: submission.energySource.energyMix,
    ppaAvailable: submission.energySource.ppaAvailable,
    buildingSqft: submission.facilities.buildingSqft,
    buildingClassification: submission.facilities.buildingClassification,
    fiberProximity: submission.facilities.fiberProximity,
  };
}

/* ------------------------- Live preview panel ----------------------- */

/**
 * Powers the "Live Output" panel on every step. The backend computes this from
 * whatever subset of the draft has been filled in so far, so each field is
 * optional — a step that has not been reached yet returns nothing for its
 * metrics and the UI renders its empty state rather than a fabricated number.
 */
export interface LivePreview {
  /** Step 1 — land viability, 0–100. */
  landViabilityScore?: number;
  /** Step 1 — the two contribution bars, pre-formatted for display. */
  landFactors?: { label: string; value: string }[];

  /** Step 2 — megawatts per acre. */
  mwDensity?: number;
  /** Step 2 — infrastructure CapEx in USD. */
  infrastructureCapexUsd?: number;
  /** Step 2 — per-component readiness, e.g. { substation: "pending" }. */
  capexBreakdown?: Record<string, "pending" | "estimated" | "confirmed">;

  /** Step 3 — letter grade shown in the ring, e.g. "A-". */
  esgScore?: string;
  /** Step 3 — 0–100, drives the arc length. */
  esgPercent?: number;
  carbonFootprintTco2e?: number;
  renewableRatioPercent?: number;

  /** Step 4 — site readiness, 0–100. */
  facilityReadiness?: number;
  /** Step 4 — projected Power Usage Effectiveness, e.g. 1.15. */
  projectedPue?: number;
  /** Step 4 — usable rack density in kW per rack. */
  rackDensityKw?: number;
  /** Step 4 — available network capacity, pre-formatted e.g. "400 Gbps". */
  networkCapacity?: string;
}

/** Everything filled in so far. The backend computes what it can. */
export type LivePreviewRequest = AssessmentDraft;

/* ------------------------------ Result ------------------------------ */

export interface AssessmentResult {
  id: string;
  status: "pending" | "complete";
  /** 0–100, shown as "78/100". */
  viabilityScore: number;
  /** Chip under the score, e.g. "Status: Favorable". */
  viabilityLabel: string;
  /** Pre-formatted range, e.g. "10-50". */
  mwDensityRange: string;
  /** Pre-formatted range in months, e.g. "14-18". */
  timelineMonths: string;
  /** Initial investment in USD. */
  capexEstimateUsd: number;
  risks: AssessmentRisk[];
  /** Signed URL for the generated PDF, present once status is "complete". */
  reportUrl?: string;
  createdAt: IsoDateTime;
}

export interface AssessmentRisk {
  title: string;
  body: string;
  severity: "low" | "medium" | "high";
}
