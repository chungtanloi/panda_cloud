/**
 * Cross-cutting types shared by every feature.
 *
 * These mirror the PandaCloud HTTP conventions
 * (docs/collaboration/frontend-backend-collaboration-workflow.md § 7).
 *
 * ⚠ The OpenAPI 3.1 source in `PandaCloudBackend/api-contracts/` is the single
 * source of truth for the wire format. Everything here is a **consumer-side
 * mirror** of a pinned contract release, and must be regenerated — not
 * hand-edited — once the Orval client ships. If a shape here disagrees with the
 * contract, the contract wins and this file is the bug.
 *
 * See docs/CONTRACT_CONFORMANCE.md for the open Change Requests.
 */

/* ------------------------------- Envelopes ------------------------------ */

/**
 * Success envelope.
 *
 * ⚠ OPEN QUESTION (CR-001): the workflow document specifies the error body but
 * never states whether success payloads are wrapped in `data`. `services/http.ts`
 * therefore accepts both a wrapped and a bare payload. Remove the tolerance once
 * the contract settles it — silently accepting two shapes hides drift.
 */
export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  correlationId?: string;
  timestamp?: string;
}

/**
 * Standard error body — workflow § 7.2.
 *
 * Flat, not nested: `errorCode`, `message` and `correlationId` are required on
 * every error response.
 */
export interface ApiErrorBody {
  errorCode: string;
  message: string;
  correlationId: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorDetail {
  /** Absent for errors that are not tied to one input field. */
  field?: string;
  reason: string;
}

/**
 * Error codes the frontend branches on.
 *
 * `UPPER_SNAKE_CASE` per § 7. The backend may send codes not listed here — the
 * type stays open with `(string & {})` so an unknown code is still carried
 * through to the user rather than being swallowed by an exhaustive check.
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  // Client-side only: no response was received, so the gateway never assigned
  // a code. Never sent by the backend.
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | (string & {});

/** What controllers and views actually receive. Never a raw throw. */
export interface NormalizedError {
  code: ApiErrorCode;
  message: string;
  status?: number;
  /**
   * Echoed from the response. Quote this in bug reports — workflow § 18
   * requires it on every integration defect ticket.
   */
  correlationId?: string;
  /** Field-level messages, keyed by field, for form binding. */
  fieldErrors?: Record<string, string[]>;
  /** Details that carry no `field`, e.g. cross-field rule failures. */
  formErrors?: string[];
}

/* ------------------------------ Pagination ------------------------------ */

/**
 * Cursor pagination — the default for deals, histories, activities,
 * assessments and audit records (§ 7.3).
 */
export interface CursorPage<T> {
  items: T[];
  /** Pass back as `cursor` to fetch the next page. Absent on the last page. */
  nextCursor?: string;
  /** Present only when a requirement justified the count's cost. */
  totalItems?: number;
}

export interface CursorQuery {
  cursor?: string;
  limit?: number;
}

/**
 * Page pagination. Per § 7.3 this is allowed **only** where a requirement needs
 * a total count and that cost has been accepted — prefer `CursorPage`.
 */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/* --------------------------------- Money -------------------------------- */

/**
 * Money — workflow § 7 requires a minor-unit integer plus an ISO 4217 code.
 *
 * A float in major units cannot represent every cent exactly and loses the
 * currency entirely, which is why the convention exists.
 *
 * ⚠ CR-002: the existing models still carry `*Usd: number` fields in major
 * units. Migrating them changes the wire shape, so it needs FE/BE owner
 * approval before the contract is frozen. See docs/CONTRACT_CONFORMANCE.md.
 */
export interface Money {
  /** Integer in the currency's minor unit — cents for USD. */
  amountMinor: number;
  /** ISO 4217, e.g. "USD". */
  currency: string;
}

/** Formats `Money` for display. Never used to do arithmetic. */
export function formatMoney(money: Money, locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amountMinor / 100);
}

/** ISO 4217 minor-unit fraction digits. Default is 2; only exceptions are listed. */
const CURRENCY_FRACTION_DIGITS: Record<string, number> = {
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  CLF: 4,
  ISK: 0, JPY: 0, KRW: 0, VND: 0,
};

export function currencyFractionDigits(currency: string): number {
  return CURRENCY_FRACTION_DIGITS[currency] ?? 2;
}

/**
 * Formats a minor-unit amount (transported as a string by the backend to avoid
 * integer precision loss) for display. Never used to do arithmetic.
 *
 * The major-unit number fed to `Intl.NumberFormat` is exact within
 * `Number.MAX_SAFE_INTEGER`; real deal values stay far below that.
 */
export function formatMinorUnits(
  minorUnits: string | null | undefined,
  currency: string | null | undefined,
  locale = "en-US",
): string {
  if (minorUnits === null || minorUnits === undefined || minorUnits === "" || !currency) {
    return "—";
  }
  const digits = currencyFractionDigits(currency);
  const major = Number(minorUnits) / 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(major);
}

/**
 * Compact variant for card footers where a full currency string would blow the
 * width (e.g. "$252.5M"). Display only — no arithmetic semantics.
 */
export function formatMinorUnitsCompact(
  minorUnits: string | null | undefined,
  currency: string | null | undefined,
  locale = "en-US",
): string {
  if (minorUnits === null || minorUnits === undefined || minorUnits === "" || !currency) {
    return "—";
  }
  const digits = currencyFractionDigits(currency);
  const major = Number(minorUnits) / 10 ** digits;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(major);
}

/* --------------------------------- Misc --------------------------------- */

/** Discriminated result used by controllers so views never see a raw throw. */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: NormalizedError };

/** ISO-8601 UTC timestamp, e.g. "2026-08-12T09:30:00Z". */
export type IsoDateTime = string;

/** ISO-8601 date, e.g. "2026-08-12". */
export type IsoDate = string;
