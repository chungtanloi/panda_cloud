"use client";

import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import {
  AssessmentFooter,
  AssessmentHeader,
  StepNav,
} from "@/components/assessment/AssessmentChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useAssessment } from "@/controllers/AssessmentContext";
import { STEP_LAND_PROFILE } from "@/config/assessment";
import type { LandUseType } from "@/models/assessment";


/**
 * Step 1 — Land Profile. Figma node 2:1325, transcribed from `step_1.png`.
 *
 * This step uses its own header treatment (a caption plus a solid accent
 * underline) rather than the eyebrow/percentage header used by steps 2 and 3 —
 * that difference is in the design, not an oversight here.
 *
 * The Live Output panel is computed locally from the two inputs so the screen
 * responds immediately. The authoritative score comes from
 * `api.assessment.preview` once the backend implements it; the local maths
 * mirrors the shape the contract specifies.
 */
export default function LandProfilePage() {
  const { draft, update, preview } = useAssessment();
  const config = STEP_LAND_PROFILE;

  const acres = draft.landProfile?.areaAcres ?? 0;
  const zoning = draft.landProfile?.landUse;

  // Computed by the backend from the draft — see AssessmentContext.
  const score = preview.landViabilityScore ?? 0;
  const factors = preview.landFactors ?? config.output.bars.map((bar) => ({ ...bar, value: "—" }));

  const canContinue = acres > 0 && Boolean(zoning);

  return (
    <>
      <AssessmentHeader status="SYS OP" />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[32px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[12px]">
          <div className="flex flex-wrap items-end justify-between gap-[16px]">
            <h1 className="font-sans text-[32px] font-semibold leading-[40px] tracking-[-0.8px] text-white">
              {config.title}
            </h1>

            <div className="flex flex-col items-end gap-[2px] text-right font-mono text-[10px] uppercase leading-[14px] tracking-[1.2px] text-ink-mute">
              {config.statusRight.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-[8px]">
            <p className="font-mono text-[11px] uppercase leading-[12px] tracking-[1.2px] text-accent">
              {config.statusLeft}
            </p>
            <span aria-hidden className="h-[2px] w-[220px] rounded-full bg-accent shadow-accent-bar" />
          </div>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.4fr_1fr]">
          {/* Inputs */}
          <Reveal>
            <div className="card-highlight flex flex-col gap-[24px] rounded-card border border-line-hair bg-card p-[25px]">
              <div className="flex flex-col gap-[8px]">
                <label
                  htmlFor="land-size"
                  className="font-mono text-[11px] uppercase leading-[14px] tracking-[1.2px] text-ink-dim"
                >
                  &gt; {config.fields.size.label}
                </label>
                <div className="relative">
                  <input
                    id="land-size"
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder={config.fields.size.placeholder}
                    value={acres || ""}
                    onChange={(event) =>
                      update("landProfile", { areaAcres: Number(event.target.value) || 0 })
                    }
                    className="w-full rounded-full border border-line-strong bg-deep px-[20px] py-[14px] pr-[56px] font-sans text-[18px] text-ink placeholder:text-ink-faint focus:border-accent"
                  />
                  <span className="pointer-events-none absolute right-[20px] top-1/2 -translate-y-1/2 font-mono text-[12px] uppercase tracking-[1.2px] text-ink-dim">
                    {config.fields.size.suffix}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-[8px]">
                <label
                  htmlFor="zoning-type"
                  className="font-mono text-[11px] uppercase leading-[14px] tracking-[1.2px] text-ink-dim"
                >
                  &gt; {config.fields.zoning.label}
                </label>
                <select
                  id="zoning-type"
                  value={zoning ?? ""}
                  onChange={(event) =>
                    update("landProfile", { landUse: event.target.value as LandUseType })
                  }
                  className="w-full rounded-full border border-line-strong bg-deep px-[20px] py-[14px] font-sans text-[16px] text-ink focus:border-accent"
                >
                  <option value="" disabled>
                    Select zoning type…
                  </option>
                  {config.fields.zoning.options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-deep">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative overflow-hidden rounded-panel border border-line-soft">
                <AssetPlaceholder
                  node="2:1325 map"
                  label="Terrain map"
                  src="/assets/visuals/energy-land-campus.png"
                  alt="Aerial view of industrial land, renewable energy and grid infrastructure"
                  className="aspect-[16/7] w-full"
                />
                <span className="absolute bottom-[10px] left-[12px] font-mono text-[10px] uppercase tracking-[1.2px] text-accent">
                  ▲ {config.mapCaption}
                </span>
              </div>
            </div>
          </Reveal>

          {/* Live output */}
          <Reveal delay={100}>
            <div
              data-circuit-attract
              className="relative flex flex-col gap-[20px] overflow-hidden rounded-card border border-accent/40 bg-glass p-[25px] backdrop-blur-card"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-[64px] -top-[64px] size-[160px] rounded-full bg-accent/10 blur-[40px]"
              />

              <p className="relative flex items-center gap-[8px] font-mono text-[11px] uppercase leading-[12px] tracking-[1.2px] text-accent">
                <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
                {config.output.title}
              </p>

              <div className="relative flex flex-col gap-[4px]">
                <p className="font-mono text-[11px] uppercase leading-[14px] tracking-[1.2px] text-ink-dim">
                  {config.output.scoreLabel}
                </p>
                <p className="flex items-baseline gap-[4px]">
                  <span className="font-sans text-[48px] font-bold leading-[56px] text-accent [text-shadow:0px_0px_16px_rgba(0,242,255,0.4)]">
                    {score}
                  </span>
                  <span className="font-sans text-[18px] text-ink-dim">/100</span>
                </p>
              </div>

              <div className="relative flex flex-col gap-[12px]">
                {factors.map((bar, index) => (
                  <div key={bar.label} className="flex flex-col gap-[6px]">
                    <div className="flex items-center justify-between font-sans text-[12px] leading-[18px]">
                      <span className="text-ink-dim">{bar.label}</span>
                      <span className="text-accent">{bar.value}</span>
                    </div>
                    <div className="h-[3px] w-full overflow-hidden rounded-full bg-raised">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
                        style={{ width: `${Math.min(100, score - index * 15)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative flex flex-col gap-[4px] border-t border-line-soft pt-[16px] font-mono text-[11px] leading-[18px] text-ink-dim">
                {config.output.terminal.map((line) => (
                  <span key={line}>
                    {line.includes("OPTIMAL") ? (
                      <>
                        {line.split("OPTIMAL")[0]}
                        <span className="text-accent">OPTIMAL</span>
                        {line.split("OPTIMAL")[1]}
                      </>
                    ) : (
                      line
                    )}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <StepNav
          backLabel={config.back}
          backHref="/assessment"
          nextLabel={config.next}
          nextHref="/assessment/power-capacity"
          disabled={!canContinue}
        />
      </main>

      <AssessmentFooter />
    </>
  );
}
