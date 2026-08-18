"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatusPill } from "@/components/workspace/StatusPill";
import { useAuth } from "@/controllers/AuthContext";
import { loadDealReadiness } from "@/controllers/ReadinessContext";
import {
  LANE_LABELS,
  LANE_STATE_LABELS,
  LANE_STATE_TONES,
  READINESS_LANES,
  type ReadinessResult,
} from "@/lib/readiness";
import { hasRole } from "@/models/auth";
import type { SalesCard } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

/**
 * Handoff summary inside the deal detail panel.
 *
 * ⚠ This panel used to evaluate readiness itself, picking `items[0]` from each
 * list. `DealReadinessView` did the same job by picking the newest record by
 * `updatedAt`. Two implementations of one question meant the same deal could
 * read "Ready" here and "Needs attention" one click away. Both now call
 * `evaluateReadiness` through `loadDealReadiness`, so there is exactly one
 * answer.
 *
 * Readiness is a review aid. The backend owns authorization, won status,
 * optimistic concurrency, idempotency, the readiness policy itself and the
 * audit trail — nothing here gates the conversion client-side.
 */
export function DealHandoffPanel({ card, onRefresh }: { card: SalesCard; onRefresh?: () => void }) {
  const { profile } = useAuth();
  const canConvert = hasRole(profile, "manager") || hasRole(profile, "admin");

  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [counts, setCounts] = useState<{ tasks: number; activities: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [projectCode, setProjectCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDealReadiness(card.id).then((result) => {
      if (!cancelled) setReadiness(result);
    });
    void Promise.allSettled([
      api.salesWorkspace.listTasks({ dealId: card.id, limit: 50 }),
      api.salesWorkspace.listActivities(card.id, { limit: 50 }),
    ]).then(([tasks, activities]) => {
      if (cancelled) return;
      setCounts({
        tasks: tasks.status === "fulfilled" ? tasks.value.tasks.length : 0,
        activities: activities.status === "fulfilled" ? activities.value.activities.length : 0,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  const overallLabel = card.projectId
    ? "Project created"
    : card.status !== "won"
      ? "Sales active"
      : readiness?.overall === "ready"
        ? "Ready for project conversion"
        : "Needs readiness attention";

  const convert = useCallback(async () => {
    if (!projectCode.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.manager.convertDealToProject(card.id, {
        expectedRevision: card.revision,
        idempotencyKey: crypto.randomUUID(),
        projectCode: projectCode.trim(),
        ...(projectName.trim() ? { projectName: projectName.trim() } : {}),
      });
      setMessage(`Project ${String(result.projectId ?? "created")} created.`);
      onRefresh?.();
    } catch (cause) {
      const error = normalizeError(cause);
      setMessage(
        error.code === "CONFLICT"
          ? "This deal changed on the server. Reload before converting."
          : error.message,
      );
      if (error.code === "CONFLICT") onRefresh?.();
    } finally {
      setBusy(false);
    }
  }, [card.id, card.revision, onRefresh, projectCode, projectName]);

  return (
    <section className="mt-6 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-accent">Deal handoff</p>
          <h3 className="mt-1 text-lg font-semibold text-ink">{overallLabel}</h3>
          <p className="text-xs text-ink-dim">Sales → Manager review → Project conversion</p>
        </div>
        <Link
          className="rounded-full border border-accent/40 px-3 py-2 text-xs text-accent"
          href={`/deal-readiness/${encodeURIComponent(card.id)}`}
        >
          Open Deal Readiness
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {READINESS_LANES.map((lane) => {
          const state = readiness?.lanes[lane];
          return (
            <div key={lane} className="rounded-xl border border-line-soft bg-white/[0.02] px-3 py-3">
              <p className="text-xs font-semibold text-ink">{LANE_LABELS[lane]}</p>
              <div className="mt-2">
                {state ? (
                  <StatusPill label={LANE_STATE_LABELS[state]} tone={LANE_STATE_TONES[state]} />
                ) : (
                  <span className="text-xs text-ink-faint">Loading…</span>
                )}
              </div>
              {readiness ? (
                <p className="mt-2 text-[11px] leading-4 text-ink-dim">{readiness.statusLabels[lane]}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {readiness && readiness.overall !== "ready" ? (
        <p className="mt-3 text-xs leading-5 text-amber-300">{readiness.blocker}</p>
      ) : null}

      <div className="mt-4 grid gap-2 text-xs text-ink-dim sm:grid-cols-4">
        <span>
          Customer: <b className="text-ink">{card.organizationName ?? "—"}</b>
        </span>
        <span>
          Owner: <b className="text-ink">{card.ownerName ?? "—"}</b>
        </span>
        <span>
          Activities: <b className="text-ink">{counts?.activities ?? "…"}</b>
        </span>
        <span>
          Open tasks: <b className="text-ink">{counts?.tasks ?? "…"}</b>
        </span>
      </div>

      {canConvert && card.status === "won" && !card.projectId ? (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-ink">Convert to project</p>
          <p className="mt-1 text-xs text-ink-dim">
            The backend enforces authorization, won status and optimistic concurrency. Readiness is
            shown for review and is not a client-side gate.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={projectCode}
              onChange={(event) => setProjectCode(event.target.value)}
              placeholder="Project code *"
              className="rounded-lg border border-line bg-deep px-3 py-2 text-sm text-ink"
            />
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Project name (optional)"
              className="rounded-lg border border-line bg-deep px-3 py-2 text-sm text-ink"
            />
          </div>
          <button
            type="button"
            disabled={busy || !projectCode.trim()}
            onClick={() => void convert()}
            className="mt-3 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-fg disabled:opacity-40"
          >
            {busy ? "Converting…" : "Convert to project"}
          </button>
          {message ? <p className="mt-2 text-xs text-ink-dim">{message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
