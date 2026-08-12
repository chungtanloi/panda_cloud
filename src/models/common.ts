/**
 * Cross-cutting types shared by every feature.
 *
 * These describe the *envelope* the backend is expected to use. If the backend
 * team chooses a different envelope, the only file that needs to change is
 * `src/services/http.ts` — never a component or controller.
 */

/** Standard success envelope returned by every endpoint. */
export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp?: string;
}

/** Standard error body. See docs/API_CONTRACT.md § Error format. */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Field-level messages for 422 validation failures. */
    details?: Record<string, string[]>;
  };
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL"
  | "NETWORK"
  | "TIMEOUT";

/** Cursor/offset pagination envelope. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/** Discriminated result used by controllers so views never see raw throws. */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: NormalizedError };

export interface NormalizedError {
  code: ApiErrorCode;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string[]>;
}

/** ISO-8601 timestamp, e.g. "2026-08-12T09:30:00Z". */
export type IsoDateTime = string;

/** ISO-8601 date, e.g. "2026-08-12". */
export type IsoDate = string;
