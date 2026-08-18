"use client";

import { useState } from "react";
import type { SalesCardMoveRequest, SalesTransitionOption } from "@/models/sales";

type Extras = Pick<SalesCardMoveRequest, "reason" | "followUpAt" | "override" | "overrideReason">;

export function TransitionReviewDialog({
  option,
  onResolve,
}: {
  option: SalesTransitionOption;
  onResolve: (value: Extras | null) => void;
}) {
  const [reason, setReason] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const needsHold = option.code === "on_hold";
  const needsOverride = option.blockers.some((item) => item.code === "OVERRIDE_REQUIRED");
  const valid = (!needsHold || (reason.trim().length >= 5 && followUp)) && (!needsOverride || overrideReason.trim().length >= 5);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-[20px] backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="transition-title">
      <div className="max-h-[85vh] w-full max-w-[620px] overflow-y-auto rounded-panel border border-accent/30 bg-surface p-[22px] shadow-panel">
        <p className="font-mono text-[9px] uppercase tracking-[1.5px] text-accent">Pipeline transition review</p>
        <h2 id="transition-title" className="pt-[5px] text-[22px] font-semibold text-white">Move to {option.name}</h2>

        {option.warnings.length > 0 ? <IssueList title="Warnings — review before continuing" tone="warning" items={option.warnings} /> : null}
        {option.blockers.length > 0 ? <IssueList title={needsOverride ? "Manager override required" : "Required information"} tone="blocker" items={option.blockers} /> : null}

        {needsHold ? (
          <div className="mt-[16px] grid gap-[12px] sm:grid-cols-2">
            <label className="flex flex-col gap-[6px] sm:col-span-2">
              <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-dim">Reason *</span>
              <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} className="rounded-field border border-line-strong bg-deep p-[10px] text-[12px] text-ink focus:border-accent focus:outline-none" />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-dim">Follow-up date *</span>
              <input type="datetime-local" value={followUp} onChange={(event) => setFollowUp(event.target.value)} className="rounded-field border border-line-strong bg-deep p-[10px] text-[12px] text-ink focus:border-accent focus:outline-none" />
            </label>
          </div>
        ) : null}

        {needsOverride ? (
          <label className="mt-[16px] flex flex-col gap-[6px]">
            <span className="font-mono text-[9px] uppercase tracking-[1px] text-amber-200">Override reason *</span>
            <textarea rows={3} value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} className="rounded-field border border-amber-300/30 bg-deep p-[10px] text-[12px] text-ink focus:border-amber-300 focus:outline-none" />
          </label>
        ) : null}

        <div className="mt-[20px] flex justify-end gap-[9px]">
          <button type="button" onClick={() => onResolve(null)} className="rounded-full border border-line-strong px-[16px] py-[9px] text-[11px] font-semibold text-ink-dim">Cancel</button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onResolve({
              ...(needsHold ? { reason: reason.trim(), followUpAt: new Date(followUp).getTime() } : {}),
              ...(needsOverride ? { override: true, overrideReason: overrideReason.trim() } : {}),
            })}
            className="rounded-full bg-accent px-[18px] py-[9px] text-[11px] font-bold text-accent-fg disabled:opacity-40"
          >
            Confirm transition
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueList({ title, tone, items }: { title: string; tone: "warning" | "blocker"; items: Array<{ code: string; message: string }> }) {
  return <section className={`mt-[14px] rounded-field border p-[12px] ${tone === "warning" ? "border-amber-300/30 bg-amber-300/[0.07]" : "border-red-300/30 bg-red-300/[0.07]"}`}><h3 className={`text-[12px] font-semibold ${tone === "warning" ? "text-amber-200" : "text-red-200"}`}>{title}</h3><ul className="mt-[7px] grid gap-[5px]">{items.map((item) => <li key={item.code} className="text-[11px] leading-[17px] text-ink-dim">• {item.message}</li>)}</ul></section>;
}
