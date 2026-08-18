"use client";

import { useState } from "react";
import type { SalesCard } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

type Milestone = "contact" | "proposal_sent" | "customer_response";

const LABELS: Record<Milestone, string> = {
  contact: "Completed customer contact",
  proposal_sent: "Proposal sent",
  customer_response: "Customer responded",
};

export function DealMilestoneComposer({ card, onSaved }: { card: SalesCard; onSaved: () => void }) {
  const [milestone, setMilestone] = useState<Milestone>("contact");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function record() {
    if (notes.trim().length < 3) return;
    setSaving(true);
    setMessage(null);
    try {
      const inbound = milestone === "customer_response";
      await api.salesWorkspace.createActivity({
        dealId: card.id,
        ...(card.primaryContact?.contactId ? { contactId: card.primaryContact.contactId } : {}),
        activityType: milestone === "contact" ? "call" : "email",
        direction: inbound ? "inbound" : "outbound",
        subject: LABELS[milestone],
        notes: notes.trim(),
        status: "completed",
        ...(milestone === "contact" ? {} : { businessEvent: milestone }),
        contactedAt: Date.now(),
      });
      setNotes("");
      setMessage("Milestone recorded.");
      onSaved();
    } catch (cause) {
      setMessage(normalizeError(cause).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-panel border border-line-soft bg-surface p-[14px]">
      <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-accent">Sales evidence</p>
      <h3 className="pt-[3px] text-[14px] font-semibold text-white">Record a completed milestone</h3>
      <p className="pt-[4px] text-[11px] leading-[17px] text-ink-dim">
        These activities satisfy stage checks only when the backend validates their direction and completion state.
      </p>
      <div className="mt-[10px] grid gap-[8px]">
        <select value={milestone} onChange={(event) => setMilestone(event.target.value as Milestone)} className="rounded-field border border-line-strong bg-deep px-[10px] py-[9px] text-[12px] text-ink focus:border-accent focus:outline-none">
          {(Object.keys(LABELS) as Milestone[]).map((value) => <option key={value} value={value}>{LABELS[value]}</option>)}
        </select>
        <textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Outcome, customer feedback, and next action…" className="rounded-field border border-line-strong bg-deep px-[10px] py-[9px] text-[12px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none" />
        <div className="flex items-center justify-between gap-[10px]">
          <span className="text-[11px] text-ink-dim" role="status">{message}</span>
          <button type="button" onClick={record} disabled={saving || notes.trim().length < 3} className="rounded-full bg-accent px-[14px] py-[8px] text-[10px] font-bold uppercase tracking-[0.6px] text-accent-fg disabled:opacity-40">
            {saving ? "Recording…" : "Record"}
          </button>
        </div>
      </div>
    </section>
  );
}
