"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { DealPicker } from "@/components/shared/DealPicker";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { StatusPill } from "@/components/workspace/StatusPill";
import { DD_ASSESSMENT_STATUS_LABELS, type DdAssessmentQueueItem } from "@/models";
import { DD_ASSESSMENT_STATUS_TONES } from "@/config/lifecycle";
import { api, normalizeError } from "@/services/api";
import type { NormalizedError } from "@/models/common";

export function AssessmentsPage() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<readonly DdAssessmentQueueItem[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState<NormalizedError | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { const r = await api.dueDiligence.listQueue(status ? { status } : undefined); setItems(r.items); } catch (e) { setError(normalizeError(e)); } finally { setLoading(false); } }, [status]);
  useEffect(() => { void load(); }, [load]);
  return <WorkspacePage eyebrow="Technical / Assessments" title="Due Diligence queue" description="Review every technical assessment from one workspace. Filter the queue or open a specific deal handoff.">
    <section className="mb-6 flex flex-wrap items-end gap-4 rounded-[20px] border border-line bg-surface-alt p-4"><label className="text-xs font-semibold text-ink-dim">Status<select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-2 block rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink"><option value="">All statuses</option>{Object.entries(DD_ASSESSMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label><div className="min-w-[260px] flex-1"><DealPicker label="Open a specific deal" onSelect={(deal) => router.push(`/technical/assessments?dealId=${encodeURIComponent(deal.dealId)}`)} /></div></section>
    {loading ? <LoadingState label="Loading assessment queue" /> : null}{error ? <ErrorState error={error} onRetry={() => void load()} /> : null}{!loading && !error && items.length === 0 ? <EmptyState title="Queue is clear" message="No technical assessments match this filter." /> : null}
    {!loading && !error && items.length > 0 ? <ul className="grid gap-4">{items.map((item) => <li key={item.assessmentId}><Link href={`/technical/assessments/${item.assessmentId}`} className="block rounded-[24px] border border-line bg-surface p-5 hover:border-accent/50"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-ink">{item.dealTitle || "Untitled deal"}</p><p className="mt-1 text-xs text-ink-dim">{item.dealId} · Assigned to {item.assignedTo || "Unassigned"}</p></div><StatusPill label={DD_ASSESSMENT_STATUS_LABELS[item.status]} tone={DD_ASSESSMENT_STATUS_TONES[item.status]} /></div><div className="mt-4 flex flex-wrap gap-5 text-xs text-ink-dim"><span>Completion <b className="text-ink">{item.metrics?.completionRate == null ? "—" : `${Math.round(item.metrics.completionRate * 100)}%`}</b></span><span>Compliance <b className="text-ink">{item.metrics?.complianceRate == null ? "—" : `${Math.round(item.metrics.complianceRate * 100)}%`}</b></span><span>Updated <b className="text-ink">{new Date(item.updatedAt).toLocaleDateString()}</b></span></div></Link></li>)}</ul> : null}
  </WorkspacePage>;
}
