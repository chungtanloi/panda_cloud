"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Select } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import { KYC_DOCUMENT_ROLE_LABELS, KYC_DOCUMENT_ROLES, type KycDocument, type KycDocumentRole } from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";
import { SecureDocumentUpload } from "@/components/documents/SecureDocumentUpload";
import { DocumentDownloadButton } from "@/components/documents/DocumentDownloadButton";
import { notifyDealReadinessChanged } from "@/controllers/ReadinessContext";

export function CaseDocuments({ caseId, dealId, backHref }: { caseId: string; dealId?: string; backHref?: string }) {
  const { profile } = useAuth();
  const canManage = hasPermission(profile, "kyc:manage");
  const [documents, setDocuments] = useState<readonly KycDocument[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
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

  async function detach(document: KycDocument) {
    setMessage(null); setSaving(true);
    try { await api.compliance.detachDocument(caseId, document.documentId); if (dealId) notifyDealReadinessChanged(dealId); setMessage("Document detached."); await load(); }
    catch (cause) { const normalized = normalizeError(cause); setMessage(normalized.message); }
    finally { setSaving(false); }
  }

  return <WorkspacePage eyebrow="Compliance / Documents" title="KYC case documents" description="Attach registered, malware-clean documents to this case. Binary upload and document registration are separate backend operations.">
    <div className="mb-6"><a href={backHref ?? "/compliance/cases/" + caseId} className="text-xs font-bold uppercase tracking-wider text-accent hover:underline">← Back to case</a></div>
    {canManage ? <div className="mb-6 grid gap-4"><div className="max-w-xs"><Select label="Evidence category" value={role} onChange={(event) => setRole(event.target.value as KycDocumentRole)} options={KYC_DOCUMENT_ROLES.map((value) => ({ value, label: KYC_DOCUMENT_ROLE_LABELS[value] }))} /></div><SecureDocumentUpload contextType="kyc" resourceId={caseId} retentionClass="kyc" onFinalized={(finalized) => { if (finalized.malwareScanStatus === "clean") { void api.compliance.attachDocument(caseId, { documentId: finalized.documentId, documentRole: role }).then(() => { if (dealId) notifyDealReadinessChanged(dealId); return load(); }).catch((cause) => setMessage(normalizeError(cause).message)); } else { setMessage(`Upload complete. Attachment is waiting for malware scan (${finalized.malwareScanStatus}).`); } }} />{message ? <p role="alert" className="text-xs text-ink-dim">{message}</p> : null}</div> : null}
    {loading ? <LoadingState label="Loading documents" /> : null}
    {!loading && error ? <ErrorState error={error} onRetry={() => void load()} /> : null}
    {!loading && !error && documents?.length === 0 ? <EmptyState title="No documents attached" message="Attach a registered document after its malware scan is clean." /> : null}
    {!loading && !error && documents && documents.length > 0 ? <ul className="grid gap-3">{documents.map((document) => <li key={document.linkId} className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-line bg-surface p-4"><div><p className="text-sm text-ink">Attached document</p><p className="mt-1 text-xs text-ink-dim">{KYC_DOCUMENT_ROLE_LABELS[document.documentRole]}</p></div><div className="flex items-center gap-2"><DocumentDownloadButton documentId={document.documentId} />{canManage ? <button type="button" disabled={saving} onClick={() => void detach(document)} className="rounded-full border border-red-400/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-300 disabled:opacity-50">Detach</button> : null}</div></li>)}</ul> : null}
  </WorkspacePage>;
}
