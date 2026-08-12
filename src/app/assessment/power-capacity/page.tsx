"use client";

import {
  AssessmentFooter,
  AssessmentHeader,
  StepHeader,
  StepNav,
} from "@/components/assessment/AssessmentChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useAssessment } from "@/controllers/AssessmentContext";
import { ASSESSMENT_TOTAL_STEPS, STEP_POWER_CAPACITY } from "@/config/assessment";
import type { GridTier, LineVoltage, SubstationDistance } from "@/models/assessment";
import { cn } from "@/lib/cn";

/**
 * Step 2 — Power Capacity. Figma node 2:1207, transcribed from `capacary.png`.
 *
 * The Live Output panel is shown in its EMPTY state in the design: em-dashes
 * for density and CapEx, with "Pending" chips. That empty state is reproduced
 * faithfully and only fills in once the backend preview endpoint returns real
 * figures — no numbers are invented client-side for infrastructure cost.
 */
export default function PowerCapacityPage() {
  const { draft, update, preview } = useAssessment();
  const config = STEP_POWER_CAPACITY;

  const values: Record<string, string> = {
    megawatts: draft.powerCapacity?.gridTier ?? "",
    substation: draft.powerCapacity?.substationDistance ?? "",
    voltage: draft.powerCapacity?.voltage ?? "",
  };

  function handleChange(fieldId: string, value: string) {
    switch (fieldId) {
      case "megawatts":
        update("powerCapacity", { gridTier: value as GridTier });
        break;
      case "substation":
        update("powerCapacity", { substationDistance: value as SubstationDistance });
        break;
      case "voltage":
        update("powerCapacity", { voltage: value as LineVoltage });
        break;
    }
  }

  const answered = Object.values(values).filter(Boolean).length;
  const canContinue = answered === config.fields.length;

  const capexLabel =
    preview.infrastructureCapexUsd !== undefined
      ? `$${(preview.infrastructureCapexUsd / 1_000_000).toFixed(1)}M`
      : config.output.capex.empty;

  return (
    <>
      <AssessmentHeader exitHref="/" exitLabel="Exit assessment" />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[40px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal>
          <StepHeader
            eyebrow={config.eyebrow}
            title={config.title}
            step={2}
            total={ASSESSMENT_TOTAL_STEPS}
            percentLabel={config.percentLabel}
          />
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.3fr_1fr]">
          {/* Parameters */}
          <Reveal>
            <div className="card-highlight flex flex-col gap-[24px] rounded-card border border-line-hair bg-card p-[25px]">
              <h2 className="font-sans text-[18px] font-medium leading-[26px] text-white">
                {config.cardTitle}
              </h2>

              {config.fields.map((field) => (
                <div key={field.id} className="flex flex-col gap-[8px]">
                  <label
                    htmlFor={field.id}
                    className="flex items-center gap-[8px] font-sans text-[13px] leading-[20px] text-ink"
                  >
                    <span aria-hidden className="size-[6px] rounded-full bg-accent" />
                    {field.label}
                  </label>

                  <select
                    id={field.id}
                    value={values[field.id] ?? ""}
                    onChange={(event) => handleChange(field.id, event.target.value)}
                    className={cn(
                      "w-full rounded-field border border-line-strong bg-deep px-[17px] py-[13px]",
                      "font-sans text-[14px] focus:border-accent focus:outline-none",
                      values[field.id] ? "text-ink" : "text-ink-faint",
                    )}
                  >
                    <option value="" disabled>
                      {field.placeholder}
                    </option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value} className="bg-deep text-ink">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Reveal>

          {/* Live output — empty state, exactly as designed */}
          <Reveal delay={100}>
            <div
              data-circuit-attract
              className="relative flex flex-col gap-[20px] overflow-hidden rounded-card border border-accent/40 bg-glass p-[25px] backdrop-blur-card"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-[64px] -top-[64px] size-[160px] rounded-full bg-accent/10 blur-[40px]"
              />

              <div className="relative flex items-center justify-between gap-[12px]">
                <p className="flex items-center gap-[8px] font-sans text-[14px] leading-[20px] text-white">
                  <span aria-hidden className="pulse-dot size-[8px] rounded-full bg-accent" />
                  {config.output.title}
                </p>
                <span className="rounded-field border border-accent-line bg-accent-soft px-[9px] py-[4px] font-mono text-[10px] uppercase tracking-[1.2px] text-accent">
                  {config.output.badge}
                </span>
              </div>

              <div className="relative flex flex-col items-center gap-[8px] rounded-panel border border-line-soft bg-surface p-[20px] text-center">
                <p className="font-sans text-[12px] leading-[18px] text-ink-dim">
                  {config.output.density.label}
                </p>
                <p className="flex items-baseline gap-[2px]">
                  <span className="font-sans text-[32px] font-bold leading-[40px] text-accent">
                    {preview.mwDensity ?? config.output.density.empty}
                  </span>
                  <span className="font-sans text-[16px] text-ink-dim">
                    {config.output.density.unit}
                  </span>
                </p>
                {preview.mwDensity === undefined ? (
                  <p className="font-sans text-[11px] leading-[16px] text-ink-faint">
                    {config.output.density.hint}
                  </p>
                ) : null}
              </div>

              <div className="relative flex flex-col items-center gap-[12px] rounded-panel border border-line-soft bg-surface p-[20px] text-center">
                <p className="font-sans text-[12px] leading-[18px] text-ink-dim">
                  {config.output.capex.label}
                </p>
                <p className="font-sans text-[32px] font-bold leading-[40px] text-accent">
                  {capexLabel}
                </p>
                <div className="flex flex-wrap justify-center gap-[8px]">
                  {config.output.capex.chips.map((chip) => {
                    // "Substation: Pending" → look up "substation" in the
                    // server's breakdown so the chip reflects real state.
                    const key = chip.split(":")[0]?.trim().toLowerCase() ?? "";
                    const status = preview.capexBreakdown?.[key];
                    const label = status ? `${chip.split(":")[0]}: ${status}` : chip;

                    return (
                      <span
                        key={chip}
                        className={cn(
                          "rounded-field border px-[9px] py-[4px] font-mono text-[10px] capitalize tracking-[0.6px]",
                          status && status !== "pending"
                            ? "border-accent-line text-accent"
                            : "border-line-soft text-ink-dim",
                        )}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <p className="relative text-center font-mono text-[10px] uppercase tracking-[1.2px] text-ink-faint">
                ⟳ {config.output.footnote}
              </p>
            </div>
          </Reveal>
        </div>

        <StepNav
          backLabel={config.back}
          backHref="/assessment/land-profile"
          nextLabel={config.next}
          nextHref="/assessment/energy-source"
          disabled={!canContinue}
        />
      </main>

      <AssessmentFooter note="Assessment Module v3.4" />
    </>
  );
}
