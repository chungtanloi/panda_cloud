"use client";

import { useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { formatMinorUnits, type NormalizedError } from "@/models/common";
import type { SalesOverview } from "@/models/salesWorkspace";
import { api, normalizeError } from "@/services/api";

function dateLabel(value: string | null): string {
  if (!value) return "No close date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function ErrorNotice({ error }: { error: NormalizedError }) {
  const prefix = error.code === "UNAUTHENTICATED"
    ? "Your Clerk session is no longer available. Sign in again."
    : error.code === "FORBIDDEN"
      ? "Your current membership cannot view Sales overview data."
      : error.message;
  return <p role="alert" className="text-sm text-red-300">{prefix}{error.correlationId ? ` Support id: ${error.correlationId}` : ""}</p>;
}

export function SalesOverviewPage() {
  const [data, setData] = useState<SalesOverview | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);

  useEffect(() => {
    let active = true;
    api.salesWorkspace.overview()
      .then((result) => active && setData(result))
      .catch((cause) => active && setError(normalizeError(cause)));
    return () => { active = false; };
  }, []);

  if (error) {
    return <WorkspacePage eyebrow="Sales / Overview" title="Sales overview" description="Live backend data could not be loaded."><ErrorNotice error={error} /></WorkspacePage>;
  }
  if (!data) {
    return <WorkspacePage eyebrow="Sales / Overview" title="Sales overview" description="Loading Sales Workspace data…" />;
  }

  return (
    <WorkspacePage
      eyebrow="Sales / Overview"
      title="Sales overview"
      description="Live pipeline and follow-up signals from the Sales Workspace API. Pipeline is shown per currency, never as a merged revenue figure."
      stats={[
        { label: "Open deals", value: String(data.dealSummary.open) },
        { label: "Won deals", value: String(data.dealSummary.won) },
        { label: "Pending follow-ups", value: String(data.pendingFollowUps.length) },
        { label: "Pipeline currencies", value: String(data.pipelineValue.length) },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-card p-6">
          <h2 className="text-lg font-semibold text-ink">Pipeline value</h2>
          <p className="mt-1 text-xs text-ink-dim">Amounts remain separated by ISO currency.</p>
          <div className="mt-4 space-y-3">
            {data.pipelineValue.length ? data.pipelineValue.map((bucket) => (
              <div key={bucket.currency} className="flex justify-between border-b border-white/10 pb-2 text-sm">
                <span className="text-ink-dim">{bucket.currency}</span>
                <span className="text-ink">{formatMinorUnits(bucket.amountMinor, bucket.currency)}</span>
              </div>
            )) : <p className="text-sm text-ink-dim">No pipeline value in the current scope.</p>}
          </div>
        </section>
        <section className="surface-card p-6">
          <h2 className="text-lg font-semibold text-ink">Lead funnel</h2>
          <div className="mt-4 space-y-3">
            {Object.keys(data.leadCountsByStatus).length ? Object.entries(data.leadCountsByStatus).map(([status, count]) => (
              <div className="flex justify-between border-b border-white/10 pb-2 text-sm" key={status}>
                <span className="capitalize text-ink-dim">{status.replaceAll("_", " ")}</span><span className="text-ink">{count}</span>
              </div>
            )) : <p className="text-sm text-ink-dim">No leads in the current scope.</p>}
          </div>
        </section>
        <section className="surface-card p-6">
          <h2 className="text-lg font-semibold text-ink">Closing deals</h2>
          <div className="mt-4 space-y-3">
            {data.closingDeals.length ? data.closingDeals.map((deal) => (
              <div key={deal.dealId} className="border-b border-white/10 pb-3">
                <p className="text-sm text-ink">{deal.title}</p>
                <p className="text-xs text-ink-dim">{dateLabel(deal.expectedCloseDate)} · {deal.probabilityPercent ?? "—"}% · {formatMinorUnits(deal.estimatedValueMinor, deal.currency)}</p>
              </div>
            )) : <p className="text-sm text-ink-dim">No closing deals in the current window.</p>}
          </div>
        </section>
      </div>
    </WorkspacePage>
  );
}
