"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { DealPicker } from "@/components/shared/DealPicker";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { StatusPill } from "@/components/workspace/StatusPill";
import { KYC_RISK_LABELS, KYC_STATUS_LABELS, type KycQueueItem } from "@/models";
import { api, normalizeError } from "@/services/api";
import type { NormalizedError } from "@/models/common";
export { CreateCaseForm } from "./CreateCaseForm";

export function CasesPage() {
  const router = useRouter(); const [status, setStatus] = useState(""); const [riskLevel, setRiskLevel] = useState("");
  const [items, setItems] = useState<readonly KycQueueItem[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<NormalizedError | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const r = await api.compliance.listQueue({ ...(status ? { status } : {}), ...(riskLevel ? { riskLevel } : {}) }); setItems(r.items); } catch (e) { setError(normalizeError(e)); } finally { setLoading(false); } }, [status, riskLevel]);
  useEffect(() => { void load(); }, [load]);
  return <WorkspacePage eyebrow="Compliance / Cases" title="KYC queue" description="Review and prioritize every compliance case from one queue. Risk and assignment are visible before opening a case.">
    <section className="mb-6 flex flex-wrap items-end gap-4 rounded-[20px] border border-line bg-surface-alt p-4"><label className="text-xs font-semibold text-ink-dim">Status<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 block rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"><option value="">All statuses</option>{Object.entries(KYC_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><label className="text-xs font-semibold text-ink-dim">Risk<select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="mt-2 block rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"><option value="">All risk</option>{Object.entries(KYC_RISK_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><div className="min-w-[260px] flex-1"><DealPicker label="Open a specific deal" onSelect={(deal) => router.push(`/deal-readiness/${deal.dealId}`)} /></div></section>
    {loading ? <LoadingState label="Loading KYC queue" /> : null}{error ? <ErrorState error={error} onRetry={() => void load()} /> : null}{!loading && !error && items.length === 0 ? <EmptyState title="Queue is clear" message="No KYC cases match this filter." /> : null}
    {!loading && !error && items.length > 0 ? <ul className="grid gap-4">{items.map((item) => <li key={item.caseId}><Link href={`/compliance/cases/${item.caseId}`} className="block rounded-[24px] border border-line bg-surface p-5 hover:border-accent/50"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-ink">{item.dealTitle || "Untitled deal"}</p><p className="mt-1 text-xs text-ink-dim">{item.dealId} · Assigned to {item.assignedToName || item.assignedToId || "Unassigned"}</p></div><StatusPill label={KYC_STATUS_LABELS[item.status]} tone={item.riskLevel === "prohibited" || item.riskLevel === "high" ? "bad" : item.riskLevel === "medium" ? "waiting" : "neutral"} /></div><div className="mt-4 flex flex-wrap gap-5 text-xs text-ink-dim"><span>Risk <b className="text-ink">{item.riskLevel ? KYC_RISK_LABELS[item.riskLevel] : "Unrated"}</b></span><span>Updated <b className="text-ink">{new Date(item.updatedAt).toLocaleDateString()}</b></span><span>Revision <b className="text-ink">{item.revision}</b></span></div></Link></li>)}</ul> : null}
  </WorkspacePage>;
}
