import type { IsoDateTime } from "./common";

/** Which product track the user picked on the "Choose Your Path" screen. */
export type UserPath =
  | "land_owner" // Land Owner Assessment
  | "gpu_renter" // GPU Cluster Booking
  | "investor" // AI Token Investment
  | "hyperscaler"; // Hyperscale Data Center

/**
 * Staff roles, distinct from `UserPath`.
 *
 * `UserPath` says which product a **customer** is buying; `UserRole` says what
 * an account may **do**. They are orthogonal — a sales rep has a role and no
 * path. Added 2026-08-12 for the sales pipeline; before that the system had no
 * concept of an internal user at all.
 *
 * `customer` is the default and must remain so: an account with no explicit
 * role must never be treated as staff.
 *
 * `sales_manager` sits between `sales` and `admin`: full management power on
 * the sales board (same as `admin` there — see `canManageSalesBoard`), but no
 * access to admin surfaces outside the board (see `isAdmin`). Added
 * alongside the sales/admin/customer roles rather than folded into `admin`,
 * because a future admin-only page (billing, user management, ...) must not
 * open to a sales manager just because they can delete a deal card.
 */
export type UserRole = "USER" | "SALES" | "MANAGER" | "ADMIN";

/** Normalizes the legacy lowercase API values during the contract migration. */
export function normalizeUserRole(role: unknown): UserRole {
  const value = String(role ?? "USER").toUpperCase();
  if (value === "SALES_MANAGER") return "MANAGER";
  return value === "SALES" || value === "MANAGER" || value === "ADMIN" ? value : "USER";
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  company?: string;
  /** Which product track a customer picked. Absent for staff. */
  path?: UserPath;
  /** Defaults to "customer" when the backend omits it. */
  role?: UserRole;
  createdAt: IsoDateTime;
}

/** True when the account may open internal tooling such as the sales board. */
export function isStaff(user: User | null): boolean {
  return user?.role === "SALES" || user?.role === "MANAGER" || user?.role === "ADMIN";
}

/**
 * True for accounts with full management power on the sales board — delete a
 * card, and anything else scoped to `canDeleteCard`/like checks in
 * `SalesBoard.tsx`. `sales_manager` and `admin` both qualify; plain `sales`
 * does not.
 *
 * Deliberately separate from `isAdmin`: this gates board actions, not
 * app-wide admin surfaces. A page that is genuinely admin-only (not just
 * "board owner") should check `isAdmin`, not this.
 */
export function canManageSalesBoard(user: User | null): boolean {
  return user?.role === "MANAGER" || user?.role === "ADMIN";
}

/** True only for the `admin` role — gates admin-only surfaces outside the sales board (user management, billing, etc.), which `sales_manager` must not reach. */
export function isAdmin(user: User | null): boolean {
  return user?.role === "ADMIN";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds until `accessToken` expires. */
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

/* ----------------------------- Requests ----------------------------- */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
  company?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ChoosePathRequest {
  path: UserPath;
}

/* ----------------------------- Responses ---------------------------- */

export type LoginResponse = AuthSession;
export type SignUpResponse = AuthSession;
export type RefreshResponse = AuthTokens;
export type MeResponse = User;
export type ChoosePathResponse = User;
