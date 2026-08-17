import type { IsoDateTime } from "./common";

/**
 * KYC — Compliance workspace domain (UC-016).
 *
 * ⚠ SOURCE. Every field, enum member and rule is taken from
 * `PandaCloudBackend`:
 *
 *   - `convex/schema.ts` — `kycCases`
 *   - `convex/kyc.ts`    — `createCase`, `updateCase`
 *   - `docs/system-analysis/USE_CASES.md` § UC-016
 *   - `docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md` §§ 7.2–7.4
 *
 * The HTTP gateway is deal-scoped and exposes case plus document operations.
 * The adapter maps `{ cases }` / `{ case, documents }` envelopes and keeps
 * subject XOR and optimistic-concurrency rules visible to the UI.
 */

/* --------------------------------- Status -------------------------------- */

/** `kycCases.status` — all ten. */
export type KycStatus =
  | "not_started"
  | "requested"
  | "pending_documents"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled"
  | "provider_error";

export const KYC_STATUSES: readonly KycStatus[] = [
  "not_started",
  "requested",
  "pending_documents",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "expired",
  "cancelled",
  "provider_error",
];

export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  not_started: "Not started",
  requested: "Requested",
  pending_documents: "Pending documents",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
  provider_error: "Provider error",
};

/** `kycCases.riskLevel`. Optional on the row — a case may be unrated. */
export type KycRiskLevel = "low" | "medium" | "high" | "prohibited";

export const KYC_RISK_LEVELS: readonly KycRiskLevel[] = [
  "low",
  "medium",
  "high",
  "prohibited",
];

export const KYC_RISK_LABELS: Record<KycRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  prohibited: "Prohibited",
};

/**
 * `prohibited` is not "very high" — it is a stop. Kept as a named check so no
 * screen treats it as one more step on a scale.
 */
export function isBlockingRisk(risk: KycRiskLevel | null): boolean {
  return risk === "prohibited";
}

/* ---------------------------------- Case ---------------------------------- */

/**
 * Exactly one subject per case — organization XOR contact
 * (`convex/kyc.ts`: "Exactly one KYC subject is required").
 *
 * Modelled as a discriminated union so the impossible state — both, or
 * neither — cannot be constructed in the frontend at all.
 */
export type KycSubject =
  | { kind: "organization"; organizationId: string; displayName: string | null }
  | { kind: "contact"; contactId: string; displayName: string | null };

export interface KycCase {
  caseId: string;
  dealId: string;
  /** Resolved server-side for display, like `SalesCard.organizationName`. */
  dealTitle: string | null;
  subject: KycSubject;
  /** External verification provider. Always paired with `providerCaseId`. */
  provider: string | null;
  providerCaseId: string | null;
  status: KycStatus;
  riskLevel: KycRiskLevel | null;
  assignedToId: string | null;
  /** Resolved server-side. Never render the raw id. */
  assignedToName: string | null;
  /** Required by the backend when status is `rejected`. */
  rejectionReason: string | null;
  submittedAt: IsoDateTime | null;
  /** Required by the backend when status is `approved`. */
  verifiedAt: IsoDateTime | null;
  expiresAt: IsoDateTime | null;
  updatedAt: IsoDateTime;
  revision: number;
  documents?: readonly KycDocument[];
}

export type KycDocumentRole = "identity_document" | "proof_of_address" | "company_registration" | "beneficial_owner" | "source_of_funds" | "supporting";
export interface KycDocument { linkId: string; caseId: string; documentId: string; documentRole: KycDocumentRole; attachedBy: string; }
export interface KycDocumentAttach { documentId: string; documentRole?: KycDocumentRole; }
export interface KycDocumentListResponse { caseId: string; documents: readonly KycDocument[]; }

export interface KycCaseListResponse {
  items: readonly KycCase[];
}

/**
 * `convex/kyc.ts#createCase`.
 *
 * Rules the backend enforces, mirrored in the form for early feedback:
 *
 *   - exactly one of `subjectOrganizationId` / `subjectContactId`;
 *   - `provider` and `providerCaseId` are supplied together or not at all;
 *   - a duplicate (provider, providerCaseId) is a 409 CONFLICT;
 *   - `status` defaults to `not_started`.
 */
export interface KycCaseCreate {
  dealId: string;
  subjectOrganizationId?: string;
  subjectContactId?: string;
  provider?: string;
  providerCaseId?: string;
  status?: KycStatus;
  riskLevel?: KycRiskLevel;
  assignedTo?: string;
}

export interface KycCaseCreateResponse {
  caseId: string;
  revision: number;
}

/**
 * `convex/kyc.ts#updateCase`.
 *
 * `expectedRevision` and `status` are both required — the backend's validator
 * marks `status` non-optional, so this is a full status write on every update,
 * not a partial patch. Two conditional requirements:
 *
 *   - `rejected` requires a non-blank `rejectionReason`;
 *   - `approved` requires `verifiedAt`.
 */
export interface KycCaseUpdate {
  expectedRevision: number;
  status: KycStatus;
  riskLevel?: KycRiskLevel;
  assignedTo?: string;
  rejectionReason?: string;
  submittedAt?: IsoDateTime;
  verifiedAt?: IsoDateTime;
  expiresAt?: IsoDateTime;
}

export interface KycCaseUpdateResponse {
  caseId: string;
  revision: number;
}

/* -------------------------------- Helpers -------------------------------- */

/** Client-side mirror of the backend's conditional requirements. */
export function kycUpdateProblems(update: KycCaseUpdate): string[] {
  const problems: string[] = [];
  if (update.status === "rejected" && !update.rejectionReason?.trim()) {
    problems.push("A rejected case needs a reason.");
  }
  if (update.status === "approved" && !update.verifiedAt) {
    problems.push("An approved case needs a verification date.");
  }
  return problems;
}

export function subjectLabel(subject: KycSubject): string {
  const fallback = subject.kind === "organization" ? "Organization" : "Contact";
  return subject.displayName ?? fallback;
}
