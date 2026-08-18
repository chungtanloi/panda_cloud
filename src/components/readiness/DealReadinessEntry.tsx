"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { Input } from "@/components/ui/Field";

export function DealReadinessEntry() {
  const router = useRouter();
  const [dealId, setDealId] = useState("");
  return <WorkspacePage eyebrow="Dealflow / Readiness" title="Open deal readiness" description="Review NCNDA and KYC progress together for one Deal."><form onSubmit={(event) => { event.preventDefault(); const value = dealId.trim(); if (value) router.push(`/deal-readiness/${encodeURIComponent(value)}`); }} className="max-w-2xl rounded-[24px] border border-line bg-surface p-6"><h2 className="text-sm font-semibold text-ink">Deal context</h2><p className="mt-2 text-sm leading-6 text-ink-dim">The backend does not expose a staff-wide Deal lookup yet. Enter the opaque Deal id as a temporary fallback.</p><div className="mt-5"><Input label="Deal id *" value={dealId} onChange={(event) => setDealId(event.target.value)} placeholder="Deal id" /></div><button type="submit" className="mt-5 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg">Open readiness</button></form></WorkspacePage>;
}
