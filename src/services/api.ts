import type { ApiClient } from "./contracts";
import { apiConfig } from "./config";
import { httpApi } from "./http-impl";
import { mockApi } from "./mock";

/**
 * THE public entry point to all remote data.
 *
 * Controllers and views import `api` from here and nothing else. They cannot
 * tell whether they are talking to a real backend or the mock adapter, which
 * is exactly the point: when the backend team is ready, set
 *
 *     NEXT_PUBLIC_API_ADAPTER=http
 *     NEXT_PUBLIC_API_BASE_URL=https://api.cloudpanda.example/v1
 *
 * and no UI or business-logic file changes.
 *
 * Rules enforced by review:
 *   1. No component calls `fetch` directly.
 *   2. No API URL is written outside `services/endpoints.ts`.
 *   3. Anything added to `ApiClient` must be implemented by BOTH adapters.
 */
export const api: ApiClient = apiConfig.adapter === "http" ? httpApi : mockApi;

export { apiConfig } from "./config";
export { ApiError, normalizeError } from "./http";
export { tokenStore } from "./tokenStore";
export type { ApiClient } from "./contracts";
