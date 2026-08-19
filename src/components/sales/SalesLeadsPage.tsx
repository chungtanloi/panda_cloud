"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import type { NormalizedError } from "@/models/common";
import type { SalesLeadStatus, SalesLeadSummary } from "@/models/salesWorkspace";
import { api, normalizeError } from "@/services/api";

const statuses: Array<SalesLeadStatus | "all"> = ["all", "new", "qualified", "nurture", "disqualified", "converted", "archived"];

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }

export function SalesLeadsPage() {
  const [leads, setLeads] = useState<SalesLeadSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [status, setStatus] = useState<SalesLeadStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);

  const load = useCallback(async (nextCursor?: string, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const page = await api.salesWorkspace.listLeads({ limit: 50, cursor: nextCursor, ...(status === "all" ? {} : { status }) });
      setLeads((existing) => append ? [...existing, ...page.leads] : page.leads);
      setCursor(page.continueCursor ?? null);
      setIsDone(page.isDone);
    } catch (cause) {
      setError(normalizeError(cause));
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  return (
    <WorkspacePage eyebrow="Sales / CRM" title="Leads" description="Assigned assessment leads and their linked Sales deals.">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="text-sm text-ink-dim" htmlFor="lead-status">Status</label>
        <select id="lead-status" value={status} onChange={(event) => setStatus(event.target.value as SalesLeadStatus | "all")} className="rounded-lg border border-white/15 bg-surface px-3 py-2 text-sm text-ink">
          {statuses.map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value.replaceAll("_", " ")}</option>)}
        </select>
      </div>
      {loading ? <p className="text-ink-dim">Loading leads…</p> : error ? <p role="alert" className="text-red-300">{error.message}{error.correlationId ? ` Support id: ${error.correlationId}` : ""}</p> : leads.length === 0 ? <div className="surface-card p-8 text-center text-ink-dim">No leads found for this status.</div> : <>
        <div className="surface-card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-ink-dim"><th className="p-4">Lead</th><th className="p-4">Assessment</th><th className="p-4">Deal</th><th className="p-4">Status</th><th className="p-4">Updated</th></tr></thead><tbody>{leads.map((lead) => <tr className="border-b border-white/5" key={lead.leadId}><td className="p-4"><Link className="text-accent hover:underline" href={`/sales/leads/${lead.leadId}`}>{lead.summary ?? "Untitled lead"}</Link><p className="text-xs text-ink-dim">{lead.source} · {lead.persona ?? "—"}</p></td><td className="p-4 text-xs text-ink-dim">{lead.assessmentSessionId ? <><span className="text-accent">Paid</span><br />{lead.assessmentSessionId}</> : "—"}</td><td className="p-4 text-xs text-ink-dim">{lead.dealId ?? "—"}</td><td className="p-4"><span className="rounded-full border border-accent/40 px-2 py-1 text-xs text-accent">{lead.status}</span></td><td className="p-4 text-ink-dim">{formatDate(lead.updatedAt)}</td></tr>)}</tbody></table></div>
        {!isDone && cursor ? <button type="button" disabled={loadingMore} onClick={() => void load(cursor, true)} className="mt-5 rounded-full border border-accent/50 px-4 py-2 text-sm text-accent disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button> : null}
      </>}
    </WorkspacePage>
  );
}
