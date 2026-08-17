"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Input, Select } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import { NCNDA_STATUS_TONES } from "@/config/lifecycle";
import {
  NCNDA_DOCUMENT_ROLE_LABELS,
  NCNDA_STATUSES,
  NCNDA_STATUS_LABELS,
  requiresEffectiveDate,
  type NcndaAgreementDetail as Detail,
  type NcndaStatus,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

function dateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * `/legal/agreements/[id]` — ROLE_PERMISSION_MATRIX § 6.2 and § 6.3.
 *
 * The lifecycle form mirrors `convex/ncnda.ts#upsertAgreement`, including both
 * of its failure modes, so the reviewer learns about a problem here rather than
 * from a 400:
 *
 *   - `active` requires an effective date;
 *   - only one `active` agreement may exist per deal + counterparty, so a
 *     second one is a 409 and the message says why.
 *
 * Version history is read-only by design, not by omission — UC-015 makes every
 * version immutable with at most one current. There is no upload control
 * because no upload operation exists.
 */
export function AgreementDetail({ agreementId }: { agreementId: string }) {
  const { profile } = useAuth();
  const canManage = hasPermission(profile, "ncnda:manage");

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  const [status, setStatus] = useState<NcndaStatus>("drafting");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [documentRole, setDocumentRole] = useState<"draft" | "redline" | "signed" | "countersigned">("draft");
  const [documentSaving, setDocumentSaving] = useState(false);
  const [documentMessage, setDocumentMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.legal.getAgreement(agreementId);
      setDetail(next);
      setStatus(next.status);
      setEffectiveDate(next.effectiveDate ?? "");
      setNotes(next.notes ?? "");
    } catch (cause) {
      setDetail(null);
      setError(normalizeError(cause));
    } finally {
      setLoading(false);
    }
  }, [agreementId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!detail) return;
    setWriteError(null);
    setFieldError(null);

    if (requiresEffectiveDate(status) && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate.trim())) {
      setFieldError("An active agreement needs an effective date in YYYY-MM-DD.");
      return;
    }

    setSaving(true);
    try {
      await api.legal.upsertAgreement({
        dealId: detail.dealId,
        counterpartyOrganizationId: detail.counterpartyOrganizationId,
        status,
        ...(effectiveDate.trim() ? { effectiveDate: effectiveDate.trim() } : {}),
        ...(detail.expiresAt ? { expiresAt: detail.expiresAt } : {}),
        ...(detail.sentAt ? { sentAt: detail.sentAt } : {}),
        ...(detail.signedAt ? { signedAt: detail.signedAt } : {}),
        ...(detail.countersignedAt ? { countersignedAt: detail.countersignedAt } : {}),
        ownerId: detail.ownerId,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        // Both mandatory on an update: the id says which agreement, the
        // revision says which version of it. The backend rejects an update
        // that omits either.
        agreementId: detail.agreementId,
        expectedRevision: detail.revision,
      });
      await load();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setWriteError(
        normalized.correlationId
          ? `${normalized.message} (correlation ${normalized.correlationId})`
          : normalized.message,
      );
      if (normalized.status === 409) await load();
    } finally {
      setSaving(false);
    }
  }

  async function attachDocument(event: React.FormEvent) {
    event.preventDefault(); setDocumentMessage(null);
    if (!documentId.trim()) { setDocumentMessage("Enter a registered document id."); return; }
    setDocumentSaving(true);
    try { await api.legal.attachDocument(detail!.agreementId, { documentId: documentId.trim(), documentRole }); setDocumentId(""); setDocumentMessage("Document attached."); await load(); }
    catch (cause) { const normalized = normalizeError(cause); setDocumentMessage(normalized.correlationId ? normalized.message + " (correlation " + normalized.correlationId + ")" : normalized.message); }
    finally { setDocumentSaving(false); }
  }

  async function detachDocument(version: Detail["versions"][number]) {
    setDocumentMessage(null); setDocumentSaving(true);
    try { await api.legal.detachDocument(detail!.agreementId, version.documentId); setDocumentMessage("Document detached."); await load(); }
    catch (cause) { setDocumentMessage(normalizeError(cause).message); }
    finally { setDocumentSaving(false); }
  }

  if (loading) return <LoadingState label="Loading agreement" />;
  if (error) return <ErrorState error={error} onRetry={() => void load()} />;
  if (!detail) return null;

  return (
    <WorkspacePage
      eyebrow="Legal / Agreement"
      title={detail.counterpartyName ?? "Unnamed counterparty"}
      description={detail.dealTitle ?? detail.dealId}
    >
      <div className="mb-6">
        <Link
          href="/legal/agreements"
          className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
        >
          ← All agreements
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[24px] border border-line bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Lifecycle</h2>
            <StatusPill
              label={NCNDA_STATUS_LABELS[detail.status]}
              tone={NCNDA_STATUS_TONES[detail.status]}
            />
          </div>

          <form onSubmit={save} className="mt-5 grid gap-4">
            <Select
              label="Status"
              value={status}
              disabled={!canManage || saving}
              onChange={(event) => setStatus(event.target.value as NcndaStatus)}
              options={NCNDA_STATUSES.map((value) => ({
                value,
                label: NCNDA_STATUS_LABELS[value],
              }))}
            />

            <Input
              label={requiresEffectiveDate(status) ? "Effective date *" : "Effective date"}
              placeholder="2026-07-01"
              value={effectiveDate}
              disabled={!canManage || saving}
              onChange={(event) => setEffectiveDate(event.target.value)}
              error={fieldError ?? undefined}
              hint={
                requiresEffectiveDate(status)
                  ? "Required while the agreement is active."
                  : undefined
              }
            />

            <label className="flex w-full flex-col gap-[8px]">
              <span className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim">
                Notes
              </span>
              <textarea
                rows={4}
                value={notes}
                disabled={!canManage || saving}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-field border border-line-strong bg-deep px-[17px] py-[15px] font-sans text-[14px] text-ink transition-colors focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </label>

            {writeError ? (
              <p role="alert" className="text-xs leading-5 text-red-400">
                {writeError}
              </p>
            ) : null}

            {canManage ? (
              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save lifecycle"}
                </button>
                <p className="mt-2 text-[11px] leading-4 text-ink-faint">
                  Revision {detail.revision}. A concurrent edit is rejected rather than
                  overwritten.
                </p>
              </div>
            ) : (
              <p className="text-xs leading-5 text-ink-dim">
                You have read access to this agreement. Editing requires the legal,
                manager or admin role.
              </p>
            )}
          </form>
        </section>

        <div className="grid gap-6">
          <section className="rounded-[24px] border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold text-ink">Dates</h2>
            <dl className="mt-4 grid gap-3 text-xs">
              <Row label="Sent" value={dateTime(detail.sentAt)} />
              <Row label="Signed" value={dateTime(detail.signedAt)} />
              <Row label="Countersigned" value={dateTime(detail.countersignedAt)} />
              <Row label="Expires" value={dateTime(detail.expiresAt)} />
              <Row label="Owner" value={detail.ownerName ?? "—"} />
            </dl>
          </section>

          <section className="rounded-[24px] border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold text-ink">Document versions</h2>
            <p className="mt-1 text-[11px] leading-4 text-ink-faint">
              Immutable. At most one is current.
            </p>
            {detail.versions.length === 0 ? (
              <p className="mt-4 text-xs leading-5 text-ink-dim">
                No document has been uploaded for this agreement.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {detail.versions.map((version) => (
                  <li
                    key={version.versionId}
                    className="rounded-[14px] border border-line-soft bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-faint">
                        v{version.versionNumber} ·{" "}
                        {NCNDA_DOCUMENT_ROLE_LABELS[version.documentRole]}
                      </span>
                      {version.isCurrent ? <StatusPill label="Current" tone="good" /> : null}{canManage && !version.isCurrent ? <button type="button" disabled={documentSaving} onClick={() => void detachDocument(version)} className="rounded-full border border-red-400/50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-red-300 disabled:opacity-50">Detach</button> : null}
                    </div>
                    <p className="mt-2 truncate text-xs text-ink">
                      {version.originalFilename ?? version.documentId}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-faint">
                      {version.uploadedByName ?? "—"} · {dateTime(version.uploadedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canManage ? (
            <form onSubmit={attachDocument} className="rounded-[24px] border border-line bg-surface p-6">
              <h2 className="text-sm font-semibold text-ink">Attach a document version</h2>
              <p className="mt-1 text-[11px] leading-4 text-ink-faint">Register the document through the approved document flow first. This form only attaches an existing, malware-clean document id.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                <Input label="Document id *" value={documentId} onChange={(event) => setDocumentId(event.target.value)} placeholder="doc_01" />
                <Select label="Document role" value={documentRole} onChange={(event) => setDocumentRole(event.target.value as typeof documentRole)} options={(["draft", "redline", "signed", "countersigned"] as const).map((value) => ({ value, label: NCNDA_DOCUMENT_ROLE_LABELS[value] }))} />
                <button type="submit" disabled={documentSaving} className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50">{documentSaving ? "Attaching…" : "Attach"}</button>
              </div>
              {documentMessage ? <p role="alert" className="mt-3 text-xs text-ink-dim">{documentMessage}</p> : null}
            </form>
          ) : null}
        </div>
      </div>
    </WorkspacePage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
