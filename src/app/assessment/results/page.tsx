"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { AssessmentFooter, AssessmentHeader } from "@/components/assessment/AssessmentChrome";
import { ReportDownload } from "@/components/assessment/ReportDownload";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { useAsync } from "@/controllers/useAsync";
import { ASSESSMENT_REPORT } from "@/config/assessment";
import type { AssessmentCompletedResult, AssessmentResult, AssessmentRisk, AssessmentSessionDetailResponse } from "@/models/assessment";
import { api } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Assessment Report — Figma node 2:1545, transcribed from `Results.png`.
 *
 * Every figure comes from `api.assessment.getResult(id)`; the id is passed in
 * the query string by the final input step. Static copy (headings, labels)
 * still lives in config/assessment.ts.
 */
export default function AssessmentResultsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading report" />}>
      <ResultsView />
    </Suspense>
  );
}

function ResultsView() {
  const params = useSearchParams();
  const id = params.get("id");
  const config = ASSESSMENT_REPORT;

  const fetchResult = useCallback(async (): Promise<{ kind: "ai"; data: AssessmentSessionDetailResponse } | { kind: "standard"; data: AssessmentResult }> => {
    if (!id) throw new Error("No assessment id supplied.");
    try {
      return { kind: "ai", data: await api.assessment.getSession(id) };
    } catch {
      return { kind: "standard", data: await api.assessment.getResult(id) };
    }
  }, [id]);

  const { state, run } = useAsync(fetchResult, { immediate: [] });

  return (
    <>
      <AssessmentHeader />

      <main className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[40px] px-[24px] py-[24px] lg:px-[40px]">
        <AnimatedBackdrop stars />

        <Reveal className="relative flex flex-col items-center gap-[16px] text-center">
          <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px] font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-accent">
            <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
            {config.badge}
          </span>

          <h1 className="font-sans text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-white lg:text-[44px]">
            {config.titleLead}
            <span className="text-accent">{config.titleAccent}</span>
          </h1>

          <p className="max-w-[660px] font-sans text-[15px] leading-[24px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        {!id ? (
          <ErrorState
            error={{
              code: "BAD_REQUEST",
              message:
                "This report link is missing its assessment reference. Start the assessment again to generate a new one.",
            }}
          />
        ) : state.status === "error" ? (
          <ErrorState error={state.error} onRetry={() => void run()} />
        ) : state.status === "success" ? (
          state.data.kind === "ai" ? <AiSessionReport session={state.data.data} /> : <ReportBody result={state.data.data} />
        ) : (
          <ReportSkeleton />
        )}
      </main>

      <AssessmentFooter />
    </>
  );
}

function AiSessionReport({ session }: { session: AssessmentSessionDetailResponse }) {
  const report = session.session.paidReport ?? (session.session.accessTier !== "paid" ? undefined : undefined);
  if (!report) {
    return <section className="relative rounded-card border border-amber-300/30 bg-amber-300/5 p-[24px]"><p className="font-mono text-[10px] uppercase tracking-[1.2px] text-amber-200">Assessment status</p><h2 className="mt-[10px] text-[24px] font-semibold text-white">Report is still being prepared</h2><p className="mt-[8px] text-[14px] leading-[22px] text-ink-dim">The assessment session has been found, but the completed Decision Pack is not available yet. Please return to the AI assessment and retry the last answer.</p><Link href={`/assessment/ai?sessionId=${encodeURIComponent(session.session.sessionId)}`} className="mt-[18px] inline-flex rounded-full bg-accent px-[18px] py-[11px] font-mono text-[11px] uppercase tracking-[1px] text-black">Continue assessment</Link></section>;
  }
  return <section className="relative space-y-[24px]">
    <div className="rounded-card border border-accent/30 bg-accent/10 p-[24px]"><p className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">Paid Decision Pack · Completed</p><div className="mt-[10px] flex flex-wrap items-center justify-between gap-[12px]"><h2 className="text-[28px] font-semibold text-white">Assessment report completed</h2><span className="rounded-full border border-accent/40 px-[12px] py-[7px] font-mono text-[10px] uppercase tracking-[1px] text-accent">{report.overallRecommendation.replaceAll("_", " ")}</span></div><p className="mt-[12px] text-[14px] leading-[23px] text-ink">{report.summary}</p></div>
    <div className="grid gap-[16px] sm:grid-cols-3"><ReportMetric label="Coverage" value={`${report.informationCoveragePercent}%`} /><ReportMetric label="Feasibility score" value={typeof report.feasibilityScore === "number" ? `${report.feasibilityScore}/100` : "—"} /><ReportMetric label="Human review" value={report.needsHumanReview ? "Required" : "Not required"} /></div>
    <div className="grid gap-[16px] lg:grid-cols-2"><ReportObject title="Critical blockers" items={report.criticalBlockers} /><ReportObject title="Missing evidence" items={report.missingEvidence.map((item) => ({ item }))} /><ReportObject title="Infrastructure assessment" items={report.infrastructureAssessment ? [report.infrastructureAssessment] : undefined} /><ReportObject title="30/60/90-day action plan" items={report.actionPlan ? [report.actionPlan] : undefined} /></div>
    {report.recommendations.length ? <ReportObject title="Recommendations" items={report.recommendations.map((item) => ({ item }))} /> : null}
    <div className="rounded-card border border-accent/30 bg-accent/10 p-[20px] text-[14px] text-ink">A Panda Cloud infrastructure specialist can review this assessment and coordinate the next step.</div>
  </section>;
}

function ReportMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-card border border-line-hair bg-card p-[18px]"><p className="font-mono text-[10px] uppercase tracking-[1.1px] text-ink-mute">{label}</p><p className="mt-[9px] text-[24px] font-semibold text-white">{value}</p></div>; }

function ReportObject({ title, items }: { title: string; items?: Array<Record<string, unknown>> }) { return <div className="rounded-card border border-line-hair bg-card p-[18px]"><p className="font-mono text-[10px] uppercase tracking-[1.1px] text-ink-mute">{title}</p>{items?.length ? <ul className="mt-[10px] space-y-[8px] text-[13px] leading-[21px] text-ink">{items.map((item, index) => <li key={index}>{Object.entries(item).map(([key, value]) => `${key.replaceAll("_", " ")}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`).join(" · ")}</li>)}</ul> : <p className="mt-[10px] text-[13px] text-ink-dim">No information reported.</p>}</div>; }

function ReportBody({ result }: { result: AssessmentResult }) {
  const config = ASSESSMENT_REPORT;

  /** Figures are derived from the result, not stored as display strings. */
  const stats = [
    {
      id: "viability",
      label: "VIABILITY SCORE",
      value: String(result.viabilityScore),
      unit: "/100",
      chip: result.viabilityLabel,
    },
    {
      id: "density",
      label: "MW DENSITY",
      value: result.mwDensityRange,
      caption: "Megawatts Required",
    },
    {
      id: "timeline",
      label: "EST. TIMELINE",
      value: result.timelineMonths,
      caption: "Months to Deployment",
    },
    {
      id: "capex",
      label: "CAPEX ESTIMATE",
      value: `$${(result.capexEstimateUsd / 1_000_000).toFixed(0)}M`,
      caption: "Initial Investment (USD)",
    },
  ];

  return (
    <>
      <section
        aria-label="Assessment summary"
        className="relative grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, index) => (
          <Reveal key={stat.id} delay={index * 70}>
            <SpotlightCard className="card-highlight flex h-full flex-col gap-[12px] rounded-card border border-line-hair bg-card p-[20px]">
              <p className="relative font-mono text-[10px] uppercase leading-[14px] tracking-[1.2px] text-ink-mute">
                {stat.label}
              </p>

              <p className="relative flex items-baseline gap-[2px]">
                <CountUp
                  value={stat.value}
                  className={
                    stat.id === "viability"
                      ? "font-sans text-[36px] font-bold leading-[44px] text-accent [text-shadow:0px_0px_14px_rgba(0,242,255,0.35)]"
                      : "font-sans text-[28px] font-semibold leading-[36px] text-white"
                  }
                />
                {stat.unit ? (
                  <span className="font-sans text-[16px] text-ink-dim">{stat.unit}</span>
                ) : null}
              </p>

              {stat.chip ? (
                <span className="relative w-fit rounded-field border border-accent-line bg-accent-soft px-[8px] py-[4px] font-mono text-[10px] tracking-[0.6px] text-accent">
                  {stat.chip}
                </span>
              ) : null}

              {stat.caption ? (
                <p className="relative font-sans text-[12px] leading-[18px] text-ink-dim">
                  {stat.caption}
                </p>
              ) : null}
            </SpotlightCard>
          </Reveal>
        ))}
      </section>

      <div className="relative grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <div className="card-highlight flex flex-col gap-[20px] rounded-card border border-line-hair bg-card p-[25px]">
            <h2 className="flex items-center gap-[10px] font-sans text-[18px] font-medium leading-[26px] text-white">
              <span aria-hidden className="text-[16px] text-amber-400">
                ⚠
              </span>
              {config.risksTitle}
            </h2>

            {result.risks.length === 0 ? (
              <p className="font-sans text-[13px] leading-[21px] text-ink-dim">
                No material risks were identified for this configuration.
              </p>
            ) : (
              <ul className="flex flex-col gap-[16px]">
                {result.risks.map((risk) => (
                  <RiskItem key={risk.title} risk={risk} />
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div
            data-circuit-attract
            className="card-highlight flex flex-col items-center gap-[16px] rounded-card border border-line-hair bg-card p-[25px] text-center"
          >
            <p className="font-mono text-[10px] uppercase leading-[14px] tracking-[1.2px] text-ink-mute">
              {config.nextStepsTitle}
            </p>

            {/* Sign-up is requested here and only here — see ReportDownload. */}
            <ReportDownload
              reportUrl={result.reportUrl}
              label={config.primaryCta}
              assessmentId={result.id}
            />

            <Link
              href="/energy-land#enquiry"
              className="inline-flex w-full items-center justify-center gap-[8px] rounded-full border border-line-strong px-[20px] py-[12px] font-sans text-[13px] font-medium leading-[20px] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <span aria-hidden>☎</span>
              {config.secondaryCta}
            </Link>

            <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-faint">
              {config.orLabel}
            </span>

            <Link
              href={config.tertiaryCta.href}
              className="font-sans text-[13px] leading-[20px] text-accent hover:underline"
            >
              {config.tertiaryCta.label} →
            </Link>
          </div>
        </Reveal>
      </div>
    </>
  );
}

function RiskItem({ risk }: { risk: AssessmentRisk }) {
  return (
    <li
      className={cn(
        "border-l-2 pl-[16px] transition-colors",
        risk.severity === "high"
          ? "border-amber-400/70"
          : risk.severity === "medium"
            ? "border-line-soft hover:border-accent"
            : "border-line-soft hover:border-accent",
      )}
    >
      <h3 className="flex items-center gap-[8px] font-sans text-[14px] font-semibold leading-[22px] text-white">
        {risk.title}
        <span
          className={cn(
            "rounded-field px-[6px] py-[2px] font-mono text-[9px] uppercase tracking-[1px]",
            risk.severity === "high"
              ? "bg-amber-400/15 text-amber-300"
              : "bg-white/5 text-ink-dim",
          )}
        >
          {risk.severity}
        </span>
      </h3>
      <p className="pt-[4px] font-sans text-[13px] leading-[21px] text-ink-dim">{risk.body}</p>
    </li>
  );
}

function ReportSkeleton() {
  return (
    <>
      <span className="sr-only">
        <LoadingState label="Generating report" />
      </span>

      <section className="grid grid-cols-1 gap-[20px] sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
        <Skeleton className="h-[140px] rounded-card" />
        <Skeleton className="h-[140px] rounded-card" />
        <Skeleton className="h-[140px] rounded-card" />
        <Skeleton className="h-[140px] rounded-card" />
      </section>

      <div className="grid grid-cols-1 gap-[24px] lg:grid-cols-[1.6fr_1fr]" aria-hidden>
        <Skeleton className="h-[300px] rounded-card" />
        <Skeleton className="h-[300px] rounded-card" />
      </div>
    </>
  );
}
