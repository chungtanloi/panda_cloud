"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { GapNotice } from "@/components/workspace/GapNotice";
import { StatusPill } from "@/components/workspace/StatusPill";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Input, Select } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import { KYC_RISK_TONES, KYC_STATUS_TONES } from "@/config/lifecycle";
import {
  KYC_RISK_LABELS,
  KYC_DOCUMENT_ROLES,
  KYC_DOCUMENT_ROLE_LABELS,
  KYC_RISK_LEVELS,
  KYC_STATUSES,
  KYC_STATUS_LABELS,
  isBlockingRisk,
  kycUpdateProblems,
  subjectLabel,
  type KycCase,
  type KycCaseUpdate,
  type KycRiskLevel,
  type KycStatus,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";
import { notifyDealReadinessChanged } from "@/controllers/ReadinessContext";

function dateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** `yyyy-mm-dd` for a date input, from an ISO timestamp. */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

/**
 * `/compliance/cases/[id]` — ROLE_PERMISSION_MATRIX § 7.2, the manual review
 * surface.
 *
 * The two conditional requirements from `convex/kyc.ts#updateCase` are enforced
 * in the form as well as by the backend, and the fields they require appear
 * only when the chosen status needs them:
 *
 *   - `rejected` requires a reason;
 *   - `approved` requires a verification date.
 *
 * This is the backend-supported manual status update, not automated provider
 * verification. `expectedRevision` prevents a stale client from overwriting a
 * newer case.
 */
export function CaseDetail({ caseId, backHref = "/compliance/cases", documentsHref }: { caseId: string; backHref?: string; documentsHref?: string }) {
  const { profile } = useAuth();
  const canManage = hasPermission(profile, "kyc:manage");

  const [detail, setDetail] = useState<KycCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  const [status, setStatus] = useState<KycStatus>("not_started");
  const [risk, setRisk] = useState<KycRiskLevel | "">("");
  const [reason, setReason] = useState("");
  const [verifiedOn, setVerifiedOn] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await api.compliance.getCase(caseId);
      setDetail(next);
      setStatus(next.status);
      setRisk(next.riskLevel ?? "");
      setReason(next.rejectionReason ?? "");
      setVerifiedOn(toDateInput(next.verifiedAt));
      setExpiresOn(toDateInput(next.expiresAt));
    } catch (cause) {
      setDetail(null);
      setError(normalizeError(cause));
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!detail) return;
    setWriteError(null);

    const body: KycCaseUpdate = {
      expectedRevision: detail.revision,
      status,
      ...(risk ? { riskLevel: risk } : {}),
      ...(detail.assignedToId ? { assignedTo: detail.assignedToId } : {}),
      ...(reason.trim() ? { rejectionReason: reason.trim() } : {}),
      ...(detail.submittedAt ? { submittedAt: detail.submittedAt } : status === "submitted" ? { submittedAt: new Date().toISOString() } : {}),
      ...(verifiedOn ? { verifiedAt: new Date(`${verifiedOn}T00:00:00Z`).toISOString() } : {}),
      ...(expiresOn ? { expiresAt: new Date(`${expiresOn}T00:00:00Z`).toISOString() } : {}),
    };

    const problems = kycUpdateProblems(body);
    if (problems.length > 0) {
      setWriteError(problems[0]!);
      return;
    }

    setSaving(true);
    try {
      await api.compliance.updateCase(detail.caseId, body);
      notifyDealReadinessChanged(detail.dealId);
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

  if (loading) return <LoadingState label="Loading case" />;
  if (error) return <ErrorState error={error} onRetry={() => void load()} />;
  if (!detail) return null;

  return (
    <WorkspacePage
      eyebrow="Compliance / Case"
      title={subjectLabel(detail.subject)}
      description={detail.dealTitle ?? "Case opened from its deal readiness context."}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
        >
          ← All cases
        </Link>
        <Link
          href={documentsHref ?? `/compliance/cases/${detail.caseId}/documents`}
          className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-dim hover:border-accent/40 hover:text-ink"
        >
          Documents
        </Link>
      </div>

      {detail.riskLevel && isBlockingRisk(detail.riskLevel) ? (
        <div
          role="alert"
          className="mb-6 rounded-[20px] border border-red-400/40 bg-red-400/10 p-5"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300">
            Prohibited
          </p>
          <p className="mt-2 text-sm leading-6 text-ink">
            This subject is rated prohibited. That is a stop, not a high score — the
            relationship should not proceed on compliance grounds without an explicit
            decision recorded outside this tool.
          </p>
        </div>
      ) : null}

      <section className="mb-6 rounded-[24px] border border-line bg-surface p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Evidence-first workflow</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{["Subject", "Request", "Evidence", "Review", "Decision"].map((label, index) => <div key={label} className="rounded-xl border border-line bg-white/[0.02] p-3"><span className="text-[10px] text-ink-mute">0{index + 1}</span><p className="mt-1 text-xs font-semibold text-ink">{label}</p></div>)}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-[24px] border border-line bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Manual status update</h2>
            <StatusPill
              label={KYC_STATUS_LABELS[detail.status]}
              tone={KYC_STATUS_TONES[detail.status]}
            />
          </div>

          <form onSubmit={save} className="mt-5 grid gap-4">
            <Select
              label="Status *"
              value={status}
              disabled={!canManage || saving}
              onChange={(event) => setStatus(event.target.value as KycStatus)}
              options={KYC_STATUSES.map((value) => ({
                value,
                label: KYC_STATUS_LABELS[value],
              }))}
            />

            <Select
              label="Risk level"
              value={risk}
              disabled={!canManage || saving}
              onChange={(event) => setRisk(event.target.value as KycRiskLevel | "")}
              options={[
                { value: "", label: "Not rated" },
                ...KYC_RISK_LEVELS.map((value) => ({ value, label: KYC_RISK_LABELS[value] })),
              ]}
            />

            {status === "rejected" ? (
              <label className="flex w-full flex-col gap-[8px]">
                <span className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim">
                  Rejection reason *
                </span>
                <textarea
                  rows={3}
                  value={reason}
                  disabled={!canManage || saving}
                  onChange={(event) => setReason(event.target.value)}
                  className="w-full rounded-field border border-line-strong bg-deep px-[17px] py-[15px] font-sans text-[14px] text-ink transition-colors focus:border-accent focus:outline-none disabled:opacity-60"
                />
                <span className="text-[11px] leading-4 text-ink-faint">
                  Required — the backend rejects a rejection without one.
                </span>
              </label>
            ) : null}

            {status === "approved" ? (
              <Input
                label="Verified on *"
                type="date"
                value={verifiedOn}
                disabled={!canManage || saving}
                onChange={(event) => setVerifiedOn(event.target.value)}
                hint="Required whenever the case is approved."
              />
            ) : null}

            <Input
              label="Expires on"
              type="date"
              value={expiresOn}
              disabled={!canManage || saving}
              onChange={(event) => setExpiresOn(event.target.value)}
            />

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
                  {saving ? "Saving…" : "Save review"}
                </button>
                <p className="mt-2 text-[11px] leading-4 text-ink-faint">
                  Revision {detail.revision}. Every field above is written on save — this
                  is a full status write, not a partial patch.
                </p>
              </div>
            ) : (
              <p className="text-xs leading-5 text-ink-dim">
                You have read access to this case. Reviewing requires the compliance,
                manager or admin role.
              </p>
            )}
          </form>
        </section>

        <div className="grid gap-6">
          <section className="rounded-[24px] border border-line bg-surface p-6">
            <h2 className="text-sm font-semibold text-ink">Case</h2>
            <dl className="mt-4 grid gap-3 text-xs">
              <Row
                label="Subject"
                value={`${subjectLabel(detail.subject)} (${detail.subject.kind})`}
              />
              <Row label="Provider" value={detail.provider ?? "Manual"} />
              <Row label="Provider case" value={detail.providerCaseId ?? "—"} />
              <Row label="Assigned to" value={detail.assignedToName ?? "Unassigned"} />
              <Row label="Submitted" value={dateTime(detail.submittedAt)} />
              <Row label="Verified" value={dateTime(detail.verifiedAt)} />
              <Row label="Expires" value={dateTime(detail.expiresAt)} />
              <Row label="Updated" value={dateTime(detail.updatedAt)} />
            </dl>
          </section>

          <section className="rounded-[24px] border border-line bg-surface p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-ink">Evidence inventory</h2><Link href={documentsHref ?? `/compliance/cases/${detail.caseId}/documents`} className="text-[10px] font-bold uppercase tracking-wider text-accent">Manage</Link></div>
            <p className="mt-2 text-[11px] leading-4 text-ink-faint">Categories show what is attached; the backend does not define which categories are mandatory.</p>
            <ul className="mt-4 grid gap-2">{KYC_DOCUMENT_ROLES.map((role) => { const count = detail.documents?.filter((document) => document.documentRole === role).length ?? 0; return <li key={role} className="flex items-center justify-between rounded-xl border border-line-soft px-3 py-2 text-xs"><span className="text-ink-dim">{KYC_DOCUMENT_ROLE_LABELS[role]}</span><StatusPill label={count ? `${count} attached` : "None"} tone={count ? "good" : "neutral"} /></li>; })}</ul>
          </section>

          <GapNotice
            tone="gap"
            title="Provider payload is not shown"
            source="convex/schema.ts kycCases.providerPayload"
          >
            <p>
              The row carries a free-form <code>providerPayload</code>, but nothing
              documents its shape — rendering arbitrary provider output could expose
              personal data the UI has no policy for. It is deliberately omitted until
              the BE owner specifies what is safe to display.
            </p>
          </GapNotice>
        </div>
      </div>
    </WorkspacePage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-ink">{value}</dd>
    </div>
  );
}
