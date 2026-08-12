/**
 * The ONLY place environment variables are read.
 *
 * Next.js inlines `process.env.NEXT_PUBLIC_*` at build time, so these must be
 * referenced as full static property accesses — destructuring `process.env`
 * or using a computed key silently yields `undefined` in the browser bundle.
 */

export type ApiAdapter = "mock" | "http";

function readAdapter(): ApiAdapter {
  const raw = process.env.NEXT_PUBLIC_API_ADAPTER;
  return raw === "http" ? "http" : "mock";
}

function readInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/** Strip any trailing slash so path joining stays predictable. */
function normalizeBaseUrl(raw: string | undefined): string {
  return (raw ?? "").replace(/\/+$/, "");
}

export const apiConfig = {
  adapter: readAdapter(),
  baseUrl: normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  timeoutMs: readInt(process.env.NEXT_PUBLIC_API_TIMEOUT, 15_000),
  mockLatencyMs: readInt(process.env.NEXT_PUBLIC_MOCK_LATENCY, 450),
} as const;

/**
 * Fail loudly at startup when the real adapter is selected without a base URL,
 * rather than emitting requests to a relative path nobody expects.
 */
export function assertApiConfig(): void {
  if (apiConfig.adapter === "http" && !apiConfig.baseUrl) {
    throw new Error(
      "[config] NEXT_PUBLIC_API_ADAPTER=http but NEXT_PUBLIC_API_BASE_URL is empty. " +
        "Set it in .env.local (see .env.example).",
    );
  }
}
