"use client";

import { useCallback, useEffect } from "react";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { FlowNav, FlowProgress } from "@/components/wizard/FlowChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useAsync } from "@/controllers/useAsync";
import { useHyperscale } from "@/controllers/HyperscaleContext";
import { HYPERSCALE_TOTAL_STEPS, STEP_GEOGRAPHY } from "@/config/hyperscale";
import { api } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 3 — Geography & Timeline. Transcribed from `huper3.png`.
 *
 * ⚠ The export reads "STEP 3 OF 5" and its button said "Proceed to Networking",
 * though the flow has four steps and no Networking screen. Both corrected —
 * see models/hyperscale.ts.
 *
 * The Gantt is generated from the chosen date rather than drawn: moving the
 * go-live inside the procurement window has to visibly move the critical path,
 * otherwise the chart is decoration.
 */
export default function GeographyPage() {
  const { draft, update } = useHyperscale();
  const config = STEP_GEOGRAPHY;

  const region = draft.geography?.region ?? "";
  const targetGoLive = draft.geography?.targetGoLive ?? "";

  const fetchRegions = useCallback(() => api.hyperscale.listRegions(), []);
  const { state: regionsState, run: retryRegions } = useAsync(fetchRegions, { immediate: [] });
  const regions = regionsState.status === "success" ? regionsState.data : [];

  const fetchSchedule = useCallback(() => api.hyperscale.buildSchedule(draft), [draft]);
  const { state, run } = useAsync(fetchSchedule);

  useEffect(() => {
    if (region && targetGoLive) void run();
  }, [region, targetGoLive, run]);

  const schedule = state.status === "success" ? state.data : null;
  const selectedRegion = regions?.find((item) => item.id === region);
  const complete = Boolean(region && targetGoLive);

  return (
    <>
      <TopNavBar />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[24px] px-[24px] py-[32px] lg:px-[40px]">
        <Reveal className="flex flex-wrap items-start justify-between gap-[16px]">
          <div className="flex max-w-[520px] flex-col gap-[12px]">
            <FlowProgress
              label={config.statusLine}
              step={3}
              total={HYPERSCALE_TOTAL_STEPS}
              className="max-w-[240px]"
            />
            <p className="font-sans text-[13px] leading-[21px] text-ink-dim">{config.body}</p>
          </div>

          <span className="flex items-center gap-[8px] font-mono text-[10px] uppercase tracking-[1.2px] text-accent">
            <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
            {config.statusRight}
          </span>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[20px] lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-[16px]">
            {/* Region */}
            <Reveal>
              <div className="card-highlight flex flex-col gap-[14px] rounded-card border border-line-hair bg-card p-[22px]">
                <h2 className="flex items-center gap-[8px] font-sans text-[17px] font-semibold leading-[25px] text-white">
                  {config.region.title}
                  <span aria-hidden className="text-accent">
                    ◉
                  </span>
                </h2>

                <label
                  htmlFor="region"
                  className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim"
                >
                  {config.region.label}
                </label>

                <select
                  id="region"
                  value={region}
                  disabled={regionsState.status === "loading" || regionsState.status === "error"}
                  onChange={(event) => update("geography", { region: event.target.value })}
                  className={cn(
                    "w-full rounded-field border border-line-strong bg-deep px-[16px] py-[12px]",
                    "font-sans text-[13px] focus:border-accent focus:outline-none",
                    region ? "text-ink" : "text-ink-faint",
                  )}
                >
                  <option value="" disabled>
                    {config.region.placeholder}
                  </option>
                  {regions?.map((item) => (
                    <option key={item.id} value={item.id} className="bg-deep text-ink">
                      {item.label}
                    </option>
                  ))}
                </select>

                {regionsState.status === "loading" ? (
                  <p className="font-sans text-[11px] text-ink-faint">Loading available regions…</p>
                ) : null}
                {regionsState.status === "error" ? (
                  <div className="flex items-center justify-between gap-[10px] rounded-field border border-red-400/30 bg-red-400/10 p-[10px]">
                    <p role="alert" className="font-sans text-[11px] text-red-300">Unable to load regions.</p>
                    <button type="button" onClick={() => void retryRegions()} className="font-mono text-[10px] uppercase text-accent hover:underline">Retry</button>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-[10px]">
                  <Fact label={config.region.powerLabel} value={selectedRegion?.availablePower} />
                  <Fact label={config.region.coolingLabel} value={selectedRegion?.coolingType} dot />
                </div>
              </div>
            </Reveal>

            {/* Go-live */}
            <Reveal delay={80}>
              <div className="card-highlight flex flex-col gap-[14px] rounded-card border border-line-hair bg-card p-[22px]">
                <h2 className="flex items-center gap-[8px] font-sans text-[17px] font-semibold leading-[25px] text-white">
                  {config.goLive.title}
                  <span aria-hidden className="text-accent">
                    ▦
                  </span>
                </h2>

                <label
                  htmlFor="go-live"
                  className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim"
                >
                  {config.goLive.label}
                </label>

                <input
                  id="go-live"
                  type="date"
                  value={targetGoLive}
                  onChange={(event) =>
                    update("geography", { targetGoLive: event.target.value })
                  }
                  className="w-full rounded-field border border-line-strong bg-deep px-[16px] py-[12px] font-sans text-[13px] text-ink focus:border-accent focus:outline-none"
                />

                {schedule?.expediteWarning ? (
                  <p
                    role="status"
                    className="rounded-field border border-accent/30 bg-accent-soft p-[12px] font-sans text-[11px] leading-[17px] text-accent"
                  >
                    ⓘ {schedule.expediteWarning}
                  </p>
                ) : null}
              </div>
            </Reveal>
          </div>

          {/* Gantt */}
          <Reveal delay={140}>
            <div
              data-circuit-attract
              className="card-highlight flex flex-col gap-[16px] rounded-card border border-line-hair bg-card p-[22px]"
            >
              <div className="flex items-center justify-between gap-[12px]">
                <h2 className="flex items-center gap-[8px] font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">
                  <span aria-hidden className="text-accent">
                    ▤
                  </span>
                  {config.gantt.title}
                </h2>
                <span className="flex items-center gap-[6px] font-mono text-[9px] uppercase tracking-[1.1px] text-accent">
                  <span aria-hidden className="pulse-dot size-[5px] rounded-full bg-accent" />
                  {config.gantt.badge}
                </span>
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-[8px] border-b border-line-soft pb-[8px] font-mono text-[9px] uppercase tracking-[1.1px] text-ink-mute">
                <span className="w-[38%] shrink-0">{config.gantt.phaseHeader}</span>
                <span className="flex flex-1 justify-between">
                  {config.gantt.months.map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                  <span className="text-accent">{config.gantt.goLiveHeader}</span>
                </span>
              </div>

              <ol className="flex flex-col gap-[10px]">
                {state.status === "loading" ? (
                  <li className="py-[28px] text-center font-sans text-[12px] text-ink-faint">Calculating delivery schedule…</li>
                ) : null}
                {state.status === "error" ? (
                  <li className="flex items-center justify-between gap-[10px] rounded-field border border-red-400/30 bg-red-400/10 p-[12px]">
                    <span role="alert" className="font-sans text-[11px] text-red-300">Unable to calculate schedule.</span>
                    <button type="button" onClick={() => void run()} className="font-mono text-[10px] uppercase text-accent hover:underline">Retry</button>
                  </li>
                ) : null}
                {schedule?.phases.map((phase) => (
                  <li key={phase.label} className="flex items-center gap-[8px]">
                    <span className="w-[38%] shrink-0">
                      <span
                        className={cn(
                          "block font-sans text-[11px] leading-[16px]",
                          phase.status === "active" ? "text-accent" : "text-ink",
                        )}
                      >
                        {phase.label}
                      </span>
                      <span className="block font-sans text-[9px] leading-[13px] text-ink-faint">
                        {phase.detail}
                      </span>
                    </span>

                    <span className="relative h-[16px] flex-1 overflow-hidden rounded-full bg-raised">
                      <span
                        className={cn(
                          "absolute inset-y-0 rounded-full transition-all duration-500",
                          phase.status === "active" ? "bg-accent/70" : "bg-muted",
                        )}
                        style={{
                          left: `${(phase.startMonth / 5) * 100}%`,
                          width: `${(phase.durationMonths / 5) * 100}%`,
                        }}
                      />
                    </span>
                  </li>
                ))}
                {!schedule && state.status !== "loading" && state.status !== "error" ? (
                  <li className="py-[28px] text-center font-sans text-[12px] leading-[19px] text-ink-faint">
                    Select a region and target go-live date to generate the schedule.
                  </li>
                ) : null}
              </ol>

              <div className="flex flex-wrap items-center justify-between gap-[12px] border-t border-line-soft pt-[12px]">
                <span className="flex items-center gap-[14px] font-mono text-[9px] uppercase tracking-[1.1px] text-ink-dim">
                  <span className="flex items-center gap-[6px]">
                    <span aria-hidden className="size-[8px] rounded-[2px] bg-accent/70" />
                    {config.gantt.legend.active}
                  </span>
                  <span className="flex items-center gap-[6px]">
                    <span aria-hidden className="size-[8px] rounded-[2px] bg-muted" />
                    {config.gantt.legend.pending}
                  </span>
                </span>

                <span
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-[1.1px]",
                    schedule && schedule.criticalPathDelayDays > 0 ? "text-amber-300" : "text-ink-dim",
                  )}
                >
                  {config.gantt.delayLabel}: {schedule?.criticalPathDelayDays ?? 0} DAYS
                </span>
              </div>
            </div>
          </Reveal>
        </div>

        <FlowNav
          backLabel={config.back}
          backHref="/hyperscale/capacity"
          nextLabel={config.next}
          nextHref="/hyperscale/rfp"
          disabled={!complete}
        />
      </main>

      <Footer />
    </>
  );
}

function Fact({ label, value, dot }: { label: string; value?: string; dot?: boolean }) {
  return (
    <div className="rounded-field border border-line-soft bg-surface px-[12px] py-[10px]">
      <p className="font-mono text-[8px] uppercase tracking-[1.1px] text-ink-mute">{label}</p>
      <p className="flex items-center gap-[6px] pt-[4px] font-sans text-[12px] leading-[18px] text-accent">
        {dot && value ? <span aria-hidden className="size-[5px] rounded-full bg-accent" /> : null}
        {value ?? "—"}
      </p>
    </div>
  );
}
