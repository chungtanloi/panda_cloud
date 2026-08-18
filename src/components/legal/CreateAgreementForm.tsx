"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { api, normalizeError } from "@/services/api";

export function CreateAgreementForm({ dealId, onDone }: { dealId: string; onDone: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [counterpartyOrganizationId, setCounterpartyOrganizationId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function continueToMatter() {
    setError(null);
    if (!counterpartyOrganizationId.trim() || !ownerId.trim()) {
      setError("Counterparty organization and legal owner are required.");
      return;
    }
    setStep(2);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.legal.upsertAgreement({
        dealId,
        counterpartyOrganizationId: counterpartyOrganizationId.trim(),
        ownerId: ownerId.trim(),
        status: "drafting",
        ...(effectiveDate ? { effectiveDate } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      onDone();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(normalized.correlationId ? `${normalized.message} (correlation ${normalized.correlationId})` : normalized.message);
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="mb-8 rounded-[24px] border border-line bg-surface-alt p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">NCNDA setup · Step {step} of 2</p><h2 className="mt-2 text-lg font-semibold text-ink">{step === 1 ? "Deal & parties" : "Create legal matter"}</h2></div><span className="rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-wider text-ink-dim">Drafting</span></div>
    <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-accent ${step === 1 ? "w-1/2" : "w-full"}`} /></div>
    {step === 1 ? <div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Deal" value={dealId} readOnly hint="Taken from Deal Readiness context." /><div /><Input label="Counterparty organization id *" value={counterpartyOrganizationId} onChange={(event) => setCounterpartyOrganizationId(event.target.value)} placeholder="Organization id" /><Input label="Legal owner id *" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} placeholder="User id" /><p className="sm:col-span-2 text-xs leading-5 text-ink-dim">Organization and owner lookup APIs are not available yet, so opaque identifiers remain a temporary fallback.</p></div> : <div className="mt-6 grid gap-4"><Input label="Expected effective date" type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} hint="Activation will still require a reviewed current document and a confirmed effective date." /><label className="flex flex-col gap-2"><span className="text-xs font-medium uppercase tracking-wider text-ink-dim">Matter notes</span><textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} className="rounded-field border border-line-strong bg-deep px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none" /></label><div className="rounded-[16px] border border-line bg-white/[0.02] p-4 text-xs leading-5 text-ink-dim">The executed document is the legal source of truth. Structured clauses, signatories and governing law are not stored because the backend contract does not define them.</div></div>}
    {error ? <p role="alert" className="mt-4 text-xs leading-5 text-red-400">{error}</p> : null}
    <div className="mt-6 flex gap-3">{step === 2 ? <button type="button" onClick={() => setStep(1)} className="rounded-full border border-line px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-dim">Back</button> : null}{step === 1 ? <button type="button" onClick={continueToMatter} className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg">Continue</button> : <button type="submit" disabled={saving} className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50">{saving ? "Creating…" : "Create drafting matter"}</button>}</div>
  </form>;
}
