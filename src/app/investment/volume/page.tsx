"use client";

import { useCallback, useEffect } from "react";
import { FlowFooter, FlowHeader, FlowNav, FlowPanel } from "@/components/wizard/FlowChrome";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { useAsync } from "@/controllers/useAsync";
import { useInvestment } from "@/controllers/InvestmentContext";
import { INVESTMENT_TOTAL_STEPS, STEP_VOLUME } from "@/config/investment";
import { api } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 2 — Determine Volume. Transcribed from `invest2.png`.
 *
 * The projection panel is fetched, not computed here: token allocation,
 * hash-rate and five-year ROI are commercial figures shown to an investor, so
 * they must come from one authoritative source.
 */
export default function VolumePage() {
  const { draft, update } = useInvestment();
  const config = STEP_VOLUME;

  const amount = draft.volume?.amountUsd ?? config.default;
  const percent = ((amount - config.min) / (config.max - config.min)) * 100;

  const fetchProjection = useCallback((value: number) => api.investment.project(value), []);
  const { state, run } = useAsync(fetchProjection);

  // Recompute whenever the allocation changes.
  useEffect(() => {
    void run(amount);
  }, [amount, run]);

  const projection = state.status === "success" ? state.data : null;

  return (
    <>
      <FlowHeader status={config.statusRight} />

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-center gap-[24px] px-[24px] py-[32px] lg:px-[40px]">
        <Reveal className="flex flex-wrap items-center justify-between gap-[16px]">
          <h1 className="font-sans text-[30px] font-bold leading-[38px] tracking-[-0.8px] text-white">
            {config.title}
          </h1>

          <span className="rounded-field border border-line-soft px-[12px] py-[6px] font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">
            {config.phaseLabel}
          </span>
        </Reveal>

        <div className="grid grid-cols-1 items-stretch gap-[20px] lg:grid-cols-[1.25fr_1fr]">
          {/* Allocation */}
          <Reveal>
            <div className="card-highlight flex h-full flex-col gap-[28px] rounded-card border border-line-hair bg-card p-[24px]">
              <div className="flex flex-col gap-[10px]">
                <label
                  htmlFor="allocation"
                  className="font-mono text-[10px] uppercase leading-[14px] tracking-[1.2px] text-ink-dim"
                >
                  {config.allocationLabel}
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 font-sans text-[16px] text-accent">
                    $
                  </span>
                  <input
                    id="allocation"
                    type="number"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={amount}
                    onChange={(event) =>
                      update("volume", {
                        amountUsd: clamp(Number(event.target.value), config.min, config.max),
                      })
                    }
                    className="w-full rounded-full border border-line-strong bg-deep py-[14px] pl-[34px] pr-[18px] font-sans text-[16px] text-ink focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center justify-between gap-[12px]">
                  <span className="font-mono text-[10px] uppercase leading-[14px] tracking-[1.2px] text-ink-dim">
                    {config.sliderLabel}
                  </span>
                  <span className="rounded-field border border-accent-line bg-accent-soft px-[9px] py-[4px] font-mono text-[9px] uppercase tracking-[1.1px] text-accent">
                    {config.tierBadge}
                  </span>
                </div>

                <input
                  type="range"
                  min={config.min}
                  max={config.max}
                  step={config.step}
                  value={amount}
                  aria-label="Capital allocation"
                  aria-valuetext={`$${amount.toLocaleString("en-US")}`}
                  onChange={(event) => update("volume", { amountUsd: Number(event.target.value) })}
                  className="circuit-range w-full"
                  style={{ ["--fill" as string]: `${percent}%` }}
                />

                <div className="flex justify-between font-sans text-[10px] leading-[14px] text-ink-faint">
                  {config.ticks.map((tick) => (
                    <span key={tick.label}>{tick.label}</span>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-[12px]">
                <button
                  type="button"
                  onClick={() => update("volume", { amountUsd: config.default })}
                  className="rounded-full border border-line-strong px-[24px] py-[11px] font-sans text-[11px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
                >
                  {config.resetLabel}
                </button>

                <FlowNav
                  nextLabel={config.next}
                  nextHref="/investment/payment"
                  disabled={!projection}
                  className="flex-1"
                />
              </div>
            </div>
          </Reveal>

          {/* Projection */}
          <Reveal delay={100}>
            <FlowPanel title={config.panel.title} badge="LIVE" className="h-full">
              <Metric
                label={config.panel.tokenLabel}
                value={
                  projection ? projection.tokenAllocation.toLocaleString("en-US") : "—"
                }
                unit={projection?.tokenSymbol}
                large
              />

              <Metric
                label={config.panel.hashLabel}
                value={projection ? projection.hashRate.split(" ")[0]! : "—"}
                unit={projection ? projection.hashRate.split(" ")[1] : undefined}
              />

              <div className="rounded-panel border border-accent/30 bg-accent-soft p-[16px]">
                <p className="font-mono text-[9px] uppercase leading-[12px] tracking-[1.2px] text-accent">
                  {config.panel.roiLabel}
                </p>

                <p className="flex items-center gap-[8px] pt-[8px]">
                  <CountUp
                    value={projection ? `${projection.roiPercent}%` : "—"}
                    className="font-sans text-[30px] font-bold leading-[38px] text-accent"
                  />
                  <span aria-hidden className="text-accent">
                    ↗
                  </span>
                </p>

                <div className="flex items-center justify-between pt-[10px] font-mono text-[9px] uppercase tracking-[1.1px] text-ink-dim">
                  <span>
                    {projection?.breakEven ?? "—"}: {config.panel.breakEvenLabel}
                  </span>
                  <span>
                    {projection?.maxYield ?? "—"}: {config.panel.maxYieldLabel}
                  </span>
                </div>
              </div>
            </FlowPanel>
          </Reveal>
        </div>
      </main>

      <FlowFooter note={config.footer} />
    </>
  );
}

function Metric({
  label,
  value,
  unit,
  large,
}: {
  label: string;
  value: string;
  unit?: string;
  large?: boolean;
}) {
  return (
    <div className="rounded-panel border border-line-soft bg-surface p-[14px]">
      <p className="font-mono text-[9px] uppercase leading-[12px] tracking-[1.2px] text-ink-mute">
        {label}
      </p>
      <p className="flex items-baseline gap-[6px] pt-[6px]">
        <CountUp
          value={value}
          className={cn(
            "font-sans font-bold text-accent",
            large ? "text-[26px] leading-[34px]" : "text-[22px] leading-[30px]",
          )}
        />
        {unit ? <span className="font-sans text-[12px] text-ink-dim">{unit}</span> : null}
      </p>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
