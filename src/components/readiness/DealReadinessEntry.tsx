"use client";

import Link from "next/link";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export function DealReadinessEntry() {
  return <WorkspacePage eyebrow="Dealflow / Handoff" title="Choose a Deal from your workspace" description="Deal Readiness always opens from a real Deal record; staff never type database identifiers.">
    <section className="max-w-4xl overflow-hidden rounded-[28px] border border-accent/25 bg-[linear-gradient(135deg,rgba(0,217,230,0.09),rgba(17,24,39,0.86)_60%)] p-7">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Recommended workflow</p><h2 className="mt-3 text-2xl font-semibold text-ink">Open the Sales Pipeline and select a Deal</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-dim">The Deal card carries customer, owner, organization, contact and revision context into NCNDA, KYC and Due Diligence automatically.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">{[["1", "Select Deal", "Open a card from Pipeline."], ["2", "Review readiness", "See Legal, Compliance and Technical work."], ["3", "Manager handoff", "Resolve blockers and convert to Project."]].map(([step,title,detail]) => <div key={step} className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] font-bold text-accent">STEP {step}</p><p className="mt-2 text-sm font-semibold text-ink">{title}</p><p className="mt-1 text-xs leading-5 text-ink-dim">{detail}</p></div>)}</div>
      <Link href="/sales/pipeline" className="mt-6 inline-flex rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg">Open Sales Pipeline</Link>
    </section>
    <section className="mt-6 max-w-4xl rounded-[24px] border border-line bg-surface p-6"><h2 className="text-sm font-semibold text-ink">Backend dependency</h2><p className="mt-2 text-sm leading-6 text-ink-dim">Global Legal, Compliance and Technical queues still require backend list endpoints. Until those contracts exist, assignments should enter through Deal Handoff links instead of an ID field.</p></section>
  </WorkspacePage>;
}
