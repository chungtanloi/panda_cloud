"use client";

import { useCallback, useEffect } from "react";
import { FlowFooter, FlowHeader, FlowNav, FlowPanel, FlowProgress } from "@/components/wizard/FlowChrome";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { useAsync } from "@/controllers/useAsync";
import { useHyperscale } from "@/controllers/HyperscaleContext";
import { HYPERSCALE_TOTAL_STEPS, STEP_PROJECT_STAGE } from "@/config/hyperscale";
import type { ProjectStage } from "@/models/hyperscale";
import { api } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 1 — Select Project Stage. Transcribed from `projecttage.png`.
 *
 * The telemetry panel (timeline, impact, readiness) is fetched rather than
 * mapped in the UI: these are delivery commitments, not presentation.
 */
export default function ProjectStagePage() {
  const { draft, update } = useHyperscale();
  const config = STEP_PROJECT_STAGE;

  const selected = draft.projectStage?.stage;
  const selectedOption = config.options.find((option) => option.value === selected);

  const fetchAnalysis = useCallback((stage: ProjectStage) => api.hyperscale.analyzeStage(stage), []);
  const { state, run } = useAsync(fetchAnalysis);

  useEffect(() => {
    if (selected) void run(selected);
  }, [selected, run]);

  const analysis = state.status === "success" ? state.data : null;

  return (
    <>
      <FlowHeader exitHref="/" exitLabel={config.exitLabel} />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[24px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[12px]">
          <FlowProgress
            label={config.statusLine}
            step={1}
            total={HYPERSCALE_TOTAL_STEPS}
            className="max-w-[280px]"
          />

          <h1 className="font-sans text-[30px] font-bold leading-[38px] tracking-[-0.8px] text-white">
            {config.title}
          </h1>

          <p className="max-w-[600px] font-sans text-[13px] leading-[21px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[20px] lg:grid-cols-[1.7fr_1fr]">
          <fieldset className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
            <legend className="sr-only">Project stage</legend>

            {config.options.map((option, index) => {
              const isSelected = selected === option.value;

              return (
                <Reveal key={option.value} delay={index * 60}>
                  <SpotlightCard
                    className={cn(
                      "card-highlight h-full rounded-card border transition-colors",
                      isSelected ? "border-accent bg-accent-soft" : "border-line-hair bg-card",
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => update("projectStage", { stage: option.value })}
                      className="relative flex h-full w-full flex-col items-start gap-[10px] p-[20px] text-left"
                    >
                      <span className="flex w-full items-start justify-between gap-[12px]">
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-[32px] place-items-center rounded-field border",
                            isSelected ? "border-accent bg-accent-soft" : "border-line-soft bg-white/[0.03]",
                          )}
                        >
                          <span
                            className={cn(
                              "size-[10px] rounded-[2px] border-2",
                              isSelected ? "border-accent" : "border-ink-dim",
                            )}
                          />
                        </span>

                        <span
                          aria-hidden
                          className={cn(
                            "grid size-[18px] place-items-center rounded-full border text-[10px]",
                            isSelected ? "border-accent bg-accent text-accent-fg" : "border-line-soft text-transparent",
                          )}
                        >
                          ✓
                        </span>
                      </span>

                      <span className="font-sans text-[17px] font-semibold leading-[25px] text-white">
                        {option.title}
                      </span>

                      <span className="font-sans text-[11px] leading-[18px] text-ink-dim">
                        {option.body}
                      </span>

                      <span className="mt-auto flex flex-wrap gap-[6px] pt-[8px]">
                        {option.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-field border border-line-soft bg-white/[0.03] px-[8px] py-[4px] font-mono text-[9px] uppercase tracking-[1px] text-ink-dim"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    </button>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </fieldset>

          <Reveal delay={140}>
            <FlowPanel title="Impact Analysis" badge={config.panel.badge} className="h-full">
              {selectedOption && analysis ? (
                <>
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
                      {config.panel.selectedLabel}
                    </span>
                    <span className="font-sans text-[20px] font-semibold leading-[28px] text-white">
                      {selectedOption.title}
                    </span>
                  </div>

                  <div className="rounded-panel border border-accent/30 bg-accent-soft p-[14px]">
                    <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
                      {config.panel.timelineLabel}
                    </span>
                    <p className="pt-[4px] font-sans text-[20px] font-bold leading-[28px] text-accent">
                      {analysis.estimatedTimeline}
                    </p>
                  </div>

                  <div className="flex flex-col gap-[6px]">
                    <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
                      {config.panel.impactLabel}
                    </span>
                    <p className="font-sans text-[11px] leading-[18px] text-ink-dim">
                      {analysis.impact}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-[6px]">
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[1.2px]">
                      <span className="text-ink-mute">{config.panel.readinessLabel}</span>
                      <span className="text-accent">{analysis.buildReadiness}%</span>
                    </div>
                    <div className="h-[3px] w-full overflow-hidden rounded-full bg-raised">
                      <div
                        className="h-full rounded-full bg-accent shadow-accent-bar transition-[width] duration-500 ease-out"
                        style={{ width: `${analysis.buildReadiness}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="flex flex-1 items-center justify-center text-center font-sans text-[12px] leading-[19px] text-ink-faint">
                  {config.panel.empty}
                </p>
              )}
            </FlowPanel>
          </Reveal>
        </div>

        <FlowNav
          backLabel={config.back}
          backHref="/"
          nextLabel={config.next}
          nextHref="/hyperscale/capacity"
          disabled={!selected}
        />
      </main>

      <FlowFooter />
    </>
  );
}
