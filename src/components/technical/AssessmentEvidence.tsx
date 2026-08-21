"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SecureDocumentUpload } from "@/components/documents/SecureDocumentUpload";
import { Input, Select } from "@/components/ui/Field";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { hasPermission } from "@/config/access";
import { useAuth } from "@/controllers/AuthContext";
import { formatBytes, type DdEvidenceDocument, type DdTemplateItem } from "@/models";
import type { DocumentSummary } from "@/models/documents";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * Evidence is deliberately scoped to one DD template item. The gateway owns
 * the assessment/deal/resource authorization; this page only sends opaque ids
 * returned by assessment and document operations.
 */
export function AssessmentEvidence({ assessmentId }: { assessmentId: string }) {
  const { profile } = useAuth();
  const canWrite = hasPermission(profile, "dd:respond");
  const [items, setItems] = useState<readonly DdTemplateItem[] | null>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [documents, setDocuments] = useState<readonly DdEvidenceDocument[]>([]);
  const [candidateId, setCandidateId] = useState("");
  const [candidate, setCandidate] = useState<DocumentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [pendingDetach, setPendingDetach] = useState<string | null>(null);

  const selectedItem = useMemo(
    () => items?.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const detail = await api.dueDiligence.getAssessment(assessmentId);
      setItems(detail.items);
      setSelectedItemId((current) => current || detail.items[0]?.id || "");
    } catch (cause) {
      setItems(null);
      setError(normalizeError(cause));
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  const loadEvidence = useCallback(async () => {
    if (!selectedItemId) {
      setDocuments([]);
      return;
    }
    setDocumentsLoading(true);
    setWriteError(null);
    try {
      const response = await api.dueDiligence.listEvidence(assessmentId, selectedItemId);
      setDocuments(response.documents);
    } catch (cause) {
      setWriteError(normalizeError(cause).message);
    } finally {
      setDocumentsLoading(false);
    }
  }, [assessmentId, selectedItemId]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    void loadEvidence();
  }, [loadEvidence]);

  async function inspectCandidate(documentId: string) {
    const trimmed = documentId.trim();
    setCandidateId(documentId);
    if (!trimmed) {
      setCandidate(null);
      return;
    }
    setWriteError(null);
    try {
      setCandidate(await api.documents.getDocument(trimmed));
    } catch (cause) {
      setCandidate(null);
      setWriteError(normalizeError(cause).message);
    }
  }

  async function attachCandidate() {
    if (!candidate || !selectedItemId) return;
    setWriteError(null);
    try {
      await api.dueDiligence.attachEvidence(assessmentId, selectedItemId, {
        documentId: candidate.documentId,
      });
      setCandidate(null);
      setCandidateId("");
      await loadEvidence();
    } catch (cause) {
      setWriteError(normalizeError(cause).message);
    }
  }

  async function detach(documentId: string) {
    if (!selectedItemId) return;
    setWriteError(null);
    try {
      await api.dueDiligence.detachEvidence(assessmentId, selectedItemId, documentId);
      await loadEvidence();
    } catch (cause) {
      setWriteError(normalizeError(cause).message);
    }
  }

  async function download(documentId: string) {
    setWriteError(null);
    try {
      const session = await api.documents.createDownloadSession(documentId);
      window.location.assign(session.downloadUrl);
    } catch (cause) {
      setWriteError(normalizeError(cause).message);
    }
  }

  if (loading) return <LoadingState label="Loading evidence" />;
  if (error) return <ErrorState error={error} onRetry={() => void loadItems()} />;
  if (!items) return null;

  return (
    <WorkspacePage
      eyebrow="Technical / Evidence"
      title="Assessment evidence"
      description="Upload, finalize, attach and retrieve evidence for one technical requirement."
    >
      <div className="mb-6 flex justify-end">
        <Link
          href={`/technical/assessments/${assessmentId}`}
          className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
        >
          ← Back to the assessment
        </Link>
      </div>

      <div className="mb-6 max-w-2xl">
        <Select
          label="Requirement"
          value={selectedItemId}
          onChange={(event) => setSelectedItemId(event.target.value)}
          options={items.map((item) => ({
            value: item.id,
            label: `${item.requirementCode} · ${item.question}`,
          }))}
        />
        {selectedItem?.requiredEvidence ? (
          <p className="mt-2 text-xs text-ink-dim">Evidence required: {selectedItem.requiredEvidence}</p>
        ) : null}
      </div>

      {canWrite && selectedItemId ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <SecureDocumentUpload
            contextType="dd_assessment"
            resourceId={assessmentId}
            retentionClass="audit"
            onFinalized={(result) => void inspectCandidate(result.documentId)}
          />
          <section className="rounded-[24px] border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold text-ink">Attach finalized evidence</h2>
            <p className="mt-1 text-xs leading-5 text-ink-dim">
              A document is attachable only after the backend marks its malware scan clean.
            </p>
            <div className="mt-4">
              <Input
                label="Document ID"
                value={candidateId}
                onChange={(event) => setCandidateId(event.target.value)}
                onBlur={() => void inspectCandidate(candidateId)}
                placeholder="document_xxx"
                hint="Paste an opaque id from a previously finalized document, then leave the field."
              />
            </div>
            {candidate ? (
              <div className="mt-4 rounded-xl border border-line p-4 text-xs text-ink-dim">
                <p className="font-medium text-ink">{candidate.originalFilename}</p>
                <p className="mt-1">Malware scan: {candidate.malwareScanStatus}</p>
                <button
                  type="button"
                  disabled={candidate.malwareScanStatus !== "clean" || candidate.archivedAt !== null}
                  onClick={() => void attachCandidate()}
                  className="mt-3 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-40"
                >
                  Attach evidence
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {writeError ? <p role="alert" className="mt-4 text-xs text-red-300">{writeError}</p> : null}

      <section className="mt-8 rounded-[24px] border border-line bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Attached documents</h2>
        {documentsLoading ? <p className="mt-3 text-xs text-ink-dim">Refreshing evidence…</p> : null}
        {!documentsLoading && documents.length === 0 ? (
          <p className="mt-3 text-xs text-ink-dim">No evidence is attached to this requirement.</p>
        ) : null}
        <ul className="mt-4 grid gap-3">
          {documents.map((document) => (
            <li key={document.documentId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
              <div className="min-w-0 text-xs text-ink-dim">
                <p className="truncate font-medium text-ink">{document.originalFilename}</p>
                <p className="mt-1">{formatBytes(document.sizeBytes)} · {document.documentRole} · malware {document.malwareScanStatus}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void download(document.documentId)} className="rounded-full border border-line px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-dim">
                  Download
                </button>
                {canWrite ? (
                    <button type="button" onClick={() => setPendingDetach(document.documentId)} className="rounded-full border border-red-400/50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-red-300">
                    Detach
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
      {pendingDetach ? <ConfirmDialog title="Detach this document?" message="The document will be removed from this DD requirement. The original file remains in secure storage." confirmLabel="Detach document" onCancel={() => setPendingDetach(null)} onConfirm={() => { const documentId = pendingDetach; setPendingDetach(null); void detach(documentId); }} /> : null}
    </WorkspacePage>
  );
}
