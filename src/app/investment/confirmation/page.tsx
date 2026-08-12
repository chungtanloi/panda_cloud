"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { Footer } from "@/components/layout/Footer";
import { FlowHeader } from "@/components/wizard/FlowChrome";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { useAsync } from "@/controllers/useAsync";
import { STEP_CONFIRMATION } from "@/config/investment";
import type { InvestmentResult } from "@/models/investment";
import { api } from "@/services/api";

/**
 * Step 5 — Investment Confirmed. Transcribed from `conf.png`.
 *
 * Every figure comes from `api.investment.getInvestment(id)` — an investment
 * receipt is a financial record and must reflect what the ledger actually
 * holds, not what the client believed it submitted.
 */
export default function InvestmentConfirmationPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading confirmation" />}>
      <ConfirmationView />
    </Suspense>
  );
}

function ConfirmationView() {
  const params = useSearchParams();
  const id = params.get("id");
  const config = STEP_CONFIRMATION;

  const fetchInvestment = useCallback(() => {
    if (!id) throw new Error("No investment id supplied.");
    return api.investment.getInvestment(id);
  }, [id]);

  const { state, run } = useAsync(fetchInvestment, { immediate: [] });

  return (
    <>
      <FlowHeader />

      <main className="relative mx-auto flex w-full max-w-[1150px] flex-1 flex-col gap-[28px] px-[24px] py-[32px] lg:px-[40px]">
        <AnimatedBackdrop stars />

        <Reveal className="relative flex flex-col items-center gap-[14px] text-center">
          <span
            aria-hidden
            className="grid size-[52px] place-items-center rounded-full bg-accent text-accent-fg drop-shadow-[0px_0px_22px_rgba(0,242,255,0.45)]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 12.5 10 16.5 18 7.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <h1 className="font-sans text-[34px] font-bold leading-[42px] tracking-[-1px] text-white lg:text-[40px]">
            {config.title}
          </h1>

          <p className="max-w-[600px] font-sans text-[13px] leading-[21px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        {!id ? (
          <ErrorState
            error={{
              code: "BAD_REQUEST",
              message:
                "This confirmation link is missing its investment reference. Check your email for the receipt.",
            }}
          />
        ) : state.status === "error" ? (
          <ErrorState error={state.error} onRetry={() => void run()} />
        ) : state.status === "success" ? (
          <ConfirmationBody result={state.data} />
        ) : (
          <div className="relative grid grid-cols-1 gap-[20px] lg:grid-cols-[1.5fr_1fr]" aria-hidden>
            <Skeleton className="h-[220px] rounded-card" />
            <Skeleton className="h-[220px] rounded-card" />
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function ConfirmationBody({ result }: { result: InvestmentResult }) {
  const config = STEP_CONFIRMATION;

  return (
    <>
      <div className="relative grid grid-cols-1 items-start gap-[20px] lg:grid-cols-[1.5fr_1fr]">
        {/* Receipt */}
        <Reveal>
          <div
            data-circuit-attract
            className="card-highlight flex flex-col gap-[20px] rounded-card border border-line-hair bg-card p-[24px]"
          >
            <div className="flex flex-wrap items-start justify-between gap-[20px]">
              <div className="flex flex-col gap-[6px]">
                <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">
                  {config.totalLabel}
                </span>
                <span className="flex items-baseline">
                  <CountUp
                    value={`$${result.totalInvestmentUsd.toLocaleString("en-US")}`}
                    className="font-sans text-[34px] font-bold leading-[42px] text-accent [text-shadow:0px_0px_16px_rgba(0,242,255,0.35)]"
                  />
                  <span className="font-sans text-[16px] text-accent/70">.00</span>
                </span>
              </div>

              <div className="flex flex-col items-end gap-[6px]">
                <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">
                  {config.allocationLabel}
                </span>
                <span className="inline-flex items-center gap-[8px] rounded-field border border-accent-line bg-accent-soft px-[12px] py-[7px]">
                  <span aria-hidden className="text-accent">
                    ◈
                  </span>
                  <CountUp
                    value={result.tokenAllocation.toLocaleString("en-US")}
                    className="font-sans text-[18px] font-semibold leading-[24px] text-white"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[1.1px] text-accent">
                    {result.tokenSymbol}
                  </span>
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-[16px] border-t border-line-soft pt-[16px] sm:grid-cols-4">
              <MetaCell label={config.meta.transactionId} value={result.transactionId} mono />
              <MetaCell
                label={config.meta.date}
                value={new Date(result.transactionDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              />
              <MetaCell label={config.meta.network} value={result.network} dot />
              <MetaCell label={config.meta.status} value="Confirmed" accent dot />
            </dl>
          </div>
        </Reveal>

        {/* Projections */}
        <Reveal delay={100}>
          <div className="card-highlight flex flex-col gap-[16px] rounded-card border border-line-hair bg-card p-[24px]">
            <h2 className="flex items-center justify-between gap-[12px] font-sans text-[16px] font-semibold leading-[24px] text-white">
              {config.projections.title}
              <span aria-hidden className="text-accent">
                ↗
              </span>
            </h2>

            <div className="rounded-panel border border-line-soft bg-surface p-[16px]">
              <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">
                {config.projections.apyLabel}
              </p>
              <CountUp
                value={`${result.estimatedApyPercent}%`}
                className="block pt-[6px] font-sans text-[28px] font-bold leading-[36px] text-accent"
              />
            </div>

            <div className="rounded-panel border border-line-soft bg-surface p-[16px]">
              <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">
                {config.projections.valueLabel}
              </p>
              <CountUp
                value={`~$${result.fiveYearValueUsd.toLocaleString("en-US")}`}
                className="block pt-[6px] font-sans text-[22px] font-semibold leading-[30px] text-white"
              />
            </div>

            <p className="flex items-center gap-[8px] font-mono text-[10px] uppercase tracking-[1.1px] text-accent">
              <span aria-hidden className="pulse-dot size-[5px] rounded-full bg-accent" />
              {config.projections.liveNote}
            </p>
          </div>
        </Reveal>
      </div>

      {/* Risk + actions */}
      <div className="relative grid grid-cols-1 items-center gap-[20px] lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <div className="rounded-card border border-red-400/30 bg-red-400/[0.06] p-[20px]">
            <p className="flex items-center gap-[8px] font-mono text-[10px] uppercase tracking-[1.2px] text-red-300">
              <span aria-hidden>⚠</span>
              {config.riskTitle}
            </p>
            <p className="pt-[8px] font-sans text-[11px] leading-[18px] text-ink-dim">
              {config.riskBody}
            </p>
          </div>
        </Reveal>

        <Reveal delay={80} className="flex flex-wrap items-center justify-end gap-[10px]">
          <Link
            href="/submit-request"
            className="inline-flex items-center gap-[7px] rounded-full border border-line-strong px-[18px] py-[10px] font-sans text-[12px] leading-[18px] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>▤</span>
            {config.actions.prospectus}
          </Link>

          <Link
            href="/submit-request"
            className="inline-flex items-center gap-[7px] rounded-full border border-line-strong px-[18px] py-[10px] font-sans text-[12px] leading-[18px] text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>☎</span>
            {config.actions.expertCall}
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-[7px] rounded-full bg-accent px-[20px] py-[10px] font-sans text-[12px] font-bold leading-[18px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_18px_rgba(0,242,255,0.45)]"
          >
            {config.actions.dashboard}
            <span aria-hidden>→</span>
          </Link>
        </Reveal>
      </div>
    </>
  );
}

function MetaCell({
  label,
  value,
  mono,
  accent,
  dot,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  dot?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <dt className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">{label}</dt>
      <dd
        className={[
          "flex items-center gap-[6px] text-[12px] leading-[18px]",
          mono ? "font-mono" : "font-sans",
          accent ? "text-accent" : "text-ink",
        ].join(" ")}
      >
        {dot ? <span aria-hidden className="size-[5px] rounded-full bg-accent" /> : null}
        {value}
      </dd>
    </div>
  );
}
