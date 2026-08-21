"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/components/workspace/StatusPill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { useAuth } from "@/controllers/AuthContext";
import { loadDealReadiness } from "@/controllers/ReadinessContext";
import {
  LANE_INITIALS,
  LANE_LABELS,
  LANE_STATE_LABELS,
  LANE_STATE_TONES,
  READINESS_LANES,
  type LaneState,
  type ReadinessResult,
} from "@/lib/readiness";
import { hasRole } from "@/models/auth";
import { formatMinorUnits, type NormalizedError } from "@/models/common";
import type { SalesCardDetailDto } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

/**
 * Manager's deal → project conversion queue.
 *
 * ⚠ WHY THIS EXISTS AS A SCREEN OF ITS OWN.
 *
 * Converting a won deal into a project is the most consequential thing a
 * manager does in this system, and it used to be four levels deep: open the
 * pipeline, click a card, wait for the detail panel, scroll past the readiness
 * lanes to a form that only appears when the deal is already won and not yet
 * converted. There was no view answering "which deals are waiting on me", so
 * finding the work meant remembering it.
 *
 * ⚠ WHY IT NEEDS NO NEW BACKEND ENDPOINT.
 *
 * Manager and admin identities resolve to the whole board
 * (`resolveKanbanScope`), so the won column is readable today:
 *
 *   GET /sales/columns                      → find the terminal won column
 *   GET /sales/cards?columnId=<won>         → the won deals
 *   GET /sales/cards/{dealId}               → projectId (list payload omits it)
 *   GET /deals/{dealId}/{ncnda,kyc,dd}      → readiness, via loadDealReadiness
 *
 * The per-deal detail and readiness calls are the cost of the missing
 * aggregate. The won column is small by nature, and requests are issued in
 * bounded batches, but a `readiness` field on the card payload would remove
 * this entirely — recorded as a backend gap in `HANDOFF.md`.
 *
 * Readiness never gates the button. The backend owns authorization, won status,
 * optimistic concurrency, idempotency and the audit trail; a deal that is not
 * ready still converts if the backend allows it, and this screen only makes the
 * consequence visible first.
 */

const BATCH_SIZE = 4;

interface QueueRow {
  deal: SalesCardDetailDto;
  readiness: ReadinessResult;
}

type QueueFilter = "all" | "ready" | "blocked";

export function ConversionQueue() {
  const { profile } = useAuth();
  const canConvert = hasRole(profile, "manager") || hasRole(profile, "admin");

  const [rows, setRows] = useState<readonly QueueRow[] | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [openDealId, setOpenDealId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null);
    setError(null);
    try {
      const { columns } = await api.sales.listColumns();
      const wonColumns = columns.filter((column) => column.stageCategory === "won");
      if (wonColumns.length === 0) {
        setRows([]);
        return;
      }

      const pages = await Promise.all(
        wonColumns.map((column) => api.sales.listCards({ columnId: column.columnId, limit: 100 })),
      );
      const dealIds = pages.flatMap((page) => page.items.map((item) => item.dealId));

      const collected: QueueRow[] = [];
      for (let index = 0; index < dealIds.length; index += BATCH_SIZE) {
        const batch = dealIds.slice(index, index + BATCH_SIZE);
        const settled = await Promise.all(
          batch.map(async (dealId) => {
            const [detail, readiness] = await Promise.all([
              api.sales.getCard(dealId),
              loadDealReadiness(dealId),
            ]);
            return { deal: detail, readiness };
          }),
        );
        collected.push(...settled);
      }

      // A converted deal is finished work, not queue work.
      setRows(collected.filter((row) => !row.deal.projectId));
    } catch (cause) {
      setRows(null);
      setError(normalizeError(cause));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const all = rows ?? [];
    const filtered = all.filter((row) => {
      if (filter === "ready") return row.readiness.overall === "ready";
      if (filter === "blocked") return row.readiness.overall !== "ready";
      return true;
    });
    // Ready first: those are the rows a manager can act on right now.
    return [...filtered].sort((a, b) => {
      const rank = (row: QueueRow) => (row.readiness.overall === "ready" ? 0 : 1);
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      return b.deal.updatedAt.localeCompare(a.deal.updatedAt);
    });
  }, [rows, filter]);

  const readyCount = (rows ?? []).filter((row) => row.readiness.overall === "ready").length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All won deals" />
        <FilterChip
          active={filter === "ready"}
          onClick={() => setFilter("ready")}
          label={`Ready to convert${rows ? ` (${readyCount})` : ""}`}
        />
        <FilterChip
          active={filter === "blocked"}
          onClick={() => setFilter("blocked")}
          label="Still blocked"
        />
        <span className="ml-auto text-xs text-ink-dim">
          Readiness is guidance; the backend decides.
        </span>
      </div>

      {rows === null && !error ? <LoadingState label="Loading won deals" /> : null}
      {error ? <ErrorState error={error} onRetry={() => void load()} /> : null}
      {rows !== null && visible.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          message={
            filter === "all"
              ? "No won deal is currently awaiting project conversion."
              : "No deal matches this filter."
          }
        />
      ) : null}

      {visible.length > 0 ? (
        <ul className="grid gap-3">
          {visible.map((row) => (
            <QueueCard
              key={row.deal.dealId}
              row={row}
              canConvert={canConvert}
              expanded={openDealId === row.deal.dealId}
              onToggle={() =>
                setOpenDealId((current) => (current === row.deal.dealId ? null : row.deal.dealId))
              }
              onConverted={() => {
                setOpenDealId(null);
                void load();
              }}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}

function QueueCard({
  row,
  canConvert,
  expanded,
  onToggle,
  onConverted,
}: {
  row: QueueRow;
  canConvert: boolean;
  expanded: boolean;
  onToggle: () => void;
  onConverted: () => void;
}) {
  const { deal, readiness } = row;
  const ready = readiness.overall === "ready";

  return (
    <li className="rounded-[20px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{deal.title}</p>
          <p className="mt-1 truncate text-xs text-ink-dim">
            {deal.organizationName ?? "—"}
            {deal.ownerName ? ` · ${deal.ownerName}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <span className="font-mono text-sm font-bold text-accent">
            {formatMinorUnits(deal.estimatedValueMinor, deal.currency)}
          </span>
          <LaneStrip readiness={readiness} />
          <StatusPill
            label={LANE_STATE_LABELS[readiness.overall]}
            tone={LANE_STATE_TONES[readiness.overall]}
          />
        </div>
      </div>

      <p className={`mt-3 text-xs leading-5 ${ready ? "text-emerald-300" : "text-amber-300"}`}>
        {readiness.blocker}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/deal-readiness/${encodeURIComponent(deal.dealId)}`}
          className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-dim hover:border-accent/40 hover:text-accent"
        >
          Open readiness
        </Link>
        {canConvert ? (
          <button
            type="button"
            onClick={onToggle}
            className={
              ready
                ? "rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg"
                : "rounded-full border border-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent"
            }
          >
            {expanded ? "Cancel" : ready ? "Convert to project" : "Convert anyway"}
          </button>
        ) : (
          <span className="self-center text-xs text-ink-faint">
            Manager or admin role required to convert.
          </span>
        )}
      </div>

      {expanded && canConvert ? (
        <ConvertForm deal={deal} ready={ready} onConverted={onConverted} />
      ) : null}
    </li>
  );
}

function ConvertForm({
  deal,
  ready,
  onConverted,
}: {
  deal: SalesCardDetailDto;
  ready: boolean;
  onConverted: () => void;
}) {
  const [projectCode, setProjectCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!projectCode.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.manager.convertDealToProject(deal.dealId, {
        expectedRevision: deal.revision,
        // A fresh key per submit: retrying the same failed submit must not be
        // deduplicated into silence, and a double-click must not create two.
        idempotencyKey: crypto.randomUUID(),
        projectCode: projectCode.trim(),
        ...(projectName.trim() ? { projectName: projectName.trim() } : {}),
      });
      onConverted();
    } catch (cause) {
      const error = normalizeError(cause);
      setMessage(
        error.code === "CONFLICT"
          ? "This deal changed on the server. Reloading the queue before you retry."
          : error.correlationId
            ? `${error.message} (correlation ${error.correlationId})`
            : error.message,
      );
      if (error.code === "CONFLICT") onConverted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-[16px] border border-accent/25 bg-accent/[0.04] p-4">
      {!ready ? (
        <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">
          This deal is not showing as ready. Converting is still permitted — the backend, not this
          screen, decides — but the readiness lanes above explain what is outstanding.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
            Project code *
          </span>
          <input
            value={projectCode}
            onChange={(event) => setProjectCode(event.target.value)}
            placeholder="PRJ-2026-014"
            className="rounded-lg border border-line bg-deep px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
            Project name (optional)
          </span>
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder={deal.title}
            className="rounded-lg border border-line bg-deep px-3 py-2 text-sm text-ink focus:border-accent"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={busy || !projectCode.trim()}
        className="mt-4 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-40"
      >
        {busy ? "Converting…" : "Create project"}
      </button>

      {message ? (
        <p role="alert" className="mt-3 text-xs leading-5 text-amber-300">
          {message}
        </p>
      ) : null}
    </form>
  );
}

const STRIP_STYLES: Record<LaneState, string> = {
  ready: "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
  attention: "border-amber-400/40 bg-amber-400/15 text-amber-300",
  blocked: "border-red-400/45 bg-red-400/15 text-red-300",
  missing: "border-line-soft bg-white/[0.02] text-ink-faint",
};

function LaneStrip({ readiness }: { readiness: ReadinessResult }) {
  return (
    <span className="flex items-center gap-[4px]">
      {READINESS_LANES.map((lane) => {
        const state = readiness.lanes[lane];
        return (
          <span
            key={lane}
            title={`${LANE_LABELS[lane]} — ${LANE_STATE_LABELS[state]}`}
            className={`grid size-[20px] place-items-center rounded-[6px] border font-mono text-[9px] leading-none ${STRIP_STYLES[state]}`}
          >
            {LANE_INITIALS[lane]}
          </span>
        );
      })}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-[14px] py-[7px] text-[12px] leading-[16px] transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40"
      }`}
    >
      {label}
    </button>
  );
}
