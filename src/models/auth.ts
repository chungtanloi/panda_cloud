import type { IsoDateTime } from "./common";

/** Which product track the user picked on the "Choose Your Path" screen. */
export type UserPath =
  | "land_owner" // Land Owner Assessment
  | "gpu_renter" // GPU Cluster Booking
  | "investor" // AI Token Investment
  | "hyperscaler"; // Hyperscale Data Center

export interface User {
  id: string;
  email: string;
  fullName: string;
  company?: string;
  path?: UserPath;
  createdAt: IsoDateTime;
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
