"use client";

import { useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { NormalizedError } from "@/models/common";
import type { SalesLeadDetail as SalesLeadDetailDto, SalesLeadStatus } from "@/models/salesWorkspace";
import { api, normalizeError } from "@/services/api";

function displayDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }

export function SalesLeadDetail({ id }: { id: string }) {
  const [lead, setLead] = useState<SalesLeadDetailDto | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingDisqualification, setPendingDisqualification] = useState(false);

  useEffect(() => {
    let active = true;
    api.salesWorkspace.getLead(id).then((result) => active && setLead(result)).catch((cause) => active && setError(normalizeError(cause)));
    return () => { active = false; };
  }, [id]);

  const qualify = async (status: Exclude<SalesLeadStatus, "new" | "converted" | "archived">) => {
    setBusy(true); setMessage(null);
    try {
      const result = await api.salesWorkspace.qualifyLead(id, { status });
      setLead((current) => current ? { ...current, status: result.status as SalesLeadStatus, updatedAt: result.updatedAt } : current);
      setMessage(`Lead moved to ${result.status}.`);
    } catch (cause) {
      const normalized = normalizeError(cause);
      setMessage(`${normalized.message}${normalized.correlationId ? ` Support id: ${normalized.correlationId}` : ""}`);
    } finally { setBusy(false); }
  };

  if (error) return <WorkspacePage eyebrow="Sales / Lead" title="Lead detail" description="The backend lead record could not be loaded."><p role="alert" className="text-red-300">{error.code === "NOT_FOUND" ? "This lead is unavailable or outside your scope." : error.message}{error.correlationId ? ` Support id: ${error.correlationId}` : ""}</p></WorkspacePage>;
  if (!lead) return <WorkspacePage eyebrow="Sales / Lead" title="Lead detail" description="Loading lead…" />;
  const canQualify = !["converted", "archived"].includes(lead.status);

  return <WorkspacePage eyebrow="Sales / Lead" title={lead.organization?.displayName ?? lead.summary ?? "Lead detail"} description={lead.summary ?? "Backend-owned lead record and qualification actions."}><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><section className="surface-card p-6"><dl className="grid gap-4 sm:grid-cols-2">{[["Status", lead.status], ["Source", lead.source], ["Persona", lead.persona ?? "—"], ["Vertical", lead.vertical ?? "—"], ["Organization", lead.organization?.legalName ?? "—"], ["Primary contact", lead.primaryContact?.fullName ?? "—"], ["Updated", displayDate(lead.updatedAt)]].map(([key, value]) => <div key={key}><dt className="text-xs uppercase tracking-wider text-ink-dim">{key}</dt><dd className="mt-1 text-ink">{value}</dd></div>)}</dl>{lead.convertedDeal ? <p className="mt-6 text-sm text-emerald-300">Converted deal: {lead.convertedDeal.title}</p> : null}</section><aside className="surface-card p-6"><h2 className="font-semibold text-ink">Qualification</h2><p className="mt-2 text-xs text-ink-dim">Only the backend decides whether this action is allowed.</p>{canQualify ? <div className="mt-4 grid gap-2">{(["qualified", "disqualified", "nurture"] as const).map((status) => <button disabled={busy} onClick={() => status === "disqualified" ? setPendingDisqualification(true) : void qualify(status)} key={status} className="rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-ink hover:border-accent disabled:opacity-50">Mark {status}</button>)}</div> : <p className="mt-4 text-sm text-ink-dim">This lead is terminal and cannot be qualified again.</p>}{message ? <p role="status" className="mt-4 text-xs text-ink-dim">{message}</p> : null}</aside></div>{pendingDisqualification ? <ConfirmDialog title="Disqualify this lead?" message="This action changes the lead qualification state and is recorded in the audit trail." confirmLabel="Disqualify lead" busy={busy} onCancel={() => setPendingDisqualification(false)} onConfirm={() => { setPendingDisqualification(false); void qualify("disqualified"); }} /> : null}</WorkspacePage>;
}
