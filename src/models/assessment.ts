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
