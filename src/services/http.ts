import type { ApiErrorBody, ApiResponse, NormalizedError } from "@/models/common";
import { apiConfig } from "./config";
import { tokenStore } from "./tokenStore";

/**
 * The single HTTP client. Nothing else in the app calls `fetch` directly.
 *
 * Responsibilities:
 *  - prefix every path with NEXT_PUBLIC_API_BASE_URL
 *  - attach the bearer token when present
 *  - unwrap the `{ data }` envelope
 *  - normalise every failure into a NormalizedError (never throws a raw
 *    TypeError or a bare Response at a controller)
 *  - refresh the access token once on a 401, then replay the request
 */

export class ApiError extends Error implements NormalizedError {
  code: NormalizedError["code"];
  status?: number;
  fieldErrors?: Record<string, string[]>;

  constructor(err: NormalizedError) {
    super(err.message);
    this.name = "ApiError";
    this.code = err.code;
    this.status = err.status;
    this.fieldErrors = err.fieldErrors;
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised to JSON unless it is FormData. */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Skip the Authorization header (login, signup, public marketing data). */
  anonymous?: boolean;
  signal?: AbortSignal;
}

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

function statusToCode(status: number): NormalizedError["code"] {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "VALIDATION_FAILED";
    case 429:
      return "RATE_LIMITED";
    default:
      return "INTERNAL";
  }
}

async function toNormalizedError(response: Response): Promise<NormalizedError> {
  let body: Partial<ApiErrorBody> = {};
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    // Non-JSON error page — fall through to the generic message below.
  }

  return {
    code: body.error?.code ?? statusToCode(response.status),
    message: body.error?.message ?? `Request failed with status ${response.status}.`,
    status: response.status,
    fieldErrors: body.error?.details,
  };
}

/** Guards against several concurrent 401s each firing their own refresh. */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const current = tokenStore.get();
  if (!current) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(buildUrl("/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        if (!response.ok) {
          tokenStore.clear();
          return false;
        }
        const payload = (await response.json()) as ApiResponse<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>;
        tokenStore.set({ ...payload.data, tokenType: "Bearer" });
        return true;
      } catch {
        tokenStore.clear();
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function execute<T>(path: string, options: RequestOptions, isRetry: boolean): Promise<T> {
  const { method = "GET", body, query, anonymous, signal } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), apiConfig.timeoutMs);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });

  const headers: Record<string, string> = { Accept: "application/json" };
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  if (!anonymous) {
    const tokens = tokenStore.get();
    if (tokens) headers.Authorization = `${tokens.tokenType} ${tokens.accessToken}`;
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
    throw new ApiError({
      code: aborted ? "TIMEOUT" : "NETWORK",
      message: aborted
        ? "The request timed out. Please try again."
        : "Could not reach the server. Check your connection and try again.",
    });
  } finally {
    clearTimeout(timeout);
  }

  // One transparent refresh-and-replay on an expired access token.
  if (response.status === 401 && !anonymous && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return execute<T>(path, options, true);
  }

  if (!response.ok) throw new ApiError(await toNormalizedError(response));

  if (response.status === 204) return undefined as T;

  const payload = (await response.json()) as ApiResponse<T>;
  // Tolerate a bare payload if the backend omits the `data` envelope.
  return (payload && typeof payload === "object" && "data" in payload
    ? payload.data
    : (payload as unknown)) as T;
}

export const http = {
  get: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    execute<T>(path, { ...options, method: "GET" }, false),

  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
    execute<T>(path, { ...options, method: "POST", body }, false),

  put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
    execute<T>(path, { ...options, method: "PUT", body }, false),

  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, "method"> = {}) =>
    execute<T>(path, { ...options, method: "PATCH", body }, false),

  delete: <T>(path: string, options: Omit<RequestOptions, "method" | "body"> = {}) =>
    execute<T>(path, { ...options, method: "DELETE" }, false),
};

/** Convert any thrown value into the shape views render. */
export function normalizeError(cause: unknown): NormalizedError {
  if (cause instanceof ApiError) {
    return {
      code: cause.code,
      message: cause.message,
      status: cause.status,
      fieldErrors: cause.fieldErrors,
    };
  }
  return {
    code: "INTERNAL",
    message: cause instanceof Error ? cause.message : "Something went wrong.",
  };
}
