"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import type { NormalizedError } from "@/models/common";
import type { SalesLeadStatus, SalesLeadSummary } from "@/models/salesWorkspace";
import { api, normalizeError } from "@/services/api";

const statuses: Array<SalesLeadStatus | "all"> = ["all", "new", "qualified", "nurture", "disqualified", "converted", "archived"];
const boardColumns: Array<{ key: Exclude<SalesLeadStatus, "new" | "converted" | "archived"> | "new"; label: string }> = [
  { key: "new", label: "New" },
  { key: "qualified", label: "Qualified" },
  { key: "nurture", label: "Nurture" },
  { key: "disqualified", label: "Disqualified" },
];

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }

export function SalesLeadsPage() {
  const [leads, setLeads] = useState<SalesLeadSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [status, setStatus] = useState<SalesLeadStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

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

  const moveLead = async (target: Exclude<SalesLeadStatus, "new" | "converted" | "archived">) => {
    if (!draggedLead) return;
    const lead = leads.find((item) => item.leadId === draggedLead);
    setDraggedLead(null);
    if (!lead || lead.status === target) return;
    setError(null);
    try {
      await api.salesWorkspace.qualifyLead(lead.leadId, { status: target as "qualified" | "nurture" | "disqualified" });
      await load();
    } catch (cause) { setError(normalizeError(cause)); }
  };

  return (
    <WorkspacePage eyebrow="Sales / CRM" title="Leads" description="Assessment leads assigned by Manager appear here with their paid context and linked deal.">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="text-sm text-ink-dim" htmlFor="lead-status">Status</label>
        <select id="lead-status" value={status} onChange={(event) => setStatus(event.target.value as SalesLeadStatus | "all")} className="rounded-lg border border-white/15 bg-surface px-3 py-2 text-sm text-ink">
          {statuses.map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value.replaceAll("_", " ")}</option>)}
        </select>
      </div>
      {loading ? <p className="text-ink-dim">Loading leads…</p> : error ? <p role="alert" className="text-red-300">{error.message}{error.correlationId ? ` Support id: ${error.correlationId}` : ""}</p> : leads.length === 0 ? <div className="surface-card p-8 text-center text-ink-dim">No leads found for this status.</div> : <>
        <div className="mb-6 grid gap-4 xl:grid-cols-4">
          {boardColumns.map((column) => <section key={column.key} onDragOver={(event) => event.preventDefault()} onDrop={() => column.key === "new" ? undefined : void moveLead(column.key)} className="min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold text-ink">{column.label}</h2><span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-ink-dim">{leads.filter((lead) => lead.status === column.key).length}</span></div>
            <div className="space-y-2">{leads.filter((lead) => lead.status === column.key).map((lead) => <Link draggable href={`/sales/leads/${lead.leadId}`} key={lead.leadId} onDragStart={() => setDraggedLead(lead.leadId)} className="block rounded-xl border border-white/10 bg-surface p-3 hover:border-accent/60"><p className="text-sm font-medium text-ink">Board card · {lead.summary ?? "Untitled lead"}</p><p className="mt-1 text-xs text-ink-dim">{lead.contactName ?? "No contact"}</p><p className="text-xs text-ink-dim">{lead.contactEmail ?? lead.contactPhone ?? "No contact channel"}</p><p className="mt-2 text-[10px] uppercase tracking-wider text-accent">{lead.vertical ?? "customer"} · {lead.priority ?? "normal"}</p></Link>)}</div>
          </section>)}
        </div>
        <div className="surface-card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-ink-dim"><th className="p-4">Lead card</th><th className="p-4">Contact</th><th className="p-4">Source</th><th className="p-4">Owner</th><th className="p-4">Status</th><th className="p-4">Updated</th></tr></thead><tbody>{leads.map((lead) => <tr className="border-b border-white/5" key={lead.leadId}><td className="p-4"><Link className="text-accent hover:underline" href={`/sales/leads/${lead.leadId}`}>{lead.summary ?? "Untitled lead"}</Link><p className="text-xs text-ink-dim">{lead.vertical ?? "—"} · {lead.kanbanCardId ?? `lead:${lead.leadId}`}</p></td><td className="p-4 text-xs text-ink-dim">{lead.contactName ?? "—"}<br />{lead.contactEmail ?? "—"}<br />{lead.contactPhone ?? "—"}</td><td className="p-4 text-ink-dim">{lead.source} / {lead.persona ?? "—"}</td><td className="p-4 text-xs text-ink-dim">{lead.assignedSalesUserId ?? "Manager review"}</td><td className="p-4"><span className="rounded-full border border-accent/40 px-2 py-1 text-xs text-accent">{lead.status}</span></td><td className="p-4 text-ink-dim">{formatDate(lead.updatedAt)}</td></tr>)}</tbody></table></div>
        {!isDone && cursor ? <button type="button" disabled={loadingMore} onClick={() => void load(cursor, true)} className="mt-5 rounded-full border border-accent/50 px-4 py-2 text-sm text-accent disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button> : null}
      </>}
    </WorkspacePage>
  );
}
