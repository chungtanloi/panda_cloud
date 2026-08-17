"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Input, Select } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import { KYC_DOCUMENT_ROLE_LABELS, KYC_DOCUMENT_ROLES, type KycDocument, type KycDocumentRole } from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

export function CaseDocuments({ caseId }: { caseId: string }) {
  const { profile } = useAuth();
  const canManage = hasPermission(profile, "kyc:manage");
  const [documents, setDocuments] = useState<readonly KycDocument[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [role, setRole] = useState<KycDocumentRole>("supporting");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await api.compliance.listDocuments(caseId);
      setDocuments(response.documents);
    } catch (cause) { setDocuments(null); setError(normalizeError(cause)); }
    finally { setLoading(false); }
  }, [caseId]);

  useEffect(() => { void load(); }, [load]);

  async function attach(event: React.FormEvent) {
    event.preventDefault(); setMessage(null);
    if (!documentId.trim()) { setMessage("Enter the registered document id."); return; }
    setSaving(true);
    try {
      await api.compliance.attachDocument(caseId, { documentId: documentId.trim(), documentRole: role });
      setDocumentId(""); setMessage("Document attached."); await load();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setMessage(normalized.correlationId ? normalized.message + " (correlation " + normalized.correlationId + ")" : normalized.message);
    } finally { setSaving(false); }
  }

  async function detach(document: KycDocument) {
    setMessage(null); setSaving(true);
    try { await api.compliance.detachDocument(caseId, document.documentId); setMessage("Document detached."); await load(); }
    catch (cause) { const normalized = normalizeError(cause); setMessage(normalized.message); }
    finally { setSaving(false); }
  }

  return <WorkspacePage eyebrow="Compliance / Documents" title="KYC case documents" description="Attach registered, malware-clean documents to this case. Binary upload and document registration are separate backend operations.">
    <div className="mb-6"><a href={"/compliance/cases/" + caseId} className="text-xs font-bold uppercase tracking-wider text-accent hover:underline">← Back to case</a></div>
    {canManage ? <form onSubmit={attach} className="mb-6 rounded-[24px] border border-line bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">Attach a registered document</h2>
      <p className="mt-1 text-xs leading-5 text-ink-dim">Register the file through the approved document flow first. This screen only attaches an existing document id.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_220px_auto] sm:items-end">
        <Input label="Document id *" value={documentId} onChange={(event) => setDocumentId(event.target.value)} placeholder="doc_01" />
        <Select label="Document role" value={role} onChange={(event) => setRole(event.target.value as KycDocumentRole)} options={KYC_DOCUMENT_ROLES.map((value) => ({ value, label: KYC_DOCUMENT_ROLE_LABELS[value] }))} />
        <button type="submit" disabled={saving} className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50">{saving ? "Attaching…" : "Attach"}</button>
      </div>
      {message ? <p role="alert" className="mt-4 text-xs text-ink-dim">{message}</p> : null}
    </form> : null}
    {loading ? <LoadingState label="Loading documents" /> : null}
    {!loading && error ? <ErrorState error={error} onRetry={() => void load()} /> : null}
    {!loading && !error && documents?.length === 0 ? <EmptyState title="No documents attached" message="Attach a registered document after its malware scan is clean." /> : null}
    {!loading && !error && documents && documents.length > 0 ? <ul className="grid gap-3">{documents.map((document) => <li key={document.linkId} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-surface p-4"><div><p className="text-sm text-ink">{document.documentId}</p><p className="mt-1 text-xs text-ink-dim">{KYC_DOCUMENT_ROLE_LABELS[document.documentRole]}</p></div>{canManage ? <button type="button" disabled={saving} onClick={() => void detach(document)} className="rounded-full border border-red-400/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-300 disabled:opacity-50">Detach</button> : null}</li>)}</ul> : null}
  </WorkspacePage>;
}
