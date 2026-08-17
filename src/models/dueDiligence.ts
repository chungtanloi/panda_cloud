import type { IsoDate, IsoDateTime } from "./common";

/**
 * Technical Due Diligence — consumer-side types.
 *
 * ⚠ These mirror the documented Convex domain model in
 * `PandaCloudBackend/docs/architecture/DEALFLOW_MVP_DATABASE_DESIGN.md`
 * §§ 5.3–5.4 and § 6 (`ddTemplateItems`, `dealDdAssessments`,
 * `dealDdResponses`, `documents`, `ddResponseDocuments`). Nothing here is
 * invented: every field, enum member and formula is taken from that document.
 *
 * ⚠ WIRE SURFACE — `DD API.md` (repo root) defines exactly **five operations
 * over four paths**, and nothing else:
 *
 *   GET    /deals/{dealId}/due-diligence/assessments              list
 *   POST   /deals/{dealId}/due-diligence/assessments              create
 *   GET    /due-diligence/assessments/{assessmentId}              detail
 *   GET    /due-diligence/assessments/{assessmentId}/progress     progress
 *   PATCH  /due-diligence/assessments/{assessmentId}/responses/{templateItemId}
 *
 * Everything in this file is either the request/response shape of one of those
 * five, or is explicitly quarantined in the "Not on the wire" section at the
 * bottom. Nothing else may grow a service method — `DD API.md` says the
 * complete/cancel transitions are OPEN and instructs plainly: "Do NOT invent
 * POST /complete or POST /cancel."
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
  id: string;
  assessmentId: string;
  templateItemId: string;
  status: DdResponseStatus;
  responseValue?: DdResponseValue;
  comments?: string;
  reviewedBy?: string;
  reviewedAt?: IsoDateTime;
  updatedAt: IsoDateTime;
  /**
   * Optimistic concurrency (§ 3.2). Send it back on every write; the backend
   * answers `409 CONFLICT` when it has moved on.
   */
  revision: number;
  /** Evidence currently attached to this response. */
  evidence: readonly DdEvidenceLink[];
}

/**
 * Body of `PATCH .../responses/{templateItemId}`.
 *
 * The path is keyed by **templateItemId**, not by response id: a requirement
 * that has never been answered has no response row yet, so the update is an
 * upsert against the template item. `expectedRevision` is mandatory —
 * `DD API.md` requires it on every update and answers 409 CONFLICT when the
 * revision is stale **or the assessment is already completed/cancelled**.
 */
export interface DdResponsePatch {
  status?: DdResponseStatus;
  responseValue?: DdResponseValue;
  comments?: string;
  /**
   * Marks the item reviewed by the acting user.
   *
   * ⚠ TODO: NEEDS CLARIFICATION — `DD API.md` names one update operation and
   * does not say whether "respond" and "review" are separate writes or one
   * field. Until the backend confirms, the UI sends this only when the caller
   * holds `dd:review`, and a backend that ignores the field costs nothing.
   */
  markReviewed?: boolean;
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
  completionRate: number | null;
  complianceRate: number | null;
  criticalFailures: number;
}

export interface DdAssessmentSummary {
  id: string;
  dealId: string;
  dealTitle: string;
  organizationName: string;
  /** Pinned at creation; a later published version never changes it (§ 3.1). */
  templateVersionLabel: string;
  status: DdAssessmentStatus;
  assignedToName?: string;
  startedAt?: IsoDateTime;
  completedAt?: IsoDateTime;
  updatedAt: IsoDateTime;
  revision: number;
  metrics: DdMetrics;
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
export interface DdProgress extends DdMetrics {
  assessmentId: string;
  status: DdAssessmentStatus;
  /** Assessment revision the metrics were computed at. */
  revision: number;
  materialized?: DdMetrics | null;
  live?: DdMetrics;
  consistent?: boolean;
}

/** What the two write operations return. */
export interface DdAssessmentCreateResponse {
  assessmentId: string;
  revision: number;
}

export interface DdResponseUpdateResponse {
  assessmentId: string;
  templateItemId: string;
  /** Revision of the response row after the write. */
  responseRevision: number;
  /** Revision of the assessment after its summary snapshot was recomputed. */
  assessmentRevision: number;
  progress: DdMetrics;
}

/**
 * A deal eligible for a new assessment.
 *
 * ⚠ TODO: NEEDS CLARIFICATION — "Won-track" is not a defined term in the
 * source documents. `pipelineStages.stageCategory` is `open | won | lost |
 * paused` and `deals.status` is `open | won | lost | on_hold | archived`
 * (DEALFLOW § 5.2). Which stages count as "Won-track" for the purpose of
 * starting Due Diligence — only `won`, or also the late `open` stages
 * `due_diligence` / `evaluation` / `proposal` / `negotiation` — is a product
 * decision. The backend must decide and enforce it; this field only carries
 * whatever the backend says.
 */
export interface DdEligibleDeal {
  dealId: string;
  title: string;
  organizationName: string;
  stageCode: string;
  stageCategory: string;
}

export interface DdAssessmentCreate {
  dealId: string;
  /** Omit to use the current published version of the default template. */
  templateVersionId?: string;
  assignedToUserId?: string;
}

/* =========================================================================
 * NOT ON THE WIRE
 * =========================================================================
 *
 * Everything below describes a domain concept that has **no operation** in
 * `DD API.md`. It is kept because the shapes are already derived from the
 * accepted DB design and re-deriving them later wastes work — but nothing here
 * may be given a method on `DueDiligenceService`, and no screen may be built
 * that depends on fetching it.
 *
 *   Evidence / documents  — `DD API.md` line 2 puts "Evidence upload/Supabase"
 *                           explicitly OUT OF SCOPE. The `dd:evidence:upload`
 *                           permission in `config/access.ts` therefore gates a
 *                           surface that cannot exist yet.
 *   DdEligibleDeal        — no "deals eligible for DD" operation exists. A
 *                           create screen must take a dealId it already has
 *                           (e.g. from the sales board), not offer a picker.
 *   DdWorkspaceOverview   — no aggregate operation exists. The `/technical`
 *                           overview cannot be populated from the API; it must
 *                           either be derived client-side from assessments the
 *                           caller already fetched, or wait for a backend
 *                           operation. Do not invent one.
 * ========================================================================= */

/* -------------------------------- Evidence ------------------------------- */

/** `documents.malwareScanStatus`. Attachment is gated on `clean` (§ 9.3). */
export type MalwareScanStatus = "pending" | "clean" | "infected" | "failed";

/** `documents.encryptionStatus`. */
export type EncryptionStatus = "pending" | "encrypted" | "failed";

/** `ddResponseDocuments.documentRole`. */
export type DdDocumentRole = "evidence" | "report" | "approval" | "supporting";

/**
 * Document metadata as the frontend is allowed to see it.
 *
 * `objectPath`, storage credentials and signed URLs are deliberately absent:
 * "Signed URLs and storage credentials are never persisted or returned as
 * business metadata" (DEALFLOW § 3.x, collaboration workflow § 7.4).
 */
export interface DdDocument {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  malwareScanStatus: MalwareScanStatus;
  encryptionStatus: EncryptionStatus;
  uploadedByName?: string;
  uploadedAt: IsoDateTime;
}

export interface DdEvidenceLink {
  id: string;
  responseId: string;
  documentRole: DdDocumentRole;
  attachedAt: IsoDateTime;
  document: DdDocument;
}

/**
 * Step 1 of the canonical upload flow (collaboration workflow § 7.4, UC-012):
 * authorize -> signed URL -> direct browser PUT -> finalize -> scan -> attach.
 *
 * The browser never uploads binary data through the gateway.
 */
export interface DdUploadSession {
  documentId: string;
  /** Short-lived. Never stored anywhere. */
  uploadUrl: string;
  expiresAt: IsoDateTime;
  /** Headers the storage provider requires on the PUT. */
  requiredHeaders?: Readonly<Record<string, string>>;
}

export interface DdUploadSessionRequest {
  assessmentId: string;
  responseId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface DdUploadFinalizeRequest {
  documentId: string;
  /** Lowercase hex SHA-256 of the exact bytes that were PUT. */
  sha256Checksum: string;
  sizeBytes: number;
}

/* -------------------------------- Overview ------------------------------- */

/** Backs `/technical` (ROLE_PERMISSION_MATRIX § 5.2, Overview row). */
export interface DdWorkspaceOverview {
  /** Assessments currently being worked (`in_progress` or `under_review`). */
  activeAssessments: number;
  /** Items answered but not yet marked reviewed — the reviewer's queue. */
  pendingReview: number;
  /** Critical requirements answered `non_compliant`, across all assessments. */
  criticalFailures: number;
  /** Weighted across all non-cancelled assessments; `null` when there is nothing to measure. */
  completionRate: number | null;
  recent: readonly DdAssessmentSummary[];
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

/** Evidence may only be attached once the malware gate has passed (§ 9.3). */
export function canAttachEvidence(document: DdDocument): boolean {
  return document.malwareScanStatus === "clean";
}
