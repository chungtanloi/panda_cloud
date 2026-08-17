import type { IsoDate, IsoDateTime } from "./common";

/**
 * NCNDA — Legal workspace domain (UC-015).
 *
 * ⚠ SOURCE. Every field, enum member and rule below is taken from
 * `PandaCloudBackend`:
 *
 *   - `convex/schema.ts` — `ncndaAgreements`, `ncndaDocumentVersions`
 *   - `convex/ncnda.ts`  — `upsertAgreement`, the only function that exists
 *   - `docs/system-analysis/USE_CASES.md` § UC-015
 *   - `docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md` §§ 6.2–6.3
 *
 * Nothing here is invented.
 *
 * HTTP operations are defined by the NCNDA gateway contract in `ncnda api.md`:
 * list-by-deal, upsert, detail, document list, attach, and detach.
 * The frontend adapter targets those paths and methods; backend route rollout is
 * tracked separately from this domain model.
 */

/* -------------------------------- Lifecycle ------------------------------- */

/** `ncndaAgreements.status` — all eleven, in lifecycle order. */
export type NcndaStatus =
  | "not_requested"
  | "drafting"
  | "sent"
  | "received"
  | "under_review"
  | "signed"
  | "countersigned"
  | "active"
  | "rejected"
  | "expired"
  | "cancelled";

export const NCNDA_STATUSES: readonly NcndaStatus[] = [
  "not_requested",
  "drafting",
  "sent",
  "received",
  "under_review",
  "signed",
  "countersigned",
  "active",
  "rejected",
  "expired",
  "cancelled",
];

export const NCNDA_STATUS_LABELS: Record<NcndaStatus, string> = {
  not_requested: "Not requested",
  drafting: "Drafting",
  sent: "Sent",
  received: "Received",
  under_review: "Under review",
  signed: "Signed",
  countersigned: "Countersigned",
  active: "Active",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
};

/**
 * Statuses that end the agreement's life. Kept separate from a plain list
 * because the UI disables editing on them, and "which ones are terminal" is a
 * judgement the backend has not stated — it is derived here from the lifecycle
 * diagram in ROLE_PERMISSION_MATRIX § 6.3.
 *
 * ⚠ TODO: NEEDS CLARIFICATION — the backend's `upsertAgreement` does **not**
 * enforce any transition order, so a rejected agreement can currently be set
 * back to drafting. The UI treats these as terminal for display only and does
 * not block the write, because blocking client-side would invent a rule.
 */
export const NCNDA_TERMINAL_STATUSES: readonly NcndaStatus[] = [
  "rejected",
  "expired",
  "cancelled",
];

/** `ncndaDocumentVersions.documentRole`. */
export type NcndaDocumentRole = "draft" | "redline" | "signed" | "countersigned";

export const NCNDA_DOCUMENT_ROLE_LABELS: Record<NcndaDocumentRole, string> = {
  draft: "Draft",
  redline: "Redline",
  signed: "Signed",
  countersigned: "Countersigned",
};

/* -------------------------------- Agreement ------------------------------- */

/**
 * One NCNDA agreement.
 *
 * `counterpartyName` and `dealTitle` are display fields the frontend needs and
 * the `ncndaAgreements` row does not hold — they must be resolved server-side
 * from `organizations` / `deals`, the same way `SalesCard.organizationName` is.
 * Marked here so it is obvious they are a **request to the backend**, not a
 * field that exists today.
 */
export interface NcndaAgreement {
  agreementId: string;
  dealId: string;
  /** Resolved server-side. See the note above. */
  dealTitle: string | null;
  counterpartyOrganizationId: string;
  /** Resolved server-side. See the note above. */
  counterpartyName: string | null;
  status: NcndaStatus;
  /** Required by the backend whenever status is `active`. */
  effectiveDate: IsoDate | null;
  expiresAt: IsoDateTime | null;
  sentAt: IsoDateTime | null;
  signedAt: IsoDateTime | null;
  countersignedAt: IsoDateTime | null;
  ownerId: string;
  /** Resolved server-side, like `SalesCard.ownerName`. Never render the id. */
  ownerName: string | null;
  notes: string | null;
  updatedAt: IsoDateTime;
  /** Optimistic concurrency. Mandatory on every update. */
  revision: number;
}

/** One immutable version of the agreement's document. */
export interface NcndaDocumentVersion {
  versionId: string;
  agreementId: string;
  documentId: string;
  versionNumber: number;
  documentRole: NcndaDocumentRole;
  /** At most one per agreement is current (UC-015 business rule). */
  isCurrent: boolean;
  uploadedById: string;
  uploadedByName: string | null;
  uploadedAt: IsoDateTime;
  /** Filename for display. Storage paths and signed URLs are never returned. */
  originalFilename: string | null;
}

export interface NcndaAgreementDetail extends NcndaAgreement {
  /** Newest first. Previous versions are immutable and read-only. */
  versions: readonly NcndaDocumentVersion[];
}

export interface NcndaAgreementListResponse {
  items: readonly NcndaAgreement[];
}

/**
 * Body of the upsert.
 *
 * Mirrors `convex/ncnda.ts#upsertAgreement` exactly:
 *
 *   - `expectedRevision` is **required when updating** and must be absent when
 *     creating. The backend raises VALIDATION_ERROR if an update omits it.
 *   - `status: "active"` requires `effectiveDate` in `YYYY-MM-DD`.
 *   - At most one `active` agreement per (deal, counterparty) — a second one
 *     is a 409 CONFLICT.
 */
export interface NcndaAgreementUpsert {
  /**
   * Present when updating, absent when creating — exactly as
   * `convex/ncnda.ts#upsertAgreement` declares it
   * (`agreementId: v.optional(v.id("ncndaAgreements"))`).
   */
  agreementId?: string;
  dealId: string;
  counterpartyOrganizationId: string;
  status: NcndaStatus;
  effectiveDate?: IsoDate;
  expiresAt?: IsoDateTime;
  sentAt?: IsoDateTime;
  signedAt?: IsoDateTime;
  countersignedAt?: IsoDateTime;
  ownerId: string;
  notes?: string;
  /** Omit when creating; mandatory when updating. */
  expectedRevision?: number;
}

export interface NcndaDocumentAttach {
  documentId: string;
  documentRole: NcndaDocumentRole;
}

export interface NcndaAgreementUpsertResponse {
  agreementId: string;
  revision: number;
  created: boolean;
}

/* -------------------------------- Helpers -------------------------------- */

/**
 * Client-side mirror of the backend's `active` rule, so the form can say what
 * is wrong before a round trip. The backend enforces it regardless — this is
 * convenience, not the control.
 */
export function requiresEffectiveDate(status: NcndaStatus): boolean {
  return status === "active";
}

export function isTerminalNcndaStatus(status: NcndaStatus): boolean {
  return NCNDA_TERMINAL_STATUSES.includes(status);
}

/** The single current version, or null when no document has been uploaded. */
export function currentVersion(
  agreement: NcndaAgreementDetail,
): NcndaDocumentVersion | null {
  return agreement.versions.find((version) => version.isCurrent) ?? null;
}
