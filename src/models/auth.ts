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
 */
export type UserRole = "customer" | "sales" | "admin";

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
  return user?.role === "sales" || user?.role === "admin";
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
