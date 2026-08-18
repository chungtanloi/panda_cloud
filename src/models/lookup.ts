import type { DealStatus, DealVertical } from "./sales";

/**
 * Typeahead lookup wire types — `GET /api/v1/lookups/{deals,organizations,contacts,owners}`.
 *
 * Shipped by the backend on 2026-08-18 and present in `openapi.yaml`. These are
 * the operations that finally let the UI stop asking a human to paste an opaque
 * Convex id, which had been the top-ranked gap in three consecutive handoffs.
 *
 * ⚠ THE FOUR LOOKUPS DO NOT SHARE ONE AUTHORIZATION RULE. Read
 * `LOOKUP_ROLE_NOTES` below before wiring one into a screen — two of them are
 * manager/admin only, and the deals lookup is unavailable to exactly the three
 * roles that most need a deal picker.
 */

export type LookupKind = "deals" | "organizations" | "contacts" | "owners";

/** Backend rule, mirrored so a form can say so before the round trip. */
export const LOOKUP_MIN_QUERY_LENGTH = 2;
export const LOOKUP_MAX_LIMIT = 50;
export const LOOKUP_DEFAULT_LIMIT = 10;

/**
 * ⚠ Authorization, taken from `convex/lookups.ts`, not from a doc.
 *
 * - `deals` and `contacts` call `resolveKanbanScope`, which returns `all` for
 *   manager/admin, `assigned` for sales, and **fails closed** with
 *   `REQUIRES_RESOURCE_SCOPE` for legal, compliance and technical. Those three
 *   roles get a 403, so a deal picker in the Legal, Compliance or Technical
 *   workspace cannot work today.
 * - `organizations` and `owners` require manager or admin outright.
 *
 * The practical consequence: NCNDA writes are legal/manager/admin, but the
 * organization lookup that would populate a counterparty selector is
 * manager/admin. A legal user can create the agreement and cannot choose who it
 * is with. Recorded rather than worked around.
 */
export const LOOKUP_ROLE_NOTES: Record<LookupKind, string> = {
  deals: "sales (own deals), manager, admin. Legal, compliance and technical receive 403.",
  organizations: "manager, admin only.",
  contacts: "sales (own deals), manager, admin. Requires organizationId.",
  owners: "manager, admin only.",
};

export interface LookupPage<T> {
  items: readonly T[];
  nextCursor: string | null;
  isDone: boolean;
}

export interface DealLookupItem {
  dealId: string;
  title: string;
  organizationId: string;
  organizationName: string;
  status: DealStatus;
  stageId: string;
  vertical: DealVertical;
  ownerId: string;
}

export interface OrganizationLookupItem {
  organizationId: string;
  displayName: string;
  legalName: string | null;
  organizationType: string;
  status: string;
}

export interface ContactLookupItem {
  contactId: string;
  organizationId: string | null;
  fullName: string;
  jobTitle: string | null;
  email: string | null;
  status: string;
}

export interface OwnerLookupItem {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

export interface LookupQuery {
  q: string;
  limit?: number;
  cursor?: string;
}

export interface DealLookupQuery extends LookupQuery {
  status?: DealStatus;
  vertical?: DealVertical;
}

export interface ContactLookupQuery extends LookupQuery {
  /** Required by the backend; a contacts lookup without it is a 400. */
  organizationId: string;
}

/**
 * Mirrors the gateway's own validation so a component can stay quiet instead of
 * firing a request it knows will be rejected. The backend enforces this
 * regardless — this is convenience, not the control.
 */
export function isLookupQueryReady(q: string): boolean {
  return q.trim().length >= LOOKUP_MIN_QUERY_LENGTH;
}

/**
 * True when the failure means "your role may not use this lookup" rather than
 * "something went wrong". A picker that cannot work for the signed-in role must
 * say so and offer the fallback, not retry forever.
 */
export function isLookupForbidden(status: number | undefined, code: string | undefined): boolean {
  return status === 403 || code === "FORBIDDEN" || code === "REQUIRES_RESOURCE_SCOPE";
}
