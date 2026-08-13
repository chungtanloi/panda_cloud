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

  /**
   * Contract release this build is written against — workflow § 9.
   *
   * The frontend pins one release and consumes its artifacts; it never tracks
   * `main`. Surfacing the version at runtime means an integration defect ticket
   * can state the contract version alongside the correlation id, which § 18
   * requires.
   */
  contractVersion: process.env.NEXT_PUBLIC_CONTRACT_VERSION ?? "unpinned",
} as const;

/**
 * Fail loudly at startup when the real adapter is selected without a base URL,
 * rather than emitting requests to a relative path nobody expects.
 */
export function assertApiConfig(): void {
  if (apiConfig.contractVersion === "unpinned") {
    // Warn rather than throw: local UI work can continue, but integration and
    // release builds must pin an immutable contract artifact.
    console.warn(
      "[config] NEXT_PUBLIC_CONTRACT_VERSION is unset. The frontend should pin one " +
        "contract release (e.g. contract-v1.2.0) rather than tracking main.",
    );
  }

  if (apiConfig.adapter !== "http") return;

  if (!apiConfig.baseUrl) {
    throw new Error(
      "[config] NEXT_PUBLIC_API_ADAPTER=http but NEXT_PUBLIC_API_BASE_URL is empty. " +
        "Set it in .env.local (see .env.example).",
    );
  }

  // § 1.1: the gateway is the only public boundary and it is versioned.
  // A base URL without it usually means someone pointed at a Convex
  // deployment or an unversioned host by mistake.
  if (!apiConfig.baseUrl.endsWith("/api/v1")) {
    throw new Error(
      `[config] NEXT_PUBLIC_API_BASE_URL must end with "/api/v1" — got "${apiConfig.baseUrl}". ` +
        "The frontend talks only to the versioned Vercel HTTP Gateway, never to Convex directly.",
    );
  }

}
