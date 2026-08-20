export type SubmissionSource = "website" | "referral" | "event" | "manual" | "partner" | "other";
export type SubmissionPersona = "asset_owner" | "gpu_buyer" | "investor" | "hyperscaler" | "procurement" | "other";
export type SubmissionVertical = "land" | "gpu" | "token" | "hyperscale";
export type SubmissionPriority = "low" | "normal" | "high" | "urgent";
export type SubmissionStatus = "new" | "qualified" | "converted" | "disqualified" | "nurture" | "archived";

export interface Submission {
  leadId: string;
  source: SubmissionSource;
  persona?: SubmissionPersona | null;
  vertical?: SubmissionVertical | null;
  status: SubmissionStatus;
  summary: string | null;
  updatedAt: string;
  organizationId?: string | null;
  primaryContactId?: string | null;
  createdBy?: string | null;
  convertedAt?: string | null;
  archivedAt?: string | null;
}
export interface SubmissionContact { fullName: string; email: string; phone?: string; companyName?: string; }
export interface SubmissionListResponse { leads: readonly Submission[]; continueCursor: string | null; isDone: boolean; }
export interface SubmissionCreateRequest {
  source: SubmissionSource;
  persona?: SubmissionPersona;
  vertical?: SubmissionVertical;
  summary: string;
  sourcePayload?: Record<string, string | number | boolean | null>;
  documentIds?: string[];
  idempotencyKey?: string;
  contact: SubmissionContact;
  /** Send the submission with the current Clerk session so owned documents
   * can be attached to the resulting lead. This is client transport metadata
   * and is never forwarded to the backend payload. */
  authenticated?: boolean;
}
export interface SubmissionCreateResponse extends Submission {}
export interface SubmissionConvertRequest { organizationId: string; ownerId: string; title: string; vertical: SubmissionVertical; priority: SubmissionPriority; description?: string; }
export interface SubmissionConvertResponse { leadId: string; dealId: string; dealRevision: number; leadStatus: "converted"; updatedAt: string; }
