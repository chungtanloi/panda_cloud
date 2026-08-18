import { apiConfig } from "./config";
import { endpoints } from "./endpoints";
import { http, normalizeError } from "./http";
import type { NormalizedError } from "@/models/common";
import type { NcndaStatus } from "@/models/ncnda";
import {
  type NcndaQueueItem,
  type NcndaQueuePage,
  type NcndaQueueQuery,
  type NcndaSummary,
  type NcndaTransitionRequest,
  type NcndaTransitionResponse,
} from "@/models/legalQueue";
import { mockNcndaAgreements } from "./mock/legalComplianceFixtures";

/**
 * Legal queue service — **CR-004, DRAFT AND UNAPPROVED**.
 *
 * ⚠ WHY THIS IS A SEPARATE MODULE AND NOT PART OF `ApiClient`.
 *
 * `services/contracts.ts` describes operations the backend actually serves.
 * The three operations below are a proposal
 * (`PandaCloudBackend/api-contracts/proposals/CR-004/`) that no route answers
 * yet. Putting them in `ApiClient` would state, in the one file the team reads
 * to learn what the backend can do, that three things exist which do not.
 *
 * Once CR-004 is approved and deployed, fold this into `ApiClient` alongside
 * `LegalService`, implement it in both `services/mock` and
 * `services/http-impl`, and delete this file. Until then it follows the same
 * rules as the rest of the service layer: no component calls `fetch`, no URL is
 * written outside `services/endpoints.ts`, and both adapters implement the
 * whole port.
 */
export interface LegalQueueService {
  listQueue(query?: NcndaQueueQuery): Promise<NcndaQueuePage>;
  summary(query?: { mine?: boolean; ownerId?: string }): Promise<NcndaSummary>;
  transition(agreementId: string, body: NcndaTransitionRequest): Promise<NcndaTransitionResponse>;
}

/**
 * True when the failure means "the backend has not shipped CR-004 yet" rather
 * than "the backend is down".
 *
 * ⚠ WHY THIS IS ASYNC, AND WHY A STATUS CHECK ALONE IS NOT ENOUGH.
 *
 * The obvious implementation — `error.status === 404` — only works when the
 * frontend and the gateway share an origin. They do not in development, and a
 * missing route is worse than a plain 404 across origins:
 *
 *   1. `GET /api/v1/ncnda` matches no App Router segment, so Next.js serves its
 *      own 404 page.
 *   2. That page never runs `src/http/cors.ts`, because CORS headers are added
 *      by the route handlers — and there is no handler.
 *   3. The browser therefore blocks the response for want of
 *      `Access-Control-Allow-Origin`, and `fetch` rejects with a TypeError
 *      before any JavaScript sees the status.
 *   4. `http.ts` maps that to `NETWORK_ERROR` with **no** `status` field.
 *
 * So the symptom of "this endpoint does not exist yet" is indistinguishable, at
 * the point of failure, from "the server is unreachable". Guessing either way
 * is wrong: treating every network error as "not deployed" would hide a real
 * outage behind a tidy landing page, and treating it as an outage shows an
 * error the user can do nothing about.
 *
 * The ambiguity is resolved by asking a route that definitely exists. If
 * `/auth/me` produces any HTTP response at all — including a 401 — the gateway
 * is up and reachable, and the only explanation left is that CR-004 has not
 * shipped. If it fails at the transport level too, the backend really is down
 * and the error belongs on screen.
 *
 * The probe costs one request, only on failure, only once per load. Delete this
 * whole function once CR-004 is released.
 */
export async function isQueueUnavailable(error: NormalizedError): Promise<boolean> {
  // A real HTTP status came back: same-origin, or a gateway that does send CORS
  // headers on its 404s. 405 and 501 are included because a partially wired
  // gateway can answer either for a path it knows but does not serve.
  if (error.status === 404 || error.status === 405 || error.status === 501) return true;
  if (error.status !== undefined) return false;

  // No status at all — transport-level failure. Ambiguous; probe.
  if (error.code !== "NETWORK_ERROR") return false;
  try {
    await http.get(endpoints.auth.me);
    return true;
  } catch (cause) {
    // Any HTTP status here proves the gateway answered, so it is up.
    return typeof normalizeError(cause).status === "number";
  }
}

/* ------------------------------ HTTP adapter ------------------------------ */

/**
 * The backend's NCNDA payloads have historically carried Unix milliseconds for
 * the four timestamp fields while the contract declares `date-time`
 * (see `mapNcndaAgreement` in `services/http-impl`). Normalising here keeps
 * that divergence in the adapter instead of leaking a `number | string` union
 * into the models.
 */
function toIso(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return new Date(value).toISOString();
  return value;
}

type WireQueueItem = Omit<
  NcndaQueueItem,
  "expiresAt" | "sentAt" | "signedAt" | "countersignedAt" | "statusChangedAt"
> & {
  expiresAt: string | number | null;
  sentAt: string | number | null;
  signedAt: string | number | null;
  countersignedAt: string | number | null;
  statusChangedAt: string | number | null;
};

function mapQueueItem(item: WireQueueItem): NcndaQueueItem {
  return {
    ...item,
    expiresAt: toIso(item.expiresAt),
    sentAt: toIso(item.sentAt),
    signedAt: toIso(item.signedAt),
    countersignedAt: toIso(item.countersignedAt),
    statusChangedAt: toIso(item.statusChangedAt),
  };
}

const httpLegalQueue: LegalQueueService = {
  listQueue: async (query = {}) => {
    const response = await http.get<{
      items: WireQueueItem[];
      nextCursor: string | null;
      isDone: boolean;
    }>(endpoints.ncnda.queue, { query: { ...query } });
    return {
      items: response.items.map(mapQueueItem),
      nextCursor: response.nextCursor,
      isDone: response.isDone,
    };
  },

  summary: (query = {}) => http.get<NcndaSummary>(endpoints.ncnda.summary, { query: { ...query } }),

  transition: (agreementId, body) =>
    http.post<NcndaTransitionResponse>(endpoints.ncnda.transitions(agreementId), body),
};

/* ------------------------------ Mock adapter ------------------------------ */

/**
 * ⚠ THE STATE MACHINE LIVES HERE BECAUSE THIS IS THE BACKEND'S STAND-IN.
 *
 * CR-004 puts the transition graph on the server and returns
 * `allowedTransitions` per agreement precisely so no client encodes it. The
 * mock adapter is not a client — it is a local substitute for the server, and
 * it has to answer the same question. No component, controller or view reads
 * this table; they read `item.allowedTransitions`.
 *
 * Source: CR-004 § 4. `expired → drafting` is marked DECISION NEEDED there and
 * is modelled optimistically here so the renewal path can be reviewed.
 */
const MOCK_TRANSITIONS: Record<NcndaStatus, readonly NcndaStatus[]> = {
  not_requested: ["drafting", "cancelled"],
  drafting: ["sent", "cancelled"],
  sent: ["received", "rejected", "expired", "cancelled"],
  received: ["under_review", "rejected", "cancelled"],
  under_review: ["sent", "signed", "rejected", "cancelled"],
  signed: ["countersigned", "rejected", "cancelled"],
  countersigned: ["active", "cancelled"],
  active: ["expired", "cancelled"],
  rejected: [],
  expired: ["drafting"],
  cancelled: [],
};

const NEEDS_ACTION: readonly NcndaStatus[] = [
  "not_requested",
  "drafting",
  "sent",
  "received",
  "under_review",
  "signed",
  "countersigned",
];

const TERMINAL: readonly NcndaStatus[] = ["rejected", "expired", "cancelled"];

const DAY_MS = 86_400_000;

/**
 * Fixtures carry no `statusChangedAt`; the real backfill would approximate it
 * from `updatedAt`, so the mock does the same. `ncnda_03` is left null on
 * purpose to exercise the pre-backfill path — the UI must render an em dash for
 * it rather than "0 days", which would read as a real measurement.
 */
function mockStatusChangedAt(agreementId: string, updatedAt: string): string | null {
  return agreementId === "ncnda_03" ? null : updatedAt;
}

function buildMockItems(): NcndaQueueItem[] {
  const now = Date.now();
  return mockNcndaAgreements.map((agreement) => {
    const current = agreement.versions.find((version) => version.isCurrent) ?? null;
    const statusChangedAt = mockStatusChangedAt(agreement.agreementId, agreement.updatedAt);
    const daysInStatus =
      statusChangedAt === null
        ? null
        : Math.max(0, Math.floor((now - new Date(statusChangedAt).getTime()) / DAY_MS));

    return {
      agreementId: agreement.agreementId,
      dealId: agreement.dealId,
      counterpartyOrganizationId: agreement.counterpartyOrganizationId,
      status: agreement.status,
      effectiveDate: agreement.effectiveDate,
      expiresAt: agreement.expiresAt,
      sentAt: agreement.sentAt,
      signedAt: agreement.signedAt,
      countersignedAt: agreement.countersignedAt,
      ownerId: agreement.ownerId,
      notes: agreement.notes,
      revision: agreement.revision,
      updatedAt: agreement.updatedAt,
      dealTitle: agreement.dealTitle,
      counterpartyName: agreement.counterpartyName,
      ownerName: agreement.ownerName,
      statusChangedAt,
      daysInStatus,
      hasCurrentDocument: current !== null,
      currentDocumentRole: current?.documentRole ?? null,
      allowedTransitions: MOCK_TRANSITIONS[agreement.status],
    } satisfies NcndaQueueItem;
  });
}

/** Mutable so a transition performed in the mock is visible on the next read. */
let mockItems: NcndaQueueItem[] | null = null;

function items(): NcndaQueueItem[] {
  if (!mockItems) mockItems = buildMockItems();
  return mockItems;
}

function matches(item: NcndaQueueItem, query: NcndaQueueQuery): boolean {
  if (query.status && item.status !== query.status) return false;
  if (query.dealId && item.dealId !== query.dealId) return false;
  if (query.ownerId && item.ownerId !== query.ownerId) return false;
  if (query.counterpartyOrganizationId
    && item.counterpartyOrganizationId !== query.counterpartyOrganizationId) return false;

  switch (query.bucket) {
    case "needs_action":
      return NEEDS_ACTION.includes(item.status);
    case "terminal":
      return TERMINAL.includes(item.status);
    case "unassigned":
      return item.ownerName === null;
    case "expiring": {
      if (item.status !== "active" || !item.expiresAt) return false;
      const window = (query.expiringWithinDays ?? 30) * DAY_MS;
      return new Date(item.expiresAt).getTime() - Date.now() <= window;
    }
    default:
      return true;
  }
}

function sortItems(rows: NcndaQueueItem[], sort: NcndaQueueQuery["sort"]): NcndaQueueItem[] {
  const copy = [...rows];
  if (sort === "updated_desc") {
    return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  if (sort === "expiry_asc") {
    return copy.sort((a, b) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999"));
  }
  // `stalest` — oldest stall first. Rows with no measurement sort last rather
  // than first: an unknown is not evidence of urgency.
  return copy.sort((a, b) => {
    if (a.statusChangedAt === null && b.statusChangedAt === null) return 0;
    if (a.statusChangedAt === null) return 1;
    if (b.statusChangedAt === null) return -1;
    return a.statusChangedAt.localeCompare(b.statusChangedAt);
  });
}

const MOCK_LATENCY = 260;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY));

const mockLegalQueue: LegalQueueService = {
  listQueue: async (query = {}) => {
    await delay();
    const filtered = sortItems(items().filter((item) => matches(item, query)), query.sort);
    return { items: filtered, nextCursor: null, isDone: true };
  },

  summary: async () => {
    await delay();
    const rows = items();
    const byStatus: Partial<Record<NcndaStatus, number>> = {};
    for (const row of rows) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    return {
      counts: {
        byStatus,
        needsAction: rows.filter((row) => NEEDS_ACTION.includes(row.status)).length,
        expiringSoon: rows.filter((row) => matches(row, { bucket: "expiring" })).length,
        unassigned: rows.filter((row) => row.ownerName === null).length,
        total: rows.length,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  transition: async (agreementId, body) => {
    await delay();
    const row = items().find((item) => item.agreementId === agreementId);
    if (!row) throw new Error("Agreement not found.");

    // The mock mirrors the backend's rejections so a payload that passes here
    // passes for real. It is not the control — the backend is.
    if (row.revision !== body.expectedRevision) {
      throw new Error("This agreement changed on the server. Reload before retrying.");
    }
    if (!row.allowedTransitions.includes(body.toStatus)) {
      throw new Error(`A ${row.status} agreement cannot move to ${body.toStatus}.`);
    }
    if (body.toStatus === "active" && !body.effectiveDate) {
      throw new Error("An effective date is required to activate an agreement.");
    }
    if ((body.toStatus === "rejected" || body.toStatus === "cancelled") && !body.reason?.trim()) {
      throw new Error("A reason is required to reject or cancel an agreement.");
    }

    const now = new Date().toISOString();
    const updated: NcndaQueueItem = {
      ...row,
      status: body.toStatus,
      revision: row.revision + 1,
      updatedAt: now,
      statusChangedAt: now,
      daysInStatus: 0,
      effectiveDate: body.effectiveDate ?? row.effectiveDate,
      expiresAt: body.expiresAt ?? row.expiresAt,
      allowedTransitions: MOCK_TRANSITIONS[body.toStatus],
    };
    mockItems = items().map((item) => (item.agreementId === agreementId ? updated : item));

    return {
      agreementId,
      status: updated.status,
      revision: updated.revision,
      statusChangedAt: now,
      allowedTransitions: updated.allowedTransitions,
    };
  },
};

/* -------------------------------------------------------------------------- */

export const legalQueue: LegalQueueService =
  apiConfig.adapter === "http" ? httpLegalQueue : mockLegalQueue;
