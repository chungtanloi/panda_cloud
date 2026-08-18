import type { IsoDateTime } from "./common";
import type { DocumentSummary, DocumentRole } from "./documents";

/**
 * Technical Due Diligence — consumer-side types.
 *
 * ⚠ These mirror the documented Convex domain model in
 * `PandaCloudBackend/docs/architecture/DEALFLOW_MVP_DATABASE_DESIGN.md`
 * §§ 5.3–5.4 and § 6 (`ddTemplateItems`, `dealDdAssessments`,
 * `dealDdResponses`, `documents`, `ddResponseDocuments`). Nothing here is
 * invented: every field, enum member and formula is taken from that document.
 *
 * ⚠ WIRE SURFACE — the backend gateway publishes the assessment workflow and
 * item-scoped evidence operations. Secure document transfer is modelled in
 * `models/documents.ts`; no client field selects a storage location.
 *
 *   GET    /deals/{dealId}/due-diligence/assessments              list
 *   POST   /deals/{dealId}/due-diligence/assessments              create
 *   GET    /due-diligence/assessments/{assessmentId}              detail
 *   GET    /due-diligence/assessments/{assessmentId}/progress     progress
 *   PATCH  /due-diligence/assessments/{assessmentId}/responses/{templateItemId}
 *
 * Completion/cancellation transitions remain OPEN. Nothing in this model
 * authorizes adding those operations without an accepted backend contract.
 *
 * The backend gateway is implemented. The HTTP adapter maps backend envelopes
 * (`assessments`, `assessment/items/responses`, and `materialized/live`) into
 * these consumer-side models while preserving required OCC revisions.
 *
 * Field-level shapes below are taken from
 * `PandaCloudBackend/docs/architecture/DEALFLOW_MVP_DATABASE_DESIGN.md`
 * §§ 5.3–5.4 and § 6. When a DD OpenAPI release is tagged, replace this file
 * with the generated client types (CR-007) — the contract wins on every
 * disagreement.
 */

/* ----------------------------- Template items ---------------------------- */

/** `ddTemplateItems.criticality`. */
export type DdCriticality = "critical" | "high" | "medium" | "low";

/** `ddTemplateItems.responseType`. */
export type DdResponseType =
  | "text"
  | "number"
  | "boolean"
  | "single_select"
  | "multi_select"
  | "date"
  | "document";

/**
 * One published requirement. Published template versions and their items are
 * immutable (§ 3.1), so nothing on this shape is editable from the UI.
 */
export interface DdTemplateItem {
  id: string;
  /** `IDC-001`..`IDC-056` or `DL-01`..`DL-12`; unique within the version. */
  requirementCode: string;
  /** Ordering within the version. */
  position: number;
  category: string;
  subcategory?: string;
  requirementType?: string;
  criticality: DdCriticality;
  question: string;
  /** Target or minimum expected value, when the workbook defines one. */
  targetCriteria?: string;
  unit?: string;
  responseType: DdResponseType;
  requiredEvidence?: string;
  required: boolean;
  /** Present only for `single_select` / `multi_select`. */
  options?: readonly string[];
}

/* -------------------------------- Responses ------------------------------ */

/**
 * The seven canonical statuses (§ 6). Do not add an eighth on the client —
 * the set is contractual and drives the compliance formula.
 */
export type DdResponseStatus =
  | "not_reviewed"
  | "compliant"
  | "partially_compliant"
  | "non_compliant"
  | "not_applicable"
  | "information_pending"
  | "needs_verification";

export const DD_RESPONSE_STATUSES: readonly DdResponseStatus[] = [
  "not_reviewed",
  "compliant",
  "partially_compliant",
  "non_compliant",
  "not_applicable",
  "information_pending",
  "needs_verification",
];

export const DD_RESPONSE_STATUS_LABELS: Record<DdResponseStatus, string> = {
  not_reviewed: "Not reviewed",
  compliant: "Compliant",
  partially_compliant: "Partially compliant",
  non_compliant: "Non-compliant",
  not_applicable: "Not applicable",
  information_pending: "Information pending",
  needs_verification: "Needs verification",
};

/** Union matching the item's `responseType`. */
export type DdResponseValue = string | number | boolean | readonly string[];

export interface DdResponse {
  responseId: string;
  assessmentId: string;
  templateItemId: string;
  status: DdResponseStatus;
  responseValue: DdResponseValue | null;
  comments: string | null;
  reviewedBy: string | null;
  reviewedAt: IsoDateTime | null;
  updatedAt: IsoDateTime;
  /**
   * Optimistic concurrency (§ 3.2). Send it back on every write; the backend
   * answers `409 CONFLICT` when it has moved on.
   */
  revision: number;
}

/**
 * Body of `PATCH .../responses/{templateItemId}`.
 *
 * The path is keyed by **templateItemId**, not by response id: a requirement
 * that has a server-created response row. `expectedRevision` is mandatory —
 * `DD API.md` requires it on every update and answers 409 CONFLICT when the
 * revision is stale **or the assessment is already completed/cancelled**.
 */
export interface DdResponsePatch {
  status: DdResponseStatus;
  responseValue?: DdResponseValue;
  comments?: string;
  expectedRevision: number;
}

/* ------------------------------- Assessments ----------------------------- */

/** `dealDdAssessments.status`. */
export type DdAssessmentStatus =
  | "not_started"
  | "in_progress"
  | "under_review"
  | "completed"
  | "cancelled";

export const DD_ASSESSMENT_STATUS_LABELS: Record<DdAssessmentStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  under_review: "Under review",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Materialized metrics (§ 6).
 *
 *   completionRate  = reviewedItems / totalItems
 *   complianceRate  = (compliant + 0.5 * partiallyCompliant) / applicableReviewedItems
 *   criticalFailures = count(criticality = critical AND status = non_compliant)
 *
 * A zero denominator yields `null`, **not** 0. The UI must render an em dash
 * for `null` rather than "0%", which would read as a real measurement.
 */
export interface DdMetrics {
  totalItems: number;
  reviewedItems: number;
  applicableReviewedItems: number;
  compliantItems: number;
  partiallyCompliantItems: number;
  completionRate: number | null;
  complianceRate: number | null;
  criticalFailures: number;
}

export interface DdAssessmentSummary {
  assessmentId: string;
  dealId: string;
  /** Pinned at creation; a later published version never changes it (§ 3.1). */
  templateVersionId: string;
  status: DdAssessmentStatus;
  assignedTo: string | null;
  createdBy: string;
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
  updatedAt: IsoDateTime;
  revision: number;
  /** The stored snapshot is null until the backend has materialized it. */
  metrics: DdMetrics | null;
}

/** `GET /due-diligence/assessments/{assessmentId}` — detail. */
export interface DdAssessmentDetail extends DdAssessmentSummary {
  items: readonly DdTemplateItem[];
  responses: readonly DdResponse[];
}

/**
 * `GET /deals/{dealId}/due-diligence/assessments` — list.
 *
 * An envelope, matching how every other list in this contract is shaped
 * (`SalesColumnListResponse`, `SalesCardPage`). `DD API.md` does not mention
 * pagination for this list, so no cursor is modelled; a deal has few
 * assessments.
 */
export interface DdAssessmentListResponse {
  items: readonly DdAssessmentSummary[];
}

/**
 * `GET /due-diligence/assessments/{assessmentId}/progress`.
 *
 * A separate operation from detail so the workspace can refresh the numbers
 * after a write without re-fetching all 68 requirements. `DD API.md`: a
 * response write recomputes progress, then the assessment summary snapshot,
 * then the deal DD summary, each bumping its own revision.
 */
export interface DdProgress {
  materialized: DdMetrics | null;
  live: DdMetrics;
  consistent: boolean;
}

/** What the two write operations return. */
export interface DdAssessmentCreateResponse {
  assessmentId: string;
  responseCount: number;
  revision: number;
}

export interface DdResponseUpdateResponse {
  responseId: string;
  /** Revision of the response row after the write. */
  revision: number;
  progress: DdMetrics;
}

/** Safe metadata for one evidence attachment. No storage location is exposed. */
export interface DdEvidenceDocument extends DocumentSummary {
  documentRole: DocumentRole;
  attachedBy: string;
}

export interface DdEvidenceListResponse {
  dealId: string;
  assessmentId: string;
  templateItemId: string;
  documents: readonly DdEvidenceDocument[];
}

export interface DdEvidenceAttachRequest {
  documentId: string;
  documentRole?: DocumentRole;
}

export interface DdEvidenceAttachResponse {
  linkId: string;
  documentId: string;
}

export interface DdEvidenceDetachResponse {
  documentId: string;
  detached: boolean;
}

export interface DdAssessmentCreate {
  /** Omit to use the current published version of the default template. */
  templateVersionId?: string;
  assignedTo?: string;
}

/* -------------------------------- Helpers -------------------------------- */

/** Renders a rate as a percentage, or an em dash when the backend sent `null`. */
export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
