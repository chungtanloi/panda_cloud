"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Input } from "@/components/ui/Field";
import { CreateAgreementForm } from "@/components/legal/CreateAgreementForm";
import { CreateCaseForm } from "@/components/compliance/CasesPage";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import { NCNDA_STATUS_TONES, KYC_STATUS_TONES } from "@/config/lifecycle";
import {
  KYC_STATUS_LABELS,
  NCNDA_STATUS_LABELS,
  type KycCase,
  type NcndaAgreement,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

type LaneState = "ready" | "attention" | "blocked" | "missing";
type TimelineEntry = { id: string; at: string; lane: "NCNDA" | "KYC"; label: string };

function ncndaState(item: NcndaAgreement | null): LaneState {
  if (!item) return "missing";
  if (item.status === "active") return "ready";
  if (["rejected", "expired", "cancelled"].includes(item.status)) return "blocked";
  return "attention";
}

function kycState(item: KycCase | null): LaneState {
  if (!item) return "missing";
  if (["rejected", "expired", "cancelled", "provider_error"].includes(item.status)) return "blocked";
  if (item.riskLevel === "prohibited") return "blocked";
  if (item.status === "approved" && item.verifiedAt && (!item.expiresAt || new Date(item.expiresAt).getTime() > Date.now())) return "ready";
  return "attention";
}

const laneLabels: Record<LaneState, string> = {
  ready: "Ready",
  attention: "Needs attention",
  blocked: "Blocked",
  missing: "Not started",
};

const laneTone: Record<LaneState, "good" | "waiting" | "bad" | "neutral"> = {
  ready: "good",
  attention: "waiting",
  blocked: "bad",
  missing: "neutral",
};

function newest<T extends { updatedAt: string }>(items: readonly T[]): T | null {
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

function nextNcnda(item: NcndaAgreement | null): string {
  if (!item) return "Create a drafting matter and identify the counterparty.";
  const actions: Record<NcndaAgreement["status"], string> = {
    not_requested: "Start drafting the agreement.",
    drafting: "Attach the current draft and complete internal review.",
    sent: "Record the counterparty response or redline.",
    received: "Review the returned agreement.",
    under_review: "Resolve redlines and prepare signature.",
    signed: "Record the countersigned document.",
    countersigned: "Set an effective date and activate the agreement.",
    active: "Monitor expiry and retain the current executed version.",
    rejected: "Review the rejection; create a new matter only if authorized.",
    expired: "Review renewal requirements.",
    cancelled: "No action unless a new matter is approved.",
  };
  return actions[item.status];
}

function nextKyc(item: KycCase | null): string {
  if (!item) return "Create a case for exactly one organization or contact.";
  const actions: Record<KycCase["status"], string> = {
    not_started: "Request KYC from the subject.",
    requested: "Confirm which evidence has been requested.",
    pending_documents: "Collect and attach registered evidence.",
    submitted: "Start the compliance review.",
    under_review: "Set risk and approve, reject, or request more evidence.",
    approved: "Monitor verification expiry.",
    rejected: "Review the rejection reason before any new case.",
    expired: "Re-verification is required; no case is created automatically.",
    cancelled: "No action unless a new review is authorized.",
    provider_error: "Resolve the provider issue or continue manual review.",
  };
  return actions[item.status];
}

export function DealReadinessView({ dealId }: { dealId: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const canManageNcnda = hasPermission(profile, "ncnda:manage");
  const canManageKyc = hasPermission(profile, "kyc:manage");
  const [agreements, setAgreements] = useState<readonly NcndaAgreement[] | null>(null);
  const [cases, setCases] = useState<readonly KycCase[] | null>(null);
  const [legalError, setLegalError] = useState<NormalizedError | null>(null);
  const [kycError, setKycError] = useState<NormalizedError | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dealInput, setDealInput] = useState(dealId);
  const [createLane, setCreateLane] = useState<"ncnda" | "kyc" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [legalResult, kycResult] = await Promise.allSettled([
      api.legal.listAgreements(dealId),
      api.compliance.listCases(dealId),
    ]);
    if (legalResult.status === "fulfilled") {
      setAgreements(legalResult.value.items);
      setLegalError(null);
    } else {
      setAgreements(null);
      setLegalError(normalizeError(legalResult.reason));
    }
    if (kycResult.status === "fulfilled") {
      setCases(kycResult.value.items);
      setKycError(null);
    } else {
      setCases(null);
      setKycError(normalizeError(kycResult.reason));
    }
    setLoading(false);
  }, [dealId]);

  useEffect(() => { void load(); }, [load]);

  const agreement = useMemo(() => newest(agreements ?? []), [agreements]);
  const kycCase = useMemo(() => newest(cases ?? []), [cases]);
  const ncndaReadiness = ncndaState(agreement);
  const kycReadiness = kycState(kycCase);
  const overall: LaneState = ncndaReadiness === "blocked" || kycReadiness === "blocked"
    ? "blocked"
    : ncndaReadiness === "ready" && kycReadiness === "ready"
      ? "ready"
      : "attention";

  const timeline = useMemo<TimelineEntry[]>(() => {
    const entries: TimelineEntry[] = [];
    for (const item of agreements ?? []) {
      entries.push({ id: `n-${item.agreementId}`, at: item.updatedAt, lane: "NCNDA", label: `Agreement ${NCNDA_STATUS_LABELS[item.status].toLowerCase()}` });
      if (item.sentAt) entries.push({ id: `n-sent-${item.agreementId}`, at: item.sentAt, lane: "NCNDA", label: "Agreement sent" });
      if (item.signedAt) entries.push({ id: `n-signed-${item.agreementId}`, at: item.signedAt, lane: "NCNDA", label: "Signature recorded" });
      if (item.countersignedAt) entries.push({ id: `n-counter-${item.agreementId}`, at: item.countersignedAt, lane: "NCNDA", label: "Countersignature recorded" });
    }
    for (const item of cases ?? []) {
      entries.push({ id: `k-${item.caseId}`, at: item.updatedAt, lane: "KYC", label: `Case ${KYC_STATUS_LABELS[item.status].toLowerCase()}` });
      if (item.submittedAt) entries.push({ id: `k-submitted-${item.caseId}`, at: item.submittedAt, lane: "KYC", label: "Evidence submitted" });
      if (item.verifiedAt) entries.push({ id: `k-verified-${item.caseId}`, at: item.verifiedAt, lane: "KYC", label: "Verification recorded" });
    }
    return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [agreements, cases]);

  return (
    <WorkspacePage
      eyebrow="Dealflow / Readiness"
      title={`Deal readiness · ${dealId}`}
      description="NCNDA and KYC progress run in parallel. This summary guides staff workflow; it does not authorize a Won transition."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface-alt p-4">
        <div className="flex items-center gap-3">
          <StatusPill label={laneLabels[overall]} tone={laneTone[overall]} />
          <p className="text-xs text-ink-dim">Overall readiness is presentation-only.</p>
        </div>
        <button type="button" onClick={() => setPickerOpen(true)} className="rounded-full border border-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent">Open another deal</button>
      </div>

      {loading ? <LoadingState label="Loading legal and compliance readiness" /> : null}

      {!loading ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ReadinessLane
            title="NCNDA"
            owner="Legal"
            state={ncndaReadiness}
            status={agreement ? NCNDA_STATUS_LABELS[agreement.status] : "No agreement"}
            nextAction={nextNcnda(agreement)}
            error={legalError}
            href={agreement ? `/deal-readiness/${encodeURIComponent(dealId)}/ncnda/${agreement.agreementId}` : undefined}
            actionLabel="Open NCNDA file"
            onCreate={canManageNcnda && !agreement ? () => setCreateLane("ncnda") : undefined}
          />
          <ReadinessLane
            title="KYC"
            owner="Compliance"
            state={kycReadiness}
            status={kycCase ? KYC_STATUS_LABELS[kycCase.status] : "No case"}
            nextAction={nextKyc(kycCase)}
            error={kycError}
            href={kycCase ? `/deal-readiness/${encodeURIComponent(dealId)}/kyc/${kycCase.caseId}` : undefined}
            actionLabel="Open KYC case"
            onCreate={canManageKyc && !kycCase ? () => setCreateLane("kyc") : undefined}
          />
        </div>
      ) : null}

      {createLane === "ncnda" ? <div className="mt-6"><CreateAgreementForm dealId={dealId} onDone={() => { setCreateLane(null); void load(); }} /></div> : null}
      {createLane === "kyc" ? <div className="mt-6"><CreateCaseForm dealId={dealId} onDone={() => { setCreateLane(null); void load(); }} /></div> : null}

      {!loading && !legalError && !kycError ? (
        <section className="mt-6 rounded-[24px] border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Readiness timeline</h2>
          {timeline.length ? <ol className="mt-5 space-y-4">{timeline.map((entry) => <li key={entry.id} className="flex gap-4"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-accent" /><div><p className="text-sm text-ink">{entry.label}</p><p className="mt-1 text-xs text-ink-dim">{entry.lane} · {new Date(entry.at).toLocaleString()}</p></div></li>)}</ol> : <EmptyState title="No readiness activity" message="Create an NCNDA matter or KYC case to begin." />}
        </section>
      ) : null}

      {pickerOpen ? (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label="Open deal">
          <button className="flex-1" aria-label="Close deal picker" onClick={() => setPickerOpen(false)} />
          <form className="h-full w-full max-w-md border-l border-line bg-surface p-6 pt-20" onSubmit={(event) => { event.preventDefault(); const next = dealInput.trim(); if (next) router.push(`/deal-readiness/${encodeURIComponent(next)}`); }}>
            <h2 className="text-xl font-semibold text-ink">Open deal</h2>
            <p className="mt-2 text-sm leading-6 text-ink-dim">Deal lookup is not available in the backend yet. Use the opaque deal id as a temporary fallback.</p>
            <div className="mt-6"><Input label="Deal id *" value={dealInput} onChange={(event) => setDealInput(event.target.value)} /></div>
            <button type="submit" className="mt-5 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg">Open readiness</button>
          </form>
        </div>
      ) : null}
    </WorkspacePage>
  );
}

function ReadinessLane({ title, owner, state, status, nextAction, error, href, actionLabel, onCreate }: { title: string; owner: string; state: LaneState; status: string; nextAction: string; error: NormalizedError | null; href?: string; actionLabel: string; onCreate?: () => void }) {
  return <section className="rounded-[24px] border border-line bg-surface p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{owner}</p><h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2></div><StatusPill label={laneLabels[state]} tone={laneTone[state]} /></div>{error ? <div className="mt-5"><ErrorState error={error} /></div> : <><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${state === "ready" ? "w-full bg-emerald-400" : state === "blocked" ? "w-full bg-red-400" : state === "missing" ? "w-0" : "w-2/3 bg-amber-300"}`} /></div><dl className="mt-5 grid gap-4"><div><dt className="text-[10px] uppercase tracking-wider text-ink-mute">Current status</dt><dd className="mt-1 text-sm text-ink">{status}</dd></div><div><dt className="text-[10px] uppercase tracking-wider text-ink-mute">Next action</dt><dd className="mt-1 text-sm leading-6 text-ink-dim">{nextAction}</dd></div></dl><div className="mt-6 flex flex-wrap gap-3">{href ? <Link href={href} className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg">{actionLabel}</Link> : null}{onCreate ? <button type="button" onClick={onCreate} className="rounded-full border border-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent">Start {title}</button> : null}</div></>}</section>;
}
