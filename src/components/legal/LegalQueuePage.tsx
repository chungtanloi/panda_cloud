"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Select } from "@/components/ui/Field";
import { NCNDA_STATUS_TONES } from "@/config/lifecycle";
import {
  NCNDA_QUEUE_BUCKETS,
  NCNDA_QUEUE_BUCKET_LABELS,
  NCNDA_QUEUE_SORT_LABELS,
  formatDaysInStatus,
  type NcndaQueueBucket,
  type NcndaQueueItem,
  type NcndaQueueSort,
  type NcndaSummary,
} from "@/models/legalQueue";
import { NCNDA_DOCUMENT_ROLE_LABELS, NCNDA_STATUS_LABELS } from "@/models/ncnda";
import type { NormalizedError } from "@/models/common";
import { normalizeError } from "@/services/api";
import { isQueueUnavailable, legalQueue } from "@/services/legalQueue";
import { LifecycleActions } from "./LifecycleActions";

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * `/legal/agreements` — the Legal reviewer's queue.
 *
 * ⚠ THIS RUNS ON A PROPOSED CONTRACT. `GET /ncnda` is CR-004, drafted in
 * `PandaCloudBackend/api-contracts/proposals/CR-004/` and not yet part of
 * `openapi.yaml`. On the mock adapter the whole screen works end to end. On the
 * HTTP adapter it answers 404 today, and `fallback` is rendered instead — the
 * existing honest landing page. That is why this can ship before the backend
 * does, with no feature flag and no second release.
 *
 * Ordering is `stalest` by default rather than most-recently-updated. A queue
 * exists to surface what is stuck; sorting by recent activity produces a
 * changelog, which is what the previous screen effectively was.
 */
export function LegalQueuePage({ fallback }: { fallback: React.ReactNode }) {
  const [items, setItems] = useState<readonly NcndaQueueItem[] | null>(null);
  const [summary, setSummary] = useState<NcndaSummary | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const [bucket, setBucket] = useState<NcndaQueueBucket>("needs_action");
  const [sort, setSort] = useState<NcndaQueueSort>("stalest");
  const [mine, setMine] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(null);
    setError(null);
    try {
      // `mine` is resolved server-side from the session — the client never sends
      // its own user id for this, so it cannot ask for someone else's queue by
      // editing a request.
      const page = await legalQueue.listQueue({ bucket, sort, ...(mine ? { mine: true } : {}) });
      setItems(page.items);
    } catch (cause) {
      const normalized = normalizeError(cause);
      // Awaited: distinguishing "CR-004 is not deployed" from "the gateway is
      // down" needs a probe, because a cross-origin missing route surfaces as a
      // transport error with no status. See `isQueueUnavailable`.
      if (await isQueueUnavailable(normalized)) {
        setUnavailable(true);
        return;
      }
      setError(normalized);
    }
  }, [bucket, sort, mine]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    void legalQueue
      .summary(mine ? { mine: true } : {})
      .then((result) => {
        if (!cancelled) setSummary(result);
      })
      .catch(() => {
        // Counters are decoration. If they fail, the queue is still usable, and
        // an error banner for a number nobody asked for is noise.
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mine]);

  if (unavailable) return <>{fallback}</>;

  return (
    <WorkspacePage
      eyebrow="Legal / Agreements"
      title="NCNDA queue"
      description="Agreements waiting on Legal, longest wait first. One agreement per deal and counterparty; at most one may be active at a time, and each carries a single current document version."
    >
      {summary ? (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Counter label="Needs action" value={summary.counts.needsAction} tone="accent" />
          <Counter label="Expiring in 30 days" value={summary.counts.expiringSoon} tone="warn" />
          <Counter label="Unassigned" value={summary.counts.unassigned} tone="warn" />
          <Counter label="Total agreements" value={summary.counts.total} tone="plain" />
        </section>
      ) : null}

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          {NCNDA_QUEUE_BUCKETS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={bucket === value}
              onClick={() => setBucket(value)}
              className={`rounded-full border px-[14px] py-[7px] text-[12px] leading-[16px] transition-colors ${
                bucket === value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40"
              }`}
            >
              {NCNDA_QUEUE_BUCKET_LABELS[value]}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-pressed={mine}
          onClick={() => setMine((current) => !current)}
          className={`rounded-full border px-[14px] py-[7px] text-[12px] leading-[16px] transition-colors ${
            mine
              ? "border-accent bg-accent-soft text-accent"
              : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40"
          }`}
        >
          Mine only
        </button>

        <div className="ml-auto min-w-[200px]">
          <Select
            label="Order"
            value={sort}
            onChange={(event) => setSort(event.target.value as NcndaQueueSort)}
            options={(Object.keys(NCNDA_QUEUE_SORT_LABELS) as NcndaQueueSort[]).map((value) => ({
              value,
              label: NCNDA_QUEUE_SORT_LABELS[value],
            }))}
          />
        </div>
      </div>

      {items === null && !error ? <LoadingState label="Loading agreements" /> : null}
      {error ? <ErrorState error={error} onRetry={() => void load()} /> : null}
      {items !== null && items.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          message={
            bucket === "needs_action"
              ? "No agreement is currently waiting on Legal."
              : "No agreement matches this filter."
          }
        />
      ) : null}

      {items && items.length > 0 ? (
        <ul className="grid gap-3">
          {items.map((item) => (
            <QueueRow
              key={item.agreementId}
              item={item}
              expanded={expandedId === item.agreementId}
              onToggle={() =>
                setExpandedId((current) => (current === item.agreementId ? null : item.agreementId))
              }
              onChanged={() => {
                setExpandedId(null);
                void load();
              }}
            />
          ))}
        </ul>
      ) : null}

      <p className="mt-6 text-xs leading-5 text-ink-faint">
        Counterparty is still identified by an opaque organization id on create — no organization
        lookup contract exists yet. Recorded in
        <span className="font-mono"> docs/LEGAL_COMPLIANCE_BACKEND_REQUIREMENTS.md</span>.
      </p>
    </WorkspacePage>
  );
}

function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "warn" | "plain";
}) {
  const colour =
    tone === "accent" ? "text-accent" : tone === "warn" && value > 0 ? "text-amber-300" : "text-ink";
  return (
    <div className="rounded-[20px] border border-line bg-surface p-4">
      <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${colour}`}>{value}</p>
    </div>
  );
}

function QueueRow({
  item,
  expanded,
  onToggle,
  onChanged,
}: {
  item: NcndaQueueItem;
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  /**
   * A stall of two weeks or more is called out in colour. The threshold is a
   * presentation choice and nothing depends on it — the number itself is the
   * measurement, and it comes from the backend.
   */
  const stalled = useMemo(() => (item.daysInStatus ?? 0) >= 14, [item.daysInStatus]);

  /**
   * An agreement that is countersigned or active with no document on file is a
   * record asserting a legal position the system cannot evidence. CR-004 § 6
   * proposes blocking activation on it; until the owners decide, the queue at
   * least shows it.
   */
  const missingEvidence =
    !item.hasCurrentDocument && (item.status === "countersigned" || item.status === "active");

  return (
    <li className="rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {item.counterpartyName ?? "—"}
          </p>
          <p className="mt-1 truncate text-xs text-ink-dim">{item.dealTitle ?? "—"}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className={`text-xs ${stalled ? "text-amber-300" : "text-ink-dim"}`}>
            {formatDaysInStatus(item.daysInStatus)} in status
          </span>
          <StatusPill
            label={NCNDA_STATUS_LABELS[item.status]}
            tone={NCNDA_STATUS_TONES[item.status]}
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
        <Field label="Owner" value={item.ownerName ?? "—"} />
        <Field label="Effective" value={item.effectiveDate ?? "—"} />
        <Field label="Expires" value={shortDate(item.expiresAt)} />
        <Field
          label="Current document"
          value={
            item.currentDocumentRole
              ? NCNDA_DOCUMENT_ROLE_LABELS[item.currentDocumentRole]
              : "None attached"
          }
        />
      </dl>

      {missingEvidence ? (
        <p className="mt-3 text-xs leading-5 text-amber-300">
          {NCNDA_STATUS_LABELS[item.status]} with no document attached — the executed agreement is
          not on file.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/legal/agreements/${item.agreementId}`}
          className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-dim hover:border-accent/40 hover:text-accent"
        >
          Open agreement
        </Link>
        <Link
          href={`/deal-readiness/${encodeURIComponent(item.dealId)}`}
          className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-dim hover:border-accent/40 hover:text-accent"
        >
          Deal readiness
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-full border border-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent"
        >
          {expanded ? "Close" : "Change status"}
        </button>
      </div>

      {expanded ? <LifecycleActions item={item} onDone={onChanged} /> : null}
    </li>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">{label}</dt>
      <dd className="mt-1 truncate text-ink">{value}</dd>
    </div>
  );
}
