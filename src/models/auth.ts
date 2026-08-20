import type { IsoDateTime } from "./common";

/**
 * Identity and authorization types.
 *
 * ⚠ These mirror `PandaCloudBackend/api-contracts/components.yaml`
 * (`AuthMeResponse`, `AuthenticatedUser`, `ActiveMembership`, `MembershipRole`,
 * `UserStatus`, `UserType`). The pinned OpenAPI release is the source of truth;
 * if a shape here disagrees with the contract, the contract wins and this file
 * is the bug. Regenerate — do not hand-extend — once the Orval client ships
 * (CR-007).
 *
 * Clerk owns identity and the session. Convex `organizationMemberships` is the
 * source of truth for business roles
 * (DEALFLOW_MVP_DATABASE_DESIGN § 9.1, ADR-001 § Decision 2). The frontend never
 * sends or chooses `userId`, `organizationId`, `role`, permissions or plan.
 */

/* ------------------------------ Product track ---------------------------- */

/**
 * Which product track a visitor picked on "Choose Your Path" (Figma 2:961).
 *
 * ⚠ NEEDS CLARIFICATION (U-09). This is a **client-side routing hint only**.
 * `PUT /auth/path` has been removed: PHASE_1_FRONTEND_AUTH_HANDOFF states the
 * accepted backend model "has no approved field or endpoint for it… do not
 * encode it as authorization". Nothing persists this value today.
 */
export type UserPath =
  | "land_owner" // Land Owner Assessment
  | "gpu_renter" // GPU Cluster Booking
  | "investor" // AI Token Investment
  | "hyperscaler"; // Hyperscale Data Center

/* --------------------------------- Roles --------------------------------- */

/**
 * Canonical membership roles — `components.yaml#/components/schemas/MembershipRole`.
 * `lower_snake_case` per collaboration workflow § 7.
 */
export const MEMBERSHIP_ROLES = [
  "sales",
  "compliance",
  "legal",
  "technical",
  "manager",
  "admin",
  "super_admin",
  "customer",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/** Every role except `customer` — matches `STAFF_ROLES` in the backend. */
export const STAFF_ROLES = [
  "sales",
  "compliance",
  "legal",
  "technical",
  "manager",
  "admin",
  "super_admin",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Order used **only** to pick a landing route when an identity holds several
 * active staff memberships.
 *
 * ⚠ NEEDS CLARIFICATION (U-03): no source document defines a precedence. This
 * affects the default redirect only — access itself is evaluated against the
 * whole role set, never against a single "primary" role.
 */
export const WORKSPACE_ROLE_PRECEDENCE: readonly MembershipRole[] = [
  "super_admin",
  "admin",
  "manager",
  "sales",
  "technical",
  "legal",
  "compliance",
  "customer",
];

/**
 * Fail-closed role parsing.
 *
 * PHASE_1_FRONTEND_AUTH_HANDOFF requires "safe handling for all values and an
 * unknown-value fallback before contract approval". An unrecognised role
 * returns `null` and therefore grants nothing — it is never coerced into a
 * role that happens to be nearby.
 */
export function normalizeMembershipRole(value: unknown): MembershipRole | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toLowerCase();
  return (MEMBERSHIP_ROLES as readonly string[]).includes(candidate)
    ? (candidate as MembershipRole)
    : null;
}

export function isStaffRole(role: MembershipRole): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/* -------------------------------- Identity ------------------------------- */

export type UserStatus = "invited" | "active" | "suspended" | "disabled";
export type UserType = "staff" | "customer";

/** `components.yaml#/components/schemas/AuthenticatedUser`. */
export interface AuthenticatedUser {
  /** Opaque PandaCloud identifier. Never parsed. */
  id: string;
  email: string;
  fullName: string;
  userType: UserType;
  status: UserStatus;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  lastLoginAt?: IsoDateTime;
}

/** `components.yaml#/components/schemas/ActiveMembership`. */
export interface ActiveMembership {
  /** Opaque internal organization identifier. */
  organizationId: string;
  role: MembershipRole;
}

/** `components.yaml#/components/schemas/AuthMeResponse`. */
export interface AuthProfile {
  user: AuthenticatedUser;
  authorization: {
    /**
     * Computed server-side: at least one active, non-`customer` membership in
     * an active, non-archived `cloud_panda` organization. Never derived on the
     * client.
     */
    isStaff: boolean;
    memberships: ActiveMembership[];
  };
}

/**
 * Convenience alias for the many display-only consumers that just need name,
 * email or id. Authorization must always be read from `AuthProfile`.
 */
export type User = AuthenticatedUser;

/* -------------------------------- Helpers -------------------------------- */

/** Roles carried by the identity's active memberships. */
export function membershipRoles(profile: AuthProfile | null): MembershipRole[] {
  if (!profile) return [];
  return profile.authorization.memberships.map((membership) => membership.role);
}

/**
 * Roles that decide what the UI may render.
 *
 * A non-staff identity is treated as `customer` even with no membership row:
 * the backend defaults a new identity to `userType=customer` with no
 * membership (PHASE_1), and that is exactly the customer case.
 */
export function effectiveRoles(profile: AuthProfile | null): MembershipRole[] {
  if (!profile) return [];
  const roles = new Set<MembershipRole>(membershipRoles(profile));
  if (!profile.authorization.isStaff) roles.add("customer");
  return [...roles];
}

/** Server-computed. Never recomputed from memberships on the client. */
export function isStaff(profile: AuthProfile | null): boolean {
  return profile?.authorization.isStaff ?? false;
}

export function hasRole(profile: AuthProfile | null, role: MembershipRole): boolean {
  return effectiveRoles(profile).includes(role);
}

/**
 * Full management power on the sales board — delete a card and anything else
 * gated the same way in `SalesBoard.tsx`.
 *
 * Source: DEALFLOW_MVP_DATABASE_DESIGN § 9.2 — only `manager` and `admin` may
 * mark Won/Lost and configure the pipeline. Kept separate from `isAdmin`
 * because a genuinely admin-only surface must not open to a manager.
 */
export function canManageSalesBoard(profile: AuthProfile | null): boolean {
  return hasRole(profile, "manager") || hasRole(profile, "admin");
}

/** True only for `admin` — gates admin-only surfaces outside the sales board. */
export function isAdmin(profile: AuthProfile | null): boolean {
  return hasRole(profile, "admin") || hasRole(profile, "super_admin");
}

/** True only for `super_admin` — gates privileged role-transition surfaces. */
export function isSuperAdmin(profile: AuthProfile | null): boolean {
  return hasRole(profile, "super_admin");
}

/**
 * A single role label for display and for the Kanban library's `user.role`
 * input. See `WORKSPACE_ROLE_PRECEDENCE` — U-03.
 */
export function primaryRole(profile: AuthProfile | null): MembershipRole | null {
  const roles = effectiveRoles(profile);
  return WORKSPACE_ROLE_PRECEDENCE.find((role) => roles.includes(role)) ?? null;
}
