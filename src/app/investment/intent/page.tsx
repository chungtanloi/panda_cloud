"use client";

import { useCallback } from "react";
import { FlowFooter, FlowHeader, FlowPanel, FlowProgress } from "@/components/wizard/FlowChrome";
import { Reveal } from "@/components/motion/Reveal";
import { LoadingState } from "@/components/ui/states";
import { useInvestment } from "@/controllers/InvestmentContext";
import { INVESTMENT_TOTAL_STEPS, STEP_INTENT } from "@/config/investment";
import type { InvestmentIntent } from "@/models/investment";
import { cn } from "@/lib/cn";
import Link from "next/link";

/**
 * Step 1 — Intent Selector. Transcribed from the right half of `AI.png`.
 *
 * The design labels this "STEP 1 OF 4"; the flow is five steps, so the
 * indicator is normalised. See models/investment.ts.
 */
export default function IntentPage() {
  const { draft, update } = useInvestment();
  const config = STEP_INTENT;

  const selected = draft.intent?.intent;
  const selectedOption = config.options.find((option) => option.value === selected);

  return (
    <>
      <FlowHeader exitHref="/investment" exitLabel={config.exitLabel} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[28px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[14px]">
          <FlowProgress
            label={`STEP 01 / 0${INVESTMENT_TOTAL_STEPS}`}
            step={1}
            total={INVESTMENT_TOTAL_STEPS}
            className="max-w-[280px]"
          />

          <h1 className="font-sans text-[32px] font-bold leading-[40px] tracking-[-0.9px] text-white lg:text-[38px] lg:leading-[46px]">
            {config.title}
          </h1>

          <p className="max-w-[560px] font-sans text-[14px] leading-[22px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.6fr_1fr]">
          <fieldset className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
            <legend className="sr-only">Investment objective</legend>

            {config.options.map((option, index) => {
              const isSelected = selected === option.value;

              return (
                <Reveal
                  key={option.value}
                  delay={index * 70}
                  className={cn(option.wide && "sm:col-span-2")}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => update("intent", { intent: option.value as InvestmentIntent })}
                    className={cn(
                      "card-highlight flex h-full w-full flex-col items-start gap-[12px] rounded-card border p-[22px] text-left transition-colors",
                      isSelected
                        ? "border-accent bg-accent-soft"
                        : "border-line-hair bg-card hover:border-accent/40",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-[34px] place-items-center rounded-field border",
                        isSelected ? "border-accent bg-accent-soft" : "border-line-soft bg-white/[0.03]",
                      )}
                    >
                      <span
                        className={cn(
                          "size-[11px] rounded-[2px] border-2",
                          isSelected ? "border-accent" : "border-ink-dim",
                        )}
                      />
                    </span>

                    <span className="font-sans text-[17px] font-semibold leading-[25px] text-white">
                      {option.title}
                    </span>

                    <span className="font-sans text-[12px] leading-[19px] text-ink-dim">
                      {option.body}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </fieldset>

          <Reveal delay={140}>
            <FlowPanel title={config.panel.title} className="min-h-[320px]">
              {selectedOption ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-[14px] text-center">
                  <span
                    aria-hidden
                    className="grid size-[52px] place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent drop-shadow-[0px_0px_18px_rgba(0,242,255,0.3)]"
                  >
                    ◎
                  </span>
                  <p className="font-sans text-[16px] font-semibold leading-[24px] text-white">
                    {selectedOption.title}
                  </p>
                  <p className="max-w-[240px] font-sans text-[12px] leading-[19px] text-ink-dim">
                    {selectedOption.body}
                  </p>
                </div>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="max-w-[220px] text-center font-sans text-[12px] leading-[19px] text-ink-faint">
                    {config.panel.empty}
                  </p>
                </div>
              )}

              <Link
                href="/investment/volume"
                aria-disabled={!selected}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-[8px] rounded-full bg-accent px-[20px] py-[12px]",
                  "font-sans text-[11px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg",
                  "transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
                  !selected && "pointer-events-none opacity-40",
                )}
              >
                {config.panel.cta}
              </Link>
            </FlowPanel>
          </Reveal>
        </div>
      </main>

      <FlowFooter />
    </>
  );
}
