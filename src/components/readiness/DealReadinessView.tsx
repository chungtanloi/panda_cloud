"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { CreateAgreementForm } from "@/components/legal/CreateAgreementForm";
import { CreateCaseForm } from "@/components/compliance/CreateCaseForm";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import {
  LANE_LABELS,
  LANE_OWNERS,
  LANE_STATE_LABELS,
  LANE_STATE_TONES,
  READINESS_LANES,
  evaluateReadiness,
  laneNextAction,
  lanePercent,
  type LaneId,
  type LaneState,
  type ReadinessResult,
} from "@/lib/readiness";
import {
  DD_ASSESSMENT_STATUS_LABELS,
  KYC_STATUS_LABELS,
  NCNDA_STATUS_LABELS,
  type DdAssessmentSummary,
  type KycCase,
  type NcndaAgreement,
} from "@/models";
import { formatMinorUnits } from "@/models/common";
import type { NormalizedError } from "@/models/common";
import type { SalesCardDetailDto } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

type TimelineEntry = { id: string; at: string; lane: string; label: string };

/**
 * `/deal-readiness/[dealId]` — the canonical place NCNDA, KYC and Due Diligence
 * are read together for one deal.
 *
 * ⚠ WHY THIS IS THE ONLY URL FOR THESE OBJECTS.
 *
 * `/legal/agreements?dealId=` and `/compliance/cases?dealId=` used to render a
 * second, differently-shaped view of the same records. Two layouts over one
 * dataset meant two places to fix a bug and two chances to disagree; both now
 * redirect here.
 *
 * All lane evaluation comes from `lib/readiness.ts`. This component decides
 * nothing about status on its own.
 */
export function DealReadinessView({ dealId }: { dealId: string }) {
  const { profile } = useAuth();
  const canManageNcnda = hasPermission(profile, "ncnda:manage");
  const canManageKyc = hasPermission(profile, "kyc:manage");

  const [agreements, setAgreements] = useState<readonly NcndaAgreement[]>([]);
  const [cases, setCases] = useState<readonly KycCase[]>([]);
  const [assessments, setAssessments] = useState<readonly DdAssessmentSummary[]>([]);
  const [deal, setDeal] = useState<SalesCardDetailDto | null>(null);

  const [laneErrors, setLaneErrors] = useState<Record<LaneId, NormalizedError | null>>({
    ncnda: null,
    kyc: null,
    dd: null,
  });
  const [dealError, setDealError] = useState<NormalizedError | null>(null);
  const [loading, setLoading] = useState(true);
  const [createLane, setCreateLane] = useState<"ncnda" | "kyc" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [legalResult, kycResult, ddResult, dealResult] = await Promise.allSettled([
      api.legal.listAgreements(dealId),
      api.compliance.listCases(dealId),
      api.dueDiligence.listAssessments(dealId),
      api.sales.getCard(dealId),
    ]);

    setAgreements(legalResult.status === "fulfilled" ? legalResult.value.items : []);
    setCases(kycResult.status === "fulfilled" ? kycResult.value.items : []);
    setAssessments(ddResult.status === "fulfilled" ? ddResult.value.items : []);
    setDeal(dealResult.status === "fulfilled" ? dealResult.value : null);

    setLaneErrors({
      ncnda: legalResult.status === "rejected" ? normalizeError(legalResult.reason) : null,
      kyc: kycResult.status === "rejected" ? normalizeError(kycResult.reason) : null,
      dd: ddResult.status === "rejected" ? normalizeError(ddResult.reason) : null,
    });
    setDealError(dealResult.status === "rejected" ? normalizeError(dealResult.reason) : null);
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const readiness = useMemo(
    () => evaluateReadiness({ agreements, cases, assessments }),
    [agreements, cases, assessments],
  );

  const timeline = useMemo<TimelineEntry[]>(() => {
    const rows: TimelineEntry[] = [];
    agreements.forEach((item) =>
      rows.push({
        id: `n-${item.agreementId}`,
        at: item.updatedAt,
        lane: LANE_LABELS.ncnda,
        label: NCNDA_STATUS_LABELS[item.status],
      }),
    );
    cases.forEach((item) =>
      rows.push({
        id: `k-${item.caseId}`,
        at: item.updatedAt,
        lane: LANE_LABELS.kyc,
        label: KYC_STATUS_LABELS[item.status],
      }),
    );
    assessments.forEach((item) =>
      rows.push({
        id: `d-${item.assessmentId}`,
        at: item.updatedAt,
        lane: LANE_LABELS.dd,
        label: DD_ASSESSMENT_STATUS_LABELS[item.status],
      }),
    );
    return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [agreements, cases, assessments]);

  const laneHref: Record<LaneId, string | undefined> = {
    ncnda: readiness.current.ncnda
      ? `/deal-readiness/${encodeURIComponent(dealId)}/ncnda/${readiness.current.ncnda.agreementId}`
      : undefined,
    kyc: readiness.current.kyc
      ? `/deal-readiness/${encodeURIComponent(dealId)}/kyc/${readiness.current.kyc.caseId}`
      : undefined,
    dd: readiness.current.dd ? `/technical/assessments/${readiness.current.dd.assessmentId}` : undefined,
  };

  const laneAction: Record<LaneId, string> = {
    ncnda: "Open legal file",
    kyc: "Open KYC case",
    dd: "Open assessment",
  };

  const laneCreate: Record<LaneId, (() => void) | undefined> = {
    ncnda: canManageNcnda && !readiness.current.ncnda && deal ? () => setCreateLane("ncnda") : undefined,
    kyc: canManageKyc && !readiness.current.kyc && deal ? () => setCreateLane("kyc") : undefined,
    dd: undefined,
  };

  const steps: readonly [string, string, string, boolean][] = [
    ["1", "Deal qualified", deal?.status === "won" ? "Won" : "Commercial", deal?.status === "won"],
    [
      "2",
      "NCNDA + KYC",
      readiness.lanes.ncnda === "ready" && readiness.lanes.kyc === "ready" ? "Reviewed" : "In progress",
      readiness.lanes.ncnda === "ready" && readiness.lanes.kyc === "ready",
    ],
    ["3", "Technical DD", readiness.lanes.dd === "ready" ? "Complete" : "Pending", readiness.lanes.dd === "ready"],
    [
      "4",
      "Project conversion",
      deal?.projectId ? "Created" : "Manager review",
      Boolean(deal?.projectId),
    ],
  ];

  return (
    <WorkspacePage
      eyebrow="Dealflow / Handoff"
      title={deal?.title ?? "Deal readiness"}
      description="A single handoff record for Sales, Legal, Compliance, Technical and Manager."
    >
      <section className="mb-6 overflow-hidden rounded-[28px] border border-accent/25 bg-[linear-gradient(135deg,rgba(0,217,230,0.09),rgba(17,24,39,0.82)_55%)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                label={LANE_STATE_LABELS[readiness.overall]}
                tone={LANE_STATE_TONES[readiness.overall]}
              />
              <span className="text-xs text-ink-dim">{readiness.readyCount}/3 workstreams ready</span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-ink">
              {deal?.organizationName ?? "Loading deal context…"}
            </h1>
            <p className="mt-1 text-sm text-ink-dim">
              {deal?.ownerName
                ? `Sales owner: ${deal.ownerName}`
                : "The responsible owner is resolved from the deal record."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-ink-mute">Commercial value</p>
            <p className="mt-1 text-xl font-semibold text-accent">
              {deal ? formatMinorUnits(deal.estimatedValueMinor, deal.currency) : "—"}
            </p>
            <Link
              href="/sales/pipeline"
              className="mt-4 inline-block text-xs font-bold uppercase tracking-wider text-accent hover:underline"
            >
              ← Back to pipeline
            </Link>
          </div>
        </div>

        {dealError ? (
          <div className="mt-4">
            <ErrorState error={dealError} onRetry={() => void load()} />
          </div>
        ) : null}

        <div className="mt-6 grid gap-2 md:grid-cols-4">
          {steps.map(([step, label, status, done]) => (
            <div
              key={step}
              className={`rounded-xl border bg-black/15 p-3 ${done ? "border-emerald-400/30" : "border-white/10"}`}
            >
              <p className={`text-[10px] font-bold ${done ? "text-emerald-300" : "text-accent"}`}>
                STEP {step}
              </p>
              <p className="mt-1 text-sm font-medium text-ink">{label}</p>
              <p className="mt-1 text-xs text-ink-dim">{status}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-line bg-surface-alt p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            Recommended next action
          </p>
          <p className="mt-1 text-sm text-ink">{readiness.nextAction}</p>
        </div>
        <span className="text-xs text-ink-dim">
          Readiness is guidance; backend authorization remains authoritative.
        </span>
      </section>

      {loading ? (
        <LoadingState label="Loading deal handoff" />
      ) : (
        <div className="grid gap-5 xl:grid-cols-3">
          {READINESS_LANES.map((lane) => (
            <ReadinessLane
              key={lane}
              lane={lane}
              readiness={readiness}
              error={laneErrors[lane]}
              href={laneHref[lane]}
              actionLabel={laneAction[lane]}
              onCreate={laneCreate[lane]}
            />
          ))}
        </div>
      )}

      {createLane === "ncnda" ? (
        <div className="mt-6">
          <CreateAgreementForm
            dealId={dealId}
            context={deal}
            onDone={() => {
              setCreateLane(null);
              void load();
            }}
          />
        </div>
      ) : null}
      {createLane === "kyc" ? (
        <div className="mt-6">
          <CreateCaseForm
            dealId={dealId}
            context={deal}
            onDone={() => {
              setCreateLane(null);
              void load();
            }}
          />
        </div>
      ) : null}

      {!loading ? (
        <section className="mt-6 rounded-[24px] border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Handoff activity</h2>
          {timeline.length ? (
            <ol className="mt-5 grid gap-4 md:grid-cols-2">
              {timeline.map((entry) => (
                <li key={entry.id} className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-sm text-ink">{entry.label}</p>
                    <p className="mt-1 text-xs text-ink-dim">
                      {entry.lane} · {new Date(entry.at).toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="No readiness activity"
              message="Start NCNDA, KYC or Technical Due Diligence from this deal."
            />
          )}
        </section>
      ) : null}
    </WorkspacePage>
  );
}

const BAR_COLOURS: Record<LaneState, string> = {
  ready: "bg-emerald-400",
  attention: "bg-amber-300",
  blocked: "bg-red-400",
  missing: "bg-transparent",
};

function ReadinessLane({
  lane,
  readiness,
  error,
  href,
  actionLabel,
  onCreate,
}: {
  lane: LaneId;
  readiness: ReadinessResult;
  error: NormalizedError | null;
  href?: string;
  actionLabel: string;
  onCreate?: () => void;
}) {
  const state = readiness.lanes[lane];
  const percent = lanePercent(lane, readiness);

  return (
    <section className="flex min-h-[300px] flex-col rounded-[24px] border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            {LANE_OWNERS[lane]}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{LANE_LABELS[lane]}</h2>
        </div>
        <StatusPill label={LANE_STATE_LABELS[state]} tone={LANE_STATE_TONES[state]} />
      </div>

      {error ? (
        <div className="mt-5">
          <ErrorState error={error} />
        </div>
      ) : (
        <>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${BAR_COLOURS[state]}`} style={{ width: `${percent}%` }} />
          </div>
          <dl className="mt-5 space-y-4">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-ink-mute">Current status</dt>
              <dd className="mt-1 text-sm text-ink">{readiness.statusLabels[lane]}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-ink-mute">Next action</dt>
              <dd className="mt-1 text-sm leading-6 text-ink-dim">
                {laneNextAction(lane, readiness.current)}
              </dd>
            </div>
          </dl>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {href ? (
              <Link
                href={href}
                className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg"
              >
                {actionLabel}
              </Link>
            ) : null}
            {onCreate ? (
              <button
                type="button"
                onClick={onCreate}
                className="rounded-full border border-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent"
              >
                Start {LANE_LABELS[lane]}
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
