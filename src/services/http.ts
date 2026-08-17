import type { ApiErrorBody, ApiResponse, NormalizedError } from "@/models/common";
import { apiConfig } from "./config";
import { sessionBridge } from "./session";

/**
 * The single HTTP client. Nothing else in the app calls `fetch` directly.
 *
 * Implements the PandaCloud client-side conventions
 * (docs/collaboration/frontend-backend-collaboration-workflow.md § 7):
 *
 *  - talks only to the public gateway at NEXT_PUBLIC_API_BASE_URL (`/api/v1`)
 *  - sends the Bearer JWT
 *  - sends `X-Correlation-Id` and echoes back whatever the gateway returns
 *  - normalises the standard error body into `NormalizedError`
 *
 * CR-003 (done, 2026-08-14): § 7.1 states Clerk owns session refresh and that
 * PandaCloud does not add a custom refresh-token API without an approved
 * requirement. The bespoke `POST /auth/refresh` retry and the localStorage
 * token store are gone. The bearer is the current Clerk session token, minted
 * on demand through `services/session.ts`; Clerk refreshes it transparently, so
 * a 401 here is a real authentication failure and is surfaced as one.
 */

export class ApiError extends Error implements NormalizedError {
  code: NormalizedError["code"];
  status?: number;
  correlationId?: string;
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];

  constructor(err: NormalizedError) {
    super(err.message);
    this.name = "ApiError";
    this.code = err.code;
    this.status = err.status;
    this.correlationId = err.correlationId;
    this.fieldErrors = err.fieldErrors;
    this.formErrors = err.formErrors;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised to JSON unless it is FormData. */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip the Authorization header (public marketing and catalogue reads). */
  anonymous?: boolean;
  signal?: AbortSignal;
  /**
   * Correlation id to send. Omit and one is generated — § 7 lets the client
   * supply it and requires the gateway to echo it either way.
   */
  correlationId?: string;
}

const CORRELATION_HEADER = "X-Correlation-Id";

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = `${apiConfig.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** RFC 4122 v4 where available; a readable fallback otherwise. */
function newCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `fe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Fallback when the gateway returns a status but no parseable body. */
function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR";
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 429:
      return "RATE_LIMITED";
    case 502:
    case 503:
    case 504:
      return "SERVICE_UNAVAILABLE";
    default:
      return "INTERNAL_ERROR";
  }
}

/**
 * Turns the standard error body (§ 7.2) into `NormalizedError`.
 *
 * `details[]` is split two ways: entries with a `field` become `fieldErrors`
 * for form binding, entries without become `formErrors`. Dropping the
 * fieldless ones would silently hide cross-field rule failures.
 */
async function toNormalizedError(
  response: Response,
  fallbackCorrelationId: string,
): Promise<NormalizedError> {
  let body: Partial<ApiErrorBody> = {};
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    // Non-JSON error page (gateway 502, proxy timeout) — fall through.
  }

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const detail of body.details ?? []) {
    if (detail.field) {
      (fieldErrors[detail.field] ??= []).push(detail.reason);
    } else {
      formErrors.push(detail.reason);
    }
  }

  return {
    code: body.errorCode ?? statusToCode(response.status),
    message: body.message ?? `Request failed with status ${response.status}.`,
    status: response.status,
    correlationId:
      body.correlationId ?? response.headers.get(CORRELATION_HEADER) ?? fallbackCorrelationId,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    formErrors: formErrors.length > 0 ? formErrors : undefined,
  };
}

async function execute<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = "GET", body, query, anonymous, signal } = options;
  const correlationId = options.correlationId ?? newCorrelationId();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  const headers: Record<string, string> = {
    Accept: "application/json",
    [CORRELATION_HEADER]: correlationId,
  };

  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  if (!anonymous) {
    // Clerk session JWT, minted through the normal `getToken()` path with no
    // custom template. Absent when signed out — the gateway then answers 401.
    const token = await sessionBridge.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (cause) {
    const aborted = cause instanceof DOMException && cause.name === "AbortError";
    // No response, so no gateway-assigned correlation id — send ours, which is
    // still the id the backend will have logged against the attempt.
    throw new ApiError({
      code: aborted ? "TIMEOUT" : "NETWORK_ERROR",
      message: aborted
        ? "The request timed out. Please try again."
        : "Could not reach the server. Check your connection and try again.",
      correlationId,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) throw new ApiError(await toNormalizedError(response, correlationId));

  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as ApiResponse<T> | T;
  // Tolerates both a `data`-wrapped and a bare payload — see CR-001.
  return (payload && typeof payload === "object" && "data" in payload
    ? (payload as ApiResponse<T>).data
    : (payload as T)) as T;
}

export const http = {
  get: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    execute<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
    execute<T>(path, { ...options, method: "POST", body }),

  put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
    execute<T>(path, { ...options, method: "PUT", body }),

  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
    execute<T>(path, { ...options, method: "PATCH", body }),

  delete: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
    execute<T>(path, { ...options, method: "DELETE", body }),
};

/** Convert any thrown value into the shape views render. */
export function normalizeError(cause: unknown): NormalizedError {
  if (cause instanceof ApiError) {
    return {
      code: cause.code,
      message: cause.message,
      status: cause.status,
      correlationId: cause.correlationId,
      fieldErrors: cause.fieldErrors,
      formErrors: cause.formErrors,
    };
  }
  return {
    code: "INTERNAL_ERROR",
    message: cause instanceof Error ? cause.message : "Something went wrong.",
  };
}
