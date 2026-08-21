import type { IsoDate, IsoDateTime } from "./common";
import type { NcndaDocumentRole, NcndaStatus } from "./ncnda";

/**
 * Wire types for the Legal workspace queue — **CR-004, DRAFT AND UNAPPROVED**.
 *
 * ⚠ READ THIS BEFORE RELYING ON ANY TYPE IN THIS FILE.
 *
 * These shapes mirror `PandaCloudBackend/api-contracts/proposals/CR-004/`,
 * which is a proposal sitting outside `openapi.yaml`. No backend route serves
 * them yet. They are here so the Legal workspace can be built, reviewed and
 * demonstrated on the mock adapter while the contract is being decided; on the
 * HTTP adapter every one of these calls answers 404 today, which
 * `services/legalQueue.ts` handles deliberately rather than as an error.
 *
 * If the owners change the contract, this file changes with it. Nothing here is
 * an agreed field.
 *
 * ## Why the queue exists at all
 *
 * NCNDA is readable only in deal scope, and the `legal` role cannot enumerate
 * deals (`resolveKanbanScope` fails closed → 403 on the sales board). A legal
 * reviewer therefore has no route from "I signed in" to "here is my work".
 * CR-004 § 1 has the full argument.
 */

/** Named server-side filters, so "needs action" is defined once, not per client. */
export type NcndaQueueBucket = "needs_action" | "expiring" | "unassigned" | "terminal" | "all";

export const NCNDA_QUEUE_BUCKETS: readonly NcndaQueueBucket[] = [
  "needs_action",
  "expiring",
  "unassigned",
  "terminal",
  "all",
];

export const NCNDA_QUEUE_BUCKET_LABELS: Record<NcndaQueueBucket, string> = {
  needs_action: "Needs action",
  expiring: "Expiring soon",
  unassigned: "Unassigned",
  terminal: "Closed",
  all: "All",
};

/**
 * `stalest` is the default: a queue exists to surface what is stuck, and a
 * reviewer who has to re-sort on arrival was handed a changelog.
 */
export type NcndaQueueSort = "stalest" | "updated_desc" | "expiry_asc";

export const NCNDA_QUEUE_SORT_LABELS: Record<NcndaQueueSort, string> = {
  stalest: "Longest waiting",
  updated_desc: "Recently updated",
  expiry_asc: "Expiring first",
};

export interface NcndaQueueQuery {
  status?: NcndaStatus;
  bucket?: NcndaQueueBucket;
  ownerId?: string;
  /** Shorthand for `ownerId` = the authenticated user. Never send both. */
  mine?: boolean;
  dealId?: string;
  counterpartyOrganizationId?: string;
  expiringWithinDays?: number;
  updatedSince?: IsoDateTime;
  sort?: NcndaQueueSort;
  limit?: number;
  cursor?: string;
}

/**
 * One queue row: everything needed to read and act on an agreement without a
 * second request.
 */
export interface NcndaQueueItem {
  agreementId: string;
  dealId: string;
  counterpartyOrganizationId: string;
  status: NcndaStatus;
  effectiveDate: IsoDate | null;
  expiresAt: IsoDateTime | null;
  sentAt: IsoDateTime | null;
  signedAt: IsoDateTime | null;
  countersignedAt: IsoDateTime | null;
  ownerId: string;
  notes: string | null;
  revision: number;
  updatedAt: IsoDateTime;

  /** Resolved server-side. Render an em dash when null — never the id. */
  dealTitle: string | null;
  counterpartyName: string | null;
  ownerName: string | null;

  /**
   * When the current status was entered.
   *
   * ⚠ Null for rows written before CR-004 shipped and not covered by the
   * backfill. **Do not fall back to `updatedAt`** — that moves on any edit, so
   * substituting it would report a stall shorter than the real one and quietly
   * hide the oldest problems, which is the exact opposite of what this queue
   * is for.
   */
  statusChangedAt: IsoDateTime | null;

  /** Whole days in the current status. Null when unknown — render an em dash, never 0. */
  daysInStatus: number | null;

  hasCurrentDocument: boolean;
  currentDocumentRole: NcndaDocumentRole | null;

  /**
   * Statuses this agreement may move to right now, decided by the backend.
   *
   * ⚠ The frontend renders one affordance per entry and encodes no transition
   * table of its own. When the state machine changes, no frontend file changes.
   */
  allowedTransitions: readonly NcndaStatus[];
}

export interface NcndaQueuePage {
  items: readonly NcndaQueueItem[];
  nextCursor: string | null;
  isDone: boolean;
}

export interface NcndaSummaryCounts {
  byStatus: Partial<Record<NcndaStatus, number>>;
  needsAction: number;
  expiringSoon: number;
  unassigned: number;
  total: number;
}

export interface NcndaSummary {
  counts: NcndaSummaryCounts;
  generatedAt: IsoDateTime;
}

export interface NcndaTransitionRequest {
  dealId?: string;
  counterpartyOrganizationId?: string;
  ownerId?: string;
  toStatus: NcndaStatus;
  expectedRevision: number;
  /** Required by the backend when `toStatus` is `active`. */
  effectiveDate?: IsoDate;
  expiresAt?: IsoDateTime;
  /** For a transition recorded after the fact. Server clamps a future value to now. */
  occurredAt?: IsoDateTime;
  /** Required by the backend when `toStatus` is `rejected` or `cancelled`. */
  reason?: string;
  /**
   * Required. A retry of a failed submit must not be deduplicated into silence,
   * and a double submit must not record two transitions.
   */
  idempotencyKey: string;
}

export interface NcndaTransitionResponse {
  agreementId: string;
  status: NcndaStatus;
  revision: number;
  statusChangedAt: IsoDateTime;
  allowedTransitions: readonly NcndaStatus[];
}

/* -------------------------------- Helpers -------------------------------- */

/**
 * Client-side mirror of the backend's evidence rules, used only to ask for the
 * right fields **before** submitting. The backend enforces them regardless;
 * this is convenience, not the control.
 */
export function transitionRequiresEffectiveDate(toStatus: NcndaStatus): boolean {
  return toStatus === "active";
}

export function transitionRequiresReason(toStatus: NcndaStatus): boolean {
  return toStatus === "rejected" || toStatus === "cancelled";
}

/** "11 days", "1 day", or an em dash when the backend could not measure it. */
export function formatDaysInStatus(days: number | null): string {
  if (days === null) return "—";
  if (days === 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}
