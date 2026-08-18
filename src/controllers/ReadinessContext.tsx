"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { evaluateReadiness, type ReadinessResult } from "@/lib/readiness";
import { api } from "@/services/api";

/**
 * Lazily resolves NCNDA / KYC / Due-diligence readiness for the deals a board
 * is currently showing.
 *
 * ⚠ WHY THIS IS A FAN-OUT AND NOT ONE CALL.
 *
 * The backend exposes readiness only per deal:
 *
 *   GET /deals/{dealId}/ncnda
 *   GET /deals/{dealId}/kyc
 *   GET /deals/{dealId}/due-diligence/assessments
 *
 * There is no aggregate readiness endpoint and no `readiness` field on
 * `SalesCard`, so three calls per deal is the only way to put this on a card
 * today. The right fix is backend-side — either `GET /deals/{id}/readiness` or
 * a materialized field on the card — and it is recorded as a gap in
 * `HANDOFF.md`. Until then this module keeps the cost contained:
 *
 *   - every card registers its own id, so only rendered deals are fetched;
 *   - each id is fetched at most once per board version (`requested`);
 *   - at most `MAX_CONCURRENT` deals are in flight, so a wide board does not
 *     open sixty sockets at once;
 *   - the board never awaits any of this. A card with no result yet renders a
 *     neutral placeholder, never a wrong status.
 *
 * A failed lane degrades to an empty list rather than an error state: a card
 * that cannot say "blocked" must not say "ready" either, and the readiness page
 * is where a real error belongs.
 */

const MAX_CONCURRENT = 4;
const READINESS_INVALIDATED_EVENT = "panda-cloud:readiness-invalidated";

/** Notify the centralized readiness cache after an approved lane mutation. */
export function notifyDealReadinessChanged(dealId: string): void {
  if (typeof window === "undefined" || !dealId) return;
  window.dispatchEvent(
    new CustomEvent<{ dealId: string }>(READINESS_INVALIDATED_EVENT, { detail: { dealId } }),
  );
}

interface ReadinessContextValue {
  /** Result for a deal, or null while it is unknown. */
  get(dealId: string): ReadinessResult | null;
  /** Registers a deal for fetching. Safe to call on every render. */
  request(dealId: string): void;
}

const ReadinessContext = createContext<ReadinessContextValue | null>(null);

/**
 * Loads the three deal-scoped lanes and folds them through the shared
 * `evaluateReadiness`. Never throws: a rejected lane contributes nothing.
 */
export async function loadDealReadiness(dealId: string): Promise<ReadinessResult> {
  const [agreements, cases, assessments] = await Promise.allSettled([
    api.legal.listAgreements(dealId),
    api.compliance.listCases(dealId),
    api.dueDiligence.listAssessments(dealId),
  ]);
  return evaluateReadiness({
    agreements: agreements.status === "fulfilled" ? agreements.value.items : [],
    cases: cases.status === "fulfilled" ? cases.value.items : [],
    assessments: assessments.status === "fulfilled" ? assessments.value.items : [],
  });
}

export function DealReadinessProvider({
  children,
  version = 0,
}: {
  children: React.ReactNode;
  /** Bump to discard the cache — the board uses its own `boardVersion`. */
  version?: number;
}) {
  const [results, setResults] = useState<Record<string, ReadinessResult>>({});
  const requested = useRef(new Set<string>());
  const queue = useRef<string[]>([]);
  const inFlight = useRef(0);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  // A new board version means the underlying deals may have moved, so the
  // cached readiness is no longer trustworthy. Drop everything and let the
  // cards re-register on their next render.
  useEffect(() => {
    requested.current = new Set<string>();
    queue.current = [];
    setResults({});
  }, [version]);

  const pump = useCallback(function pump(): void {
    while (inFlight.current < MAX_CONCURRENT && queue.current.length > 0) {
      const dealId = queue.current.shift();
      if (!dealId) break;
      inFlight.current += 1;
      void loadDealReadiness(dealId)
        .then((result) => {
          if (!cancelled.current) {
            setResults((previous) => ({ ...previous, [dealId]: result }));
          }
        })
        .finally(() => {
          inFlight.current -= 1;
          if (!cancelled.current) pump();
        });
    }
  }, []);

  const request = useCallback(
    (dealId: string) => {
      if (!dealId || requested.current.has(dealId)) return;
      requested.current.add(dealId);
      queue.current.push(dealId);
      pump();
    },
    [pump],
  );

  useEffect(() => {
    function invalidate(event: Event) {
      const dealId = (event as CustomEvent<{ dealId?: string }>).detail?.dealId;
      if (!dealId) return;
      requested.current.delete(dealId);
      queue.current = queue.current.filter((id) => id !== dealId);
      setResults((previous) => {
        const { [dealId]: _stale, ...remaining } = previous;
        return remaining;
      });
      request(dealId);
    }
    window.addEventListener(READINESS_INVALIDATED_EVENT, invalidate);
    return () => window.removeEventListener(READINESS_INVALIDATED_EVENT, invalidate);
  }, [request]);

  const value = useMemo<ReadinessContextValue>(
    () => ({
      get: (dealId: string) => results[dealId] ?? null,
      request,
    }),
    [results, request],
  );

  return <ReadinessContext.Provider value={value}>{children}</ReadinessContext.Provider>;
}

/**
 * Readiness for one card. Returns null both when no provider is mounted and
 * while the fetch is still in flight — a caller must render the unknown state
 * in either case, so the two are deliberately indistinguishable.
 */
export function useCardReadiness(dealId: string): ReadinessResult | null {
  const context = useContext(ReadinessContext);
  // Destructured because the context value's identity changes on every
  // resolved deal; `request` itself is stable, so the effect runs once per id.
  const request = context?.request;

  useEffect(() => {
    request?.(dealId);
  }, [request, dealId]);

  return context ? context.get(dealId) : null;
}
