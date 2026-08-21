import type { MembershipRole } from "./auth";

export type AdminCounts = Record<string, number>;
export type AdminOverview = { users: { countsByStatus: AdminCounts; countsByType: AdminCounts }; memberships: { countsByRole: AdminCounts; countsByStatus: AdminCounts }; governance: { webhookEventCountsByStatus: AdminCounts }; ddConfiguration: { templateCount: number; versionCountsByStatus: AdminCounts } };

export type AdminUserSummary = { userId: string; email: string; fullName: string; userType: string; status: string; lastLoginAt: string | null; updatedAt: string; revision: number };
export type AdminUser = AdminUserSummary & { memberships: AdminMembership[] };
export type AdminUserPage = { items: AdminUserSummary[]; nextCursor?: string | null; isDone?: boolean };

export type AdminMembership = { membershipId: string; organizationId: string; user: AdminMembershipUser; role: MembershipRole; status: string; updatedAt: string; revision: number };
export type AdminMembershipUser = { userId: string; email: string; fullName: string; userType: string; status: string; lastLoginAt: string | null; updatedAt: string; revision: number };
export type AdminMembershipPage = { items: AdminMembership[]; nextCursor?: string | null; isDone?: boolean };

export type AdminOrganizationSummary = { organizationId: string; legalName: string; displayName: string; organizationType: string; registrationNumber: string | null; countryCode: string | null; websiteUrl: string | null; status: string; archivedAt: string | null; updatedAt: string; revision: number };
export type AdminOrganizationDetail = AdminOrganizationSummary & { membershipCount: number };
export type AdminOrganizationPage = { items: AdminOrganizationSummary[]; nextCursor?: string | null; isDone?: boolean };

export type AdminRoles = { roles: string[]; readOnly: boolean };
export type AdminHealth = { api: { status: string }; convex: { status: string; schemaVersion: number }; serverTime: string };
export type AdminAuditRecord = { auditId: string; actorUserId: string | null; actorType: string; action: string; resourceType: string; resourceId: string; organizationId: string | null; createdAt: string; beforeData: Record<string, string | number | boolean | null> | null; afterData: Record<string, string | number | boolean | null> | null };
export type AdminAuditPage = { items: AdminAuditRecord[]; nextCursor?: string | null; isDone?: boolean };
export type AdminIntegrationEvent = { eventId: string; provider: string; externalEventId: string; eventType: string; status: "received" | "processing" | "processed" | "ignored" | "failed"; attemptCount: number; lastAttemptAt: string | null; nextAttemptAt: string | null; retryExhausted: boolean; receivedAt: string; processedAt: string | null; lastErrorSummary: string | null };
export type AdminIntegrationEventPage = { items: AdminIntegrationEvent[]; nextCursor?: string | null; isDone?: boolean };

export type AdminUserUpdateRequest = { status: "active" | "suspended" | "disabled"; reason: string; expectedRevision: number };
export type AdminOrganizationCreateRequest = { legalName: string; displayName: string; organizationType: string; registrationNumber?: string | null; countryCode?: string | null; websiteUrl?: string | null };
export type AdminOrganizationUpdateRequest = { legalName?: string; displayName?: string; registrationNumber?: string | null; countryCode?: string | null; websiteUrl?: string | null; status?: string; archive?: boolean; restore?: boolean; reason?: string; expectedRevision: number };
export type AdminMembershipCreateRequest = { userId: string; role: MembershipRole; reason: string };
export type AdminMembershipUpdateRequest = { role?: MembershipRole; status?: string; reason: string; expectedRevision: number };

export type OrgStatus = "prospect" | "active" | "inactive" | "blocked";
export type OrgType = "cloud_panda" | "customer" | "partner" | "vendor" | "investor" | "other";
export type MembershipStatus = "invited" | "active" | "suspended" | "removed";
