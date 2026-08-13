"use client";

import { useState } from "react";
import type { DealCardCreate, DealStage } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

const stages: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

export function ManualDealModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<DealCardCreate>({ title: "", columnId: "lead", source: "manual", contactName: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open) return null;

  function field<K extends keyof DealCardCreate>(key: K, value: DealCardCreate[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    if (!form.title.trim() || !form.contactName.trim() || !form.email.includes("@")) { setError("Title, contact name and a valid email are required."); return; }
    setSaving(true);
    try { await api.sales.createCard(form); onCreated(); onClose(); setForm({ title: "", columnId: "lead", source: "manual", contactName: "", email: "" }); }
    catch (cause) { setError(normalizeError(cause).message); }
    finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/70 p-4" onMouseDown={onClose}><form onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} className="my-8 w-full max-w-xl rounded-[28px] border border-line bg-surface-alt p-6 shadow-2xl backdrop-blur-auth"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Manual CRM entry</p><h2 className="mt-2 text-2xl font-semibold text-ink">Add pipeline card</h2><p className="mt-2 text-xs leading-5 text-ink-dim">Use this for outbound or offline leads. Customer forms will continue creating cards automatically.</p></div><button type="button" onClick={onClose} className="text-xl text-ink-dim">×</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Input label="Card title *" value={form.title} onChange={(value) => field("title", value)} /><Input label="Company" value={form.companyName ?? ""} onChange={(value) => field("companyName", value)} /><Input label="Contact name *" value={form.contactName} onChange={(value) => field("contactName", value)} /><Input label="Email *" type="email" value={form.email} onChange={(value) => field("email", value)} /><Input label="Phone" value={form.phone ?? ""} onChange={(value) => field("phone", value)} /><Input label="Deal value (USD)" type="number" value={form.dealValueUsd?.toString() ?? ""} onChange={(value) => field("dealValueUsd", value ? Number(value) : undefined)} /><label className="flex flex-col gap-2 text-xs text-ink-dim">Stage<select value={form.columnId} onChange={(event) => field("columnId", event.target.value as DealStage)} className="rounded-xl border border-line bg-deep px-3 py-3 text-sm text-ink">{stages.map((stage) => <option key={stage} value={stage}>{stage.toUpperCase()}</option>)}</select></label><label className="flex flex-col gap-2 text-xs text-ink-dim sm:col-span-2">Notes<textarea rows={3} value={form.notes ?? ""} onChange={(event) => field("notes", event.target.value)} className="rounded-xl border border-line bg-deep px-3 py-3 text-sm text-ink" /></label></div>{error ? <p className="mt-4 text-xs text-red-400" role="alert">{error}</p> : null}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full border border-line px-5 py-2.5 text-xs font-bold uppercase text-ink-dim">Cancel</button><button disabled={saving} className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase text-accent-fg disabled:opacity-50">{saving ? "Adding…" : "Add card"}</button></div></form></div>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="flex flex-col gap-2 text-xs text-ink-dim">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-line bg-deep px-3 py-3 text-sm text-ink" /></label>; }
