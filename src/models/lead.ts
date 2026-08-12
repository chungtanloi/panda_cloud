import type { IsoDateTime } from "./common";
import type { UserPath } from "./auth";

/**
 * Lead capture from the marketing contact forms.
 *
 * Not part of the original Figma file — added with the extended marketing
 * sections. Kept in the same API-first shape as every other feature so the
 * backend team can implement it from docs/API_CONTRACT.md § 8.
 */

/** Interest chips on the Submit Request screen. */
export type LeadInterest =
  | "gpu_renting"
  | "buy_gpu"
  | "energy_land"
  | "financing"
  | "infrastructure";

export type LeadTimeline = "0_1_month" | "1_3_months" | "3_6_months" | "6_plus_months";

export type LeadBudget =
  | "under_50k"
  | "50k_250k"
  | "250k_1m"
  | "1m_5m"
  | "over_5m"
  | "undecided";

/**
 * One lead shape for every form.
 *
 * The full Submit Request screen collects all of it; the short contact form on
 * the marketing pages sends only the required fields. Keeping a single request
 * type means one endpoint and one place to maintain — the short form is a
 * display mode of the same component, not a second implementation.
 */
export interface LeadRequest {
  /* Always required. */
  contactName: string;
  email: string;
  /** At least one interest must be selected. */
  interests: LeadInterest[];

  /* Collected by the full form; optional so the short form stays short. */
  companyName?: string;
  phone?: string;
  /** GPU model id, matching `GpuModel.id`, e.g. "h100". */
  gpuType?: string;
  quantity?: number;
  timeline?: LeadTimeline;
  budget?: LeadBudget;
  /** Free-text, e.g. "No preference" or a region name. */
  locationPreference?: string;
  /** "Tell us about your use case". */
  useCase?: string;

  /** Route the form was submitted from, e.g. "/energy-land". */
  source?: string;
  /** Which product track the visitor came through, when known. */
  path?: UserPath;
}

export interface LeadResponse {
  id: string;
  reference: string;
  status: "received";
  createdAt: IsoDateTime;
}
