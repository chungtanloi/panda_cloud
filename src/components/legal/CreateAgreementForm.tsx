"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { NCNDA_STATUSES, NCNDA_STATUS_LABELS, requiresEffectiveDate, type NcndaStatus } from "@/models";
import { api, normalizeError } from "@/services/api";

export function CreateAgreementForm({ dealId, onDone }: { dealId: string; onDone: () => void }) {
  const [counterpartyOrganizationId, setCounterpartyOrganizationId] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [status, setStatus] = useState<NcndaStatus>("drafting");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    if (!counterpartyOrganizationId.trim() || !ownerId.trim()) { setError("Counterparty organization and owner are required."); return; }
    if (status === "active" && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)) { setError("An active agreement needs an effective date in YYYY-MM-DD."); return; }
    setSaving(true);
    try { await api.legal.upsertAgreement({ dealId, counterpartyOrganizationId: counterpartyOrganizationId.trim(), ownerId: ownerId.trim(), status, ...(effectiveDate ? { effectiveDate } : {}), ...(notes.trim() ? { notes: notes.trim() } : {}) }); onDone(); }
    catch (cause) { const normalized = normalizeError(cause); setError(normalized.correlationId ? `${normalized.message} (correlation ${normalized.correlationId})` : normalized.message); }
    finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="mb-8 rounded-[24px] border border-line bg-surface-alt p-6"><h2 className="text-sm font-semibold text-ink">New NCNDA agreement</h2><p className="mt-1 text-xs leading-5 text-ink-dim">The backend owns uniqueness and revision policy. IDs are entered directly until lookup contracts are available.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><Input label="Counterparty organization id *" value={counterpartyOrganizationId} onChange={(event) => setCounterpartyOrganizationId(event.target.value)} placeholder="org_01" /><Input label="Owner id *" value={ownerId} onChange={(event) => setOwnerId(event.target.value)} placeholder="user_legal_01" /><Select label="Initial status" value={status} onChange={(event) => setStatus(event.target.value as NcndaStatus)} options={NCNDA_STATUSES.map((value) => ({ value, label: NCNDA_STATUS_LABELS[value] }))} /><Input label={requiresEffectiveDate(status) ? "Effective date *" : "Effective date"} type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} /><label className="flex w-full flex-col gap-[8px] sm:col-span-2"><span className="font-sans text-[12px] font-medium uppercase tracking-[0.6px] text-ink-dim">Notes</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="w-full rounded-field border border-line-strong bg-deep px-[17px] py-[15px] text-[14px] text-ink focus:border-accent focus:outline-none" /></label></div>{error ? <p role="alert" className="mt-4 text-xs leading-5 text-red-400">{error}</p> : null}<button type="submit" disabled={saving} className="mt-5 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50">{saving ? "Creating…" : "Create agreement"}</button></form>;
}