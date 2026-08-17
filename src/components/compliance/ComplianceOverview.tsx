"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { KYC_RISK_TONES, KYC_STATUS_TONES } from "@/config/lifecycle";
import {
  KYC_RISK_LABELS,
  KYC_RISK_LEVELS,
  KYC_STATUS_LABELS,
  type KycCase,
  type KycStatus,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * `/compliance` — ROLE_PERMISSION_MATRIX § 7.2, "Dashboard KYC cases theo
 * risk/status".
 *
 * Counted client-side from the one list request, as in the Legal overview: no
 * aggregate operation exists and none is invented.
 *
 * The headline number is deliberately "needs attention" rather than "total".
 * A compliance queue is only interesting where it is stuck: provider errors,
 * cases waiting on documents, and anything rated prohibited.
 */
export function ComplianceOverview() {
  const params = useSearchParams();
  const dealId = params.get("dealId")?.trim() ?? "";
  const [items, setItems] = useState<readonly KycCase[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!dealId) { setItems([]); return; }
      const page = await api.compliance.listCases(dealId);
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
    const stuck: readonly KycStatus[] = ["pending_documents", "provider_error", "under_review"];
    const byStatus = new Map<KycStatus, number>();
    for (const row of rows) byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
    return {
      total: rows.length,
      needsAttention: rows.filter((row) => stuck.includes(row.status)).length,
      approved: rows.filter((row) => row.status === "approved").length,
      prohibited: rows.filter((row) => row.riskLevel === "prohibited").length,
      byStatus: [...byStatus.entries()].sort((a, b) => b[1] - a[1]),
      byRisk: KYC_RISK_LEVELS.map(
        (level) => [level, rows.filter((row) => row.riskLevel === level).length] as const,
      ).filter(([, count]) => count > 0),
      unrated: rows.filter((row) => row.riskLevel === null).length,
    };
  }, [items]);

  if (loading) return <LoadingState label="Loading cases" />;
  if (error) return <ErrorState error={error} onRetry={() => void load()} />;
  if (!dealId) return <WorkspacePage eyebrow="Compliance / Overview" title="KYC status" description="Open this workspace with a deal context."><p className="text-sm text-ink-dim">Add <code>?dealId=...</code> to load KYC data.</p></WorkspacePage>;

  return (
    <WorkspacePage
      eyebrow="Compliance / Overview"
      title="KYC status"
      description="Cases by risk and status. Each case has exactly one subject, and its status is materialized onto the deal for the other workspaces to read."
      stats={[
        { label: "Needs attention", value: String(summary.needsAttention), detail: "Waiting on documents, review or a provider retry" },
        { label: "Approved", value: String(summary.approved) },
        { label: "Prohibited", value: String(summary.prohibited), detail: "Relationship should not proceed" },
        { label: "Total", value: String(summary.total) },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[24px] border border-line bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">By status</h2>
            <Link
              href="/compliance/cases"
              className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
            >
              All cases →
            </Link>
          </div>
          {summary.byStatus.length === 0 ? (
            <p className="mt-4 text-xs leading-5 text-ink-dim">No cases yet.</p>
          ) : (
            <ul className="mt-5 flex flex-wrap gap-3">
              {summary.byStatus.map(([status, count]) => (
                <li key={status} className="flex items-center gap-2">
                  <StatusPill
                    label={KYC_STATUS_LABELS[status]}
                    tone={KYC_STATUS_TONES[status]}
                  />
                  <span className="text-sm font-semibold text-ink">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[24px] border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">By risk</h2>
          <ul className="mt-5 flex flex-wrap gap-3">
            {summary.byRisk.map(([level, count]) => (
              <li key={level} className="flex items-center gap-2">
                <StatusPill label={KYC_RISK_LABELS[level]} tone={KYC_RISK_TONES[level]} />
                <span className="text-sm font-semibold text-ink">{count}</span>
              </li>
            ))}
            {summary.unrated > 0 ? (
              <li className="flex items-center gap-2">
                <StatusPill label="Not rated" tone="neutral" />
                <span className="text-sm font-semibold text-ink">{summary.unrated}</span>
              </li>
            ) : null}
          </ul>
          <p className="mt-5 text-xs leading-5 text-ink-dim">
            Risk is optional on a case. An unrated case is not low risk — it simply has
            not been assessed.
          </p>
        </section>
      </div>
    </WorkspacePage>
  );
}
