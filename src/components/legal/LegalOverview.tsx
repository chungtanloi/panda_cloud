"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { NCNDA_STATUS_TONES } from "@/config/lifecycle";
import {
  NCNDA_STATUS_LABELS,
  type NcndaAgreement,
  type NcndaStatus,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * `/legal` — ROLE_PERMISSION_MATRIX § 6.2 "Dashboard trạng thái agreement".
 *
 * Unlike the Technical overview, this one can be real: the agreements list is
 * not scoped to a deal, so the counts are derived from data the caller already
 * has rather than from an aggregate endpoint that does not exist. One request,
 * counted client-side — no invented operation.
 *
 * "Awaiting action" is the number that matters: agreements sitting with the
 * counterparty or in review are the ones a Legal reviewer is paid to move.
 */
export function LegalOverview() {
  const [items, setItems] = useState<readonly NcndaAgreement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");
  const [error, setError] = useState<NormalizedError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!dealId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const page = await api.legal.listAgreements(dealId);
      setItems(page.items);
    } catch (cause) {
      setItems(null);
      setError(normalizeError(cause));
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const rows = items ?? [];
    const inFlight: readonly NcndaStatus[] = ["drafting", "sent", "received", "under_review", "signed", "countersigned"];
    const byStatus = new Map<NcndaStatus, number>();
    for (const row of rows) byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
    return {
      total: rows.length,
      active: rows.filter((row) => row.status === "active").length,
      awaiting: rows.filter((row) => inFlight.includes(row.status)).length,
      // Expiry is worth surfacing: an NCNDA that lapses mid-deal stops the deal.
      expiringSoon: rows.filter((row) => {
        if (row.status !== "active" || !row.expiresAt) return false;
        const days = (new Date(row.expiresAt).getTime() - Date.now()) / 86_400_000;
        return days >= 0 && days <= 60;
      }).length,
      byStatus: [...byStatus.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [items]);

  if (loading) return <LoadingState label="Loading agreements" />;
  if (error) return <ErrorState error={error} onRetry={() => void load()} />;

  return (
    <WorkspacePage
      eyebrow="Legal / Overview"
      title="Agreement status"
      description={dealId ? "NCNDA lifecycle for this deal." : "Select a deal to load its NCNDA lifecycle."}
      stats={[
        { label: "Awaiting action", value: String(summary.awaiting), detail: "Drafting through countersigned" },
        { label: "Active", value: String(summary.active), detail: "In force" },
        { label: "Expiring in 60 days", value: String(summary.expiringSoon) },
        { label: "Total", value: String(summary.total) },
      ]}
    >
      <section className="rounded-[24px] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">By status</h2>
          <Link
            href="/legal/agreements"
            className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
          >
            All agreements →
          </Link>
        </div>
        {summary.byStatus.length === 0 ? (
          <p className="mt-4 text-xs leading-5 text-ink-dim">No agreements yet.</p>
        ) : (
          <ul className="mt-5 flex flex-wrap gap-3">
            {summary.byStatus.map(([status, count]) => (
              <li key={status}>
                <Link
                  href="/legal/agreements"
                  className="flex items-center gap-2 rounded-full border border-line-soft px-3 py-2 transition-colors hover:border-accent/40"
                >
                  <StatusPill
                    label={NCNDA_STATUS_LABELS[status]}
                    tone={NCNDA_STATUS_TONES[status]}
                  />
                  <span className="text-sm font-semibold text-ink">{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </WorkspacePage>
  );
}
