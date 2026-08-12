"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { Reveal } from "@/components/motion/Reveal";
import { LoadingState } from "@/components/ui/states";
import { useAsync } from "@/controllers/useAsync";
import { useBooking } from "@/controllers/BookingContext";
import { STEP_WORKLOAD } from "@/config/booking";
import type { WorkloadType } from "@/models/booking";
import { api } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 1 — Workload Type. Transcribed from `GPU_1.png`.
 *
 * Unlike the assessment flow, this screen keeps the full marketing navigation
 * and footer — that is what the design shows.
 *
 * The recommendation panel is fetched from the backend rather than mapped in
 * the UI, so hardware guidance stays a product decision.
 */
export default function WorkloadPage() {
  const { draft, update } = useBooking();
  const config = STEP_WORKLOAD;

  const selected = draft.workload?.workload;

  const fetchRecommendation = useCallback(
    (workload: WorkloadType) => api.booking.recommend(workload),
    [],
  );
  const { state, run } = useAsync(fetchRecommendation);

  function choose(workload: WorkloadType) {
    update("workload", { workload });
    void run(workload);
  }

  return (
    <>
      <TopNavBar />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[32px] px-[24px] py-[40px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[14px]">
          <p className="flex items-center gap-[8px] font-mono text-[11px] uppercase leading-[12px] tracking-[1.2px] text-accent">
            <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
            {config.statusLine}
          </p>

          <h1 className="font-sans text-[30px] font-bold leading-[38px] tracking-[-0.8px] text-white lg:text-[36px] lg:leading-[44px]">
            {config.titleLead}
            <span className="text-accent">{config.titleAccent}</span>
          </h1>

          <p className="max-w-[620px] font-sans text-[14px] leading-[22px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.55fr_1fr]">
          {/* Workload options */}
          <fieldset className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
            <legend className="sr-only">Primary workload</legend>

            {config.options.map((option, index) => {
              const isSelected = selected === option.value;

              return (
                <Reveal
                  key={option.value}
                  delay={index * 60}
                  className={cn(option.wide && "sm:col-span-2")}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => choose(option.value)}
                    className={cn(
                      "card-highlight flex h-full w-full flex-col items-start gap-[14px] rounded-card border p-[24px] text-left transition-colors",
                      isSelected
                        ? "border-accent bg-accent-soft"
                        : "border-line-hair bg-card hover:border-accent/40",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-[36px] place-items-center rounded-field border",
                        isSelected ? "border-accent bg-accent-soft" : "border-line-soft bg-white/[0.03]",
                      )}
                    >
                      <span
                        className={cn(
                          "size-[12px] rounded-[3px] border-2",
                          isSelected ? "border-accent" : "border-ink-dim",
                        )}
                      />
                    </span>

                    <span className="flex flex-col gap-[4px]">
                      <span className="font-sans text-[18px] font-semibold leading-[26px] text-white">
                        {option.title}
                      </span>
                      <span className="font-sans text-[12px] leading-[18px] text-ink-dim">
                        {option.caption}
                      </span>
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </fieldset>

          {/* Recommendation */}
          <Reveal delay={120}>
            <div
              data-circuit-attract
              className="relative flex flex-col gap-[18px] overflow-hidden rounded-card border border-accent/40 bg-glass p-[24px] backdrop-blur-card"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-[64px] -top-[64px] size-[160px] rounded-full bg-accent/10 blur-[40px]"
              />

              <div className="relative flex items-center justify-between gap-[12px]">
                <p className="font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-ink-dim">
                  {config.output.title}
                </p>
                {state.status === "loading" ? (
                  <span className="rounded-field border border-accent-line bg-accent-soft px-[9px] py-[4px] font-mono text-[10px] uppercase tracking-[1.2px] text-accent">
                    {config.output.badge}
                  </span>
                ) : null}
              </div>

              <p className="relative font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">
                {config.output.sectionLabel}
              </p>

              {state.status === "success" ? (
                <>
                  <p className="relative font-sans text-[22px] font-semibold leading-[30px] text-white">
                    {state.data.gpuName}
                  </p>

                  <p className="relative font-sans text-[13px] leading-[21px] text-ink-dim">
                    {state.data.rationale}
                  </p>

                  <div className="relative grid grid-cols-2 gap-[10px]">
                    <StatChip label={config.output.minNodeLabel} value={state.data.minNodeSize} emphasis />
                    <StatChip label={config.output.interconnectLabel} value={state.data.interconnect} />
                  </div>
                </>
              ) : state.status === "loading" ? (
                <div className="relative py-[32px]">
                  <LoadingState label="Predicting" />
                </div>
              ) : state.status === "error" ? (
                <p role="alert" className="relative font-sans text-[13px] text-red-400">
                  {state.error.message}
                </p>
              ) : (
                <p className="relative py-[24px] font-sans text-[13px] leading-[21px] text-ink-faint">
                  {config.output.empty}
                </p>
              )}

              <Link
                href="/booking/hardware"
                aria-disabled={!selected}
                className={cn(
                  "relative mt-auto inline-flex w-full items-center justify-center gap-[8px] rounded-full bg-accent px-[20px] py-[13px]",
                  "font-sans text-[12px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg",
                  "transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
                  !selected && "pointer-events-none opacity-40",
                )}
              >
                {config.next}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </>
  );
}

function StatChip({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-[6px] rounded-field border border-line-soft bg-surface px-[12px] py-[10px]">
      <span className="font-mono text-[9px] uppercase leading-[12px] tracking-[1.2px] text-ink-mute">
        {label}
      </span>
      <span
        className={cn(
          "font-sans text-[13px] font-semibold leading-[18px]",
          emphasis ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
