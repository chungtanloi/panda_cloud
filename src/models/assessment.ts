import type { IsoDateTime } from "./common";

/**
 * Land Owner Assessment — a 3-step wizard that produces an ESG/feasibility
 * result. Screens: Land Profile (1) → Power Capacity (2) → Energy Source (3)
 * → Assessment Results.
 */

/* ------------------------------ Step 1 ------------------------------ */

export type LandUseType = "greenfield" | "brownfield" | "industrial" | "agricultural";

export interface LandProfileStep {
  /** Free-text location, e.g. "Can Tho, Vietnam". */
  location: string;
  /** Total parcel size in hectares. */
  areaHectares: number;
  landUse: LandUseType;
  /** Whether the parcel already has a grid interconnection agreement. */
  hasGridAccess: boolean;
}

/* ------------------------------ Step 2 ------------------------------ */

export type GridTier = "sub_10mw" | "10_50mw" | "50_200mw" | "over_200mw";

export interface PowerCapacityStep {
  /** Contracted or available capacity in megawatts. */
  availableMw: number;
  gridTier: GridTier;
  /** Whether on-site substation exists. */
  hasSubstation: boolean;
  /** Months until power can be delivered. */
  leadTimeMonths: number;
}

/* ------------------------------ Step 3 ------------------------------ */

/** Matches the three radio cards in Figma node 2:1060. */
export type EnergyMix = "standard_grid" | "renewable_100" | "hybrid";

export interface EnergySourceStep {
  energyMix: EnergyMix;
  /** "PPA Available?" toggle — Figma node 2:1103. */
  ppaAvailable: boolean;
}

/* --------------------------- Aggregate draft ------------------------ */

export interface AssessmentDraft {
  landProfile?: Partial<LandProfileStep>;
  powerCapacity?: Partial<PowerCapacityStep>;
  energySource?: Partial<EnergySourceStep>;
}

export interface AssessmentSubmission {
  landProfile: LandProfileStep;
  powerCapacity: PowerCapacityStep;
  energySource: EnergySourceStep;
}

/* ------------------------- Live preview panel ----------------------- */

/**
 * Powers the "Live Output" panel (Figma node 2:1106). Recomputed by the
 * backend whenever the user changes a step-3 input.
 */
export interface LivePreview {
  /** Letter grade shown in the ring, e.g. "A-". */
  esgScore: string;
  /** 0–100, drives the circular progress arc. */
  esgPercent: number;
  /** Tonnes of CO2 equivalent per year. */
  carbonFootprintTco2e: number;
  /** 0–100. */
  renewableRatioPercent: number;
}

export interface LivePreviewRequest {
  energyMix: EnergyMix;
  ppaAvailable: boolean;
  availableMw?: number;
}

/* ------------------------------ Result ------------------------------ */

export interface AssessmentResult {
  id: string;
  status: "pending" | "complete";
  esgScore: string;
  esgPercent: number;
  carbonFootprintTco2e: number;
  renewableRatioPercent: number;
  /** Estimated annual revenue in USD. */
  estimatedAnnualRevenueUsd: number;
  /** Suggested next actions rendered on the Results screen. */
  recommendations: string[];
  createdAt: IsoDateTime;
}
