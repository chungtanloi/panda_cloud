"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/services/api";
import { useAsync } from "@/controllers/useAsync";
import { WorkspacePage } from "./WorkspacePage";
import { StatCard } from "@/components/shared/StatCard";
import { ErrorState, LoadingState } from "@/components/ui/states";

export function ManagerOverviewView() {
  const { state, run } = useAsync(() => api.manager.overview(), { immediate: [] });
  if (state.status === "loading" || state.status === "idle") return <WorkspacePage eyebrow="Manager / Overview" title="Business Operations" description="Source-backed commercial, team and project state."><LoadingState label="Loading manager overview" /></WorkspacePage>;
  if (state.status === "error") return <WorkspacePage eyebrow="Manager / Overview" title="Business Operations" description="Source-backed commercial, team and project state."><ErrorState error={state.error} onRetry={() => void run()} /></WorkspacePage>;
  const data = state.data;
  const open = data.commercial.dealCounts.open ?? 0;
  const won = data.commercial.wonDealCount;
  const pending = data.projects.wonDealsPendingProject;
  return <WorkspacePage eyebrow="Manager / Overview" title="Business Operations" description="Source-backed commercial, team and project state." stats={[{ label: "Open Deals", value: String(open) }, { label: "Won Deals", value: String(won) }, { label: "Sales Team", value: String(data.team.activeSalesMemberCount) }, { label: "Pending Projects", value: String(pending) }]}><section className="mb-6 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-ink">Manager Handoff Queue</h2><p className="mt-1 text-xs text-ink-dim">Won deals awaiting readiness review or project conversion.</p></div><Link href="/manager/pipeline" className="rounded-full border border-accent/40 px-3 py-2 text-xs text-accent">Open pipeline</Link></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-line bg-surface p-3"><p className="text-xs text-ink-dim">Won pending project</p><p className="mt-1 text-xl text-ink">{pending}</p></div><div className="rounded-xl border border-line bg-surface p-3"><p className="text-xs text-ink-dim">Readiness review</p><p className="mt-1 text-xl text-ink">Open per deal</p></div><div className="rounded-xl border border-line bg-surface p-3"><p className="text-xs text-ink-dim">Conversion</p><p className="mt-1 text-xl text-ink">Manager/Admin</p></div></div></section><section className="grid gap-4 lg:grid-cols-3">{["Commercial pipeline", "Projects by status", "Projects by vertical"].map((title, index) => <article key={title} className="rounded-[24px] border border-line bg-surface p-6"><h2 className="text-sm font-semibold text-ink">{title}</h2><pre className="mt-4 overflow-auto text-xs text-ink-dim">{JSON.stringify(index === 0 ? data.commercial.pipelineValueByCurrency : index === 1 ? data.projects.countsByStatus : data.projects.countsByVertical, null, 2)}</pre></article>)}</section></WorkspacePage>;
}

export function ManagerTeamView() {
  const { state, run } = useAsync(() => api.manager.team(), { immediate: [] });
  if (state.status === "loading" || state.status === "idle") return <WorkspacePage eyebrow="Manager / People" title="Team Performance" description="Active Sales memberships and source-backed metrics."><LoadingState label="Loading manager team" /></WorkspacePage>;
  if (state.status === "error") return <WorkspacePage eyebrow="Manager / People" title="Team Performance" description="Active Sales memberships and source-backed metrics."><ErrorState error={state.error} onRetry={() => void run()} /></WorkspacePage>;
  return <WorkspacePage eyebrow="Manager / People" title="Team Performance" description="Active Sales memberships and source-backed metrics."><div className="overflow-x-auto rounded-2xl border border-line"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-line text-ink-dim"><th className="p-4">Salesperson</th><th className="p-4">Assigned</th><th className="p-4">Won</th><th className="p-4">Pipeline</th><th className="p-4">Last activity</th></tr></thead><tbody>{state.data.items.map((member) => <tr key={member.userId} className="border-b border-line/60"><td className="p-4"><div className="font-medium text-ink">{member.fullName || "—"}</div><div className="text-xs text-ink-dim">{member.email}</div></td><td className="p-4">{member.dealCounts.assigned ?? 0}</td><td className="p-4">{member.dealCounts.won ?? 0}</td><td className="p-4">{member.pipelineValue.map((value) => `${value.currency} ${value.amountMinor}`).join(", ") || "—"}</td><td className="p-4">{member.lastActivityAt ? new Date(member.lastActivityAt).toLocaleString() : "—"}</td></tr>)}</tbody></table>{state.data.items.length === 0 ? <p className="p-8 text-center text-sm text-ink-dim">No active Sales members found.</p> : null}</div></WorkspacePage>;
}

export function ManagerReportsView() {
  const { state, run } = useAsync(() => api.manager.projectReport(), { immediate: [] });
  if (state.status === "loading" || state.status === "idle") return <WorkspacePage eyebrow="Manager / Analytics" title="Reports" description="Project reporting supplied by the backend."><LoadingState label="Loading manager reports" /></WorkspacePage>;
  if (state.status === "error") return <WorkspacePage eyebrow="Manager / Analytics" title="Reports" description="Project reporting supplied by the backend."><ErrorState error={state.error} onRetry={() => void run()} /></WorkspacePage>;
  return <WorkspacePage eyebrow="Manager / Analytics" title="Reports" description="Project reporting supplied by the backend."><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Started projects", state.data.startedProjects], ["Completed projects", state.data.completedProjects], ["Won pending project", state.data.wonDealsPendingProject], ["Status buckets", Object.keys(state.data.countsByStatus).length]].map(([label, value]) => <StatCard key={String(label)} label={String(label)} value={String(value)} />)}</section></WorkspacePage>;
}

export function ManagerSalesPerformanceView() {
  const { state, run } = useAsync(() => Promise.all([api.salesWorkspace.overview(), api.salesWorkspace.conversionReport(), api.salesWorkspace.activityReport(), api.salesWorkspace.forecastReport()]), { immediate: [] });
  if (state.status === "loading" || state.status === "idle") return <WorkspacePage eyebrow="Manager / Commercial" title="Sales Performance" description="Backend sales overview and reports."><LoadingState label="Loading sales performance" /></WorkspacePage>;
  if (state.status === "error") return <WorkspacePage eyebrow="Manager / Commercial" title="Sales Performance" description="Backend sales overview and reports."><ErrorState error={state.error} onRetry={() => void run()} /></WorkspacePage>;
  const [overview, conversion, activity, forecast] = state.data;
  return <WorkspacePage eyebrow="Manager / Commercial" title="Sales Performance" description="Source-backed pipeline, conversion, activity and forecast signals." stats={[{ label: "Open deals", value: String(overview.dealSummary.open) }, { label: "Won deals", value: String(overview.dealSummary.won) }, { label: "Total leads", value: String(conversion.totalLeads) }, { label: "Activities", value: String(activity.totalActivities) }]}><div className="grid gap-4 lg:grid-cols-3"><article className="rounded-2xl border border-line bg-surface p-5"><h2 className="text-sm font-semibold text-ink">Pipeline by currency</h2><pre className="mt-3 overflow-auto text-xs text-ink-dim">{JSON.stringify(overview.pipelineValue, null, 2)}</pre></article><article className="rounded-2xl border border-line bg-surface p-5"><h2 className="text-sm font-semibold text-ink">Conversion</h2><pre className="mt-3 overflow-auto text-xs text-ink-dim">{JSON.stringify(conversion.countsByStatus, null, 2)}</pre></article><article className="rounded-2xl border border-line bg-surface p-5"><h2 className="text-sm font-semibold text-ink">Forecast</h2><pre className="mt-3 overflow-auto text-xs text-ink-dim">{JSON.stringify(forecast.byCurrency, null, 2)}</pre></article></div></WorkspacePage>;
}

export function ManagerAssessmentLeadQueueView() {
  const { state, run } = useAsync(() => Promise.all([api.manager.assessmentLeadQueue(), api.manager.team()]), { immediate: [] });
  const [selectedSales, setSelectedSales] = useState<Record<string, string>>({});
  const [assigningLead, setAssigningLead] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  if (state.status === "loading" || state.status === "idle") return <WorkspacePage eyebrow="Manager / Sales" title="Assessment Lead Queue" description="Paid assessment leads waiting for Manager assignment to a Sales owner."><LoadingState label="Loading assessment leads" /></WorkspacePage>;
  if (state.status === "error") return <WorkspacePage eyebrow="Manager / Sales" title="Assessment Lead Queue" description="Paid assessment leads waiting for Manager assignment to a Sales owner."><ErrorState error={state.error} onRetry={() => void run()} /></WorkspacePage>;

  const [queue, team] = state.data;
  const salesMembers = team.items;
  const assign = async (leadId: string) => {
    const salesUserId = selectedSales[leadId];
    if (!salesUserId) return;
    setAssigningLead(leadId);
    setAssignError(null);
    try {
      await api.manager.assignAssessmentLead(leadId, salesUserId);
      await run();
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : "Unable to assign this lead.");
    } finally {
      setAssigningLead(null);
    }
  };

  return <WorkspacePage eyebrow="Manager / Sales" title="Assessment Lead Queue" description="Review paid assessment results and assign each priority lead to a Sales owner." stats={[{ label: "Waiting for assignment", value: String(queue.leads.length) }, { label: "Active Sales members", value: String(salesMembers.length) }]}>
    {assignError ? <div className="mb-5 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{assignError}</div> : null}
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><div><h2 className="text-sm font-semibold text-ink">Paid assessment leads</h2><p className="mt-1 text-xs text-ink-dim">Only leads confirmed by payment webhook appear here. Assignment is recorded with an audit event.</p></div><button type="button" onClick={() => void run()} className="rounded-full border border-accent/40 px-3 py-2 text-xs text-accent">Refresh queue</button></div>
      {queue.leads.length === 0 ? <div className="p-10 text-center"><p className="text-sm text-ink">No leads are waiting for assignment.</p><p className="mt-2 text-xs text-ink-dim">A paid assessment will appear here after Stripe payment confirmation.</p></div> : <div className="divide-y divide-line">{queue.leads.map((lead) => <article key={lead.leadId} className="p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-danger/30 bg-danger/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-danger">{lead.priority || "high"} priority</span><span className="rounded-full border border-accent/30 px-2 py-1 text-[10px] uppercase tracking-wider text-accent">{lead.assignmentStatus || "manager_review"}</span></div><p className="mt-3 text-sm leading-6 text-ink">{lead.summary || "Paid assessment completed; review the full report in the assessment session."}</p><dl className="mt-3 grid gap-2 text-xs text-ink-dim sm:grid-cols-2"><div><dt className="inline font-semibold text-ink-dim">Lead: </dt><dd className="inline break-all">{lead.leadId}</dd></div><div><dt className="inline font-semibold text-ink-dim">Session: </dt><dd className="inline break-all">{lead.assessmentSessionId || "—"}</dd></div><div><dt className="inline font-semibold text-ink-dim">Payment: </dt><dd className="inline break-all">{lead.paymentId || "—"}</dd></div><div><dt className="inline font-semibold text-ink-dim">Source: </dt><dd className="inline">{lead.source} / {lead.vertical || "land"}</dd></div></dl></div><div className="w-full shrink-0 sm:w-64"><label className="block text-xs font-semibold text-ink-dim" htmlFor={`sales-${lead.leadId}`}>Assign Sales owner</label><select id={`sales-${lead.leadId}`} value={selectedSales[lead.leadId] || lead.assignedSalesUserId || ""} onChange={(event) => setSelectedSales((current) => ({ ...current, [lead.leadId]: event.target.value }))} className="mt-2 w-full rounded-xl border border-line bg-background px-3 py-3 text-sm text-ink"><option value="">Select a Sales member</option>{salesMembers.map((member) => <option key={member.userId} value={member.userId}>{member.fullName || member.email}</option>)}</select><button type="button" disabled={!selectedSales[lead.leadId] || assigningLead === lead.leadId} onClick={() => void assign(lead.leadId)} className="mt-2 w-full rounded-xl bg-accent px-3 py-3 text-xs font-semibold uppercase tracking-wider text-background disabled:cursor-not-allowed disabled:opacity-40">{assigningLead === lead.leadId ? "Assigning..." : "Assign lead"}</button></div></div></article>)}</div>}
    </section>
  </WorkspacePage>;
}
