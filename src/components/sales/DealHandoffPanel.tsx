"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/controllers/AuthContext";
import { hasRole } from "@/models/auth";
import type { SalesCard } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

function lane(status: string | null | undefined, ready: boolean): { label: string; tone: string } {
  if (ready) return { label: "Ready", tone: "text-emerald-300 border-emerald-300/30" };
  if (["rejected", "cancelled", "expired", "provider_error"].includes(status ?? "")) return { label: "Blocked", tone: "text-red-300 border-red-300/30" };
  return { label: status ? "Needs attention" : "Not started", tone: "text-amber-300 border-amber-300/30" };
}

export function DealHandoffPanel({ card, onRefresh }: { card: SalesCard; onRefresh?: () => void }) {
  const { profile } = useAuth();
  const canConvert = hasRole(profile, "manager") || hasRole(profile, "admin");
  const [data, setData] = useState<{ ncnda: string | null; kyc: { status: string; verifiedAt: string | null; expiresAt: string | null } | null; dd: string | null; tasks: number; activities: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [projectCode, setProjectCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.allSettled([
      api.legal.listAgreements(card.id),
      api.compliance.listCases(card.id),
      api.dueDiligence.listAssessments(card.id),
      api.salesWorkspace.listTasks({ dealId: card.id, limit: 50 }),
      api.salesWorkspace.listActivities(card.id, { limit: 50 }),
    ]).then(([ncnda, kyc, dd, tasks, activities]) => {
      if (cancelled) return;
      const first = <T,>(result: PromiseSettledResult<T>) => result.status === "fulfilled" ? result.value : null;
      const n = first(ncnda) as { items: Array<{ status: string }> } | null;
      const k = first(kyc) as { items: Array<{ status: string; verifiedAt: string | null; expiresAt: string | null }> } | null;
      const d = first(dd) as { items: Array<{ status: string }> } | null;
      const t = first(tasks) as { tasks: unknown[] } | null;
      const a = first(activities) as { activities: unknown[] } | null;
      setData({ ncnda: n?.items[0]?.status ?? null, kyc: k?.items[0] ?? null, dd: d?.items[0]?.status ?? null, tasks: t?.tasks.length ?? 0, activities: a?.activities.length ?? 0 });
      if ([ncnda, kyc, dd].some((r) => r.status === "rejected")) setError("Some readiness data could not be loaded. Open the readiness workspace for details.");
    });
    return () => { cancelled = true; };
  }, [card.id]);

  const kycReady = Boolean(data?.kyc?.status === "approved" && data.kyc.verifiedAt && (!data.kyc.expiresAt || new Date(data.kyc.expiresAt).getTime() > Date.now()));
  const ncndaReady = data?.ncnda === "active";
  const ddReady = data?.dd === "completed";
  const overall = card.projectId ? "Project Created" : card.status !== "won" ? "Sales Active" : ncndaReady && kycReady && ddReady ? "Ready for Project Conversion" : "Needs Readiness Attention";
  const lanes = useMemo(() => ({ ncnda: lane(data?.ncnda, ncndaReady), kyc: lane(data?.kyc?.status, kycReady), dd: lane(data?.dd, ddReady) }), [data, ncndaReady, kycReady, ddReady]);

  async function convert() {
    if (!projectCode.trim()) return;
    setBusy(true); setMessage(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await api.manager.convertDealToProject(card.id, { expectedRevision: card.revision, idempotencyKey, projectCode: projectCode.trim(), ...(projectName.trim() ? { projectName: projectName.trim() } : {}) });
      setMessage(`Project ${String(result.projectId ?? "created")} created.`);
      onRefresh?.();
    } catch (cause) {
      const e = normalizeError(cause);
      setMessage(e.code === "CONFLICT" ? "Deal changed on the server. Reloaded revision is required before conversion." : e.message);
      if (e.code === "CONFLICT") onRefresh?.();
    } finally { setBusy(false); }
  }

  return <section className="mt-6 rounded-2xl border border-accent/25 bg-accent/[0.04] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[1.5px] text-accent">Deal handoff</p><h3 className="mt-1 text-lg font-semibold text-ink">{overall}</h3><p className="text-xs text-ink-dim">Sales → Manager review → Project conversion</p></div><Link className="rounded-full border border-accent/40 px-3 py-2 text-xs text-accent" href={`/deal-readiness/${card.id}`}>Open Deal Readiness</Link></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3">{([["NCNDA", lanes.ncnda], ["KYC", lanes.kyc], ["Due diligence", lanes.dd]] as const).map(([label, value]) => <div key={label} className={`rounded-xl border px-3 py-3 ${value.tone}`}><p className="text-xs font-semibold">{label}</p><p className="mt-1 text-sm">{value.label}</p></div>)}</div>
    <div className="mt-4 grid gap-2 text-xs text-ink-dim sm:grid-cols-4"><span>Customer: <b className="text-ink">{card.organizationName ?? "—"}</b></span><span>Owner: <b className="text-ink">{card.ownerName ?? "—"}</b></span><span>Activities: <b className="text-ink">{data?.activities ?? "…"}</b></span><span>Open tasks: <b className="text-ink">{data?.tasks ?? "…"}</b></span></div>
    {error ? <p className="mt-3 text-xs text-amber-300">{error}</p> : null}
    {canConvert && card.status === "won" && !card.projectId ? <div className="mt-5 border-t border-white/10 pt-4"><p className="text-sm font-semibold text-ink">Convert to Project</p><p className="mt-1 text-xs text-ink-dim">Backend enforces authorization, won status and optimistic concurrency. Readiness is shown for review but is not a client-side gate.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><input value={projectCode} onChange={(e) => setProjectCode(e.target.value)} placeholder="Project code *" className="rounded-lg border border-line bg-deep px-3 py-2 text-sm text-ink"/><input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name (optional)" className="rounded-lg border border-line bg-deep px-3 py-2 text-sm text-ink"/></div><button type="button" disabled={busy || !projectCode.trim()} onClick={() => void convert()} className="mt-3 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-fg disabled:opacity-40">{busy ? "Converting…" : "Convert to Project"}</button>{message ? <p className="mt-2 text-xs text-ink-dim">{message}</p> : null}</div> : null}
  </section>;
}
