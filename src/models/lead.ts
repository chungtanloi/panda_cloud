import type { IsoDateTime } from "./common";
import type { UserPath } from "./auth";

/**
 * Lead capture from the marketing contact forms.
 *
 * Not part of the original Figma file — added with the extended marketing
 * sections. Kept in the same API-first shape as every other feature so the
 * backend team can implement it from docs/API_CONTRACT.md § 8.
 */

export interface LeadRequest {
  fullName: string;
  email: string;
  company?: string;
  /** Which product track the enquiry is about. */
  interest: UserPath;
  message?: string;
  /** Route the form was submitted from, e.g. "/energy-land". */
  source?: string;
}

export interface LeadResponse {
  id: string;
  reference: string;
  status: "received";
  createdAt: IsoDateTime;
}
