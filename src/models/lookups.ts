import type { DealStatus, DealVertical } from "./sales";

/**
 * Authorized selector DTOs from the frozen `/api/v1/lookups/*` operations.
 * They are display aids only; each mutation remains authorized by the backend.
 */
export interface LookupPage<T> {
  items: T[];
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
  legalName: string;
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
  role: "sales" | "manager" | "admin";
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
  organizationId: string;
}
