"use client";

import {
  AssessmentFooter,
  AssessmentHeader,
  StepNav,
} from "@/components/assessment/AssessmentChrome";
import { Reveal } from "@/components/motion/Reveal";
import { ProgressHeader } from "@/components/wizard/ProgressHeader";
import { Card, CardHeading } from "@/components/ui/Card";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { StatRow } from "@/components/ui/StatRow";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/states";
import { useAssessment } from "@/controllers/AssessmentContext";
import { ASSESSMENT_TOTAL_STEPS } from "@/config/assessment";
import type { EnergyMix } from "@/models/assessment";

/**
 * Step 3 — Energy Source. Figma node 2:1020 / 2:1031.
 *
 * This is the one assessment screen exported through the Figma MCP at full
 * fidelity, so the components it uses (ProgressHeader, Card, SelectableCard,
 * Toggle, ScoreGauge, StatRow) carry exact measurements from the design.
 *
 * The Live Output panel is driven by `api.assessment.preview`, recomputed
 * whenever the energy mix or PPA toggle changes.
 */

/** Radio options — Figma nodes 2:1061 / 2:1072 / 2:1083. */
const ENERGY_OPTIONS: ReadonlyArray<{ value: EnergyMix; title: string; description: string }> = [
  {
    value: "standard_grid",
    title: "Standard Grid",
    description: "Local utility mix. High baseline emissions depending on region.",
  },
  {
    value: "renewable_100",
    title: "100% Renewable",
    description: "Direct wind/solar/hydro. Zero Scope 2 emissions.",
  },
  {
    value: "hybrid",
    title: "Hybrid Mix",
    description: "Blended supply with on-site generation or offsets.",
  },
];

export default function EnergySourcePage() {
  const { draft, update, preview, previewLoading, previewError } = useAssessment();

  const energyMix = draft.energySource?.energyMix;
  const ppaAvailable = draft.energySource?.ppaAvailable ?? false;

  // The ESG block only renders once the server has returned a grade.
  const hasEsg = preview.esgScore !== undefined && preview.esgPercent !== undefined;

  return (
    <>
      <AssessmentHeader exitHref="/" exitLabel="Exit assessment" />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[40px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal>
          <ProgressHeader
            eyebrow="Infrastructure Assessment"
            title="Energy Source"
            stepNumber={3}
            totalSteps={ASSESSMENT_TOTAL_STEPS}
            stepLabel="Energy Mix & PPA"
          />
        </Reveal>

        <div className="grid grid-cols-1 gap-grid lg:grid-cols-12">
          <div className="flex flex-col gap-grid lg:col-span-8">
            <Reveal>
              <Card interactive className="flex flex-col gap-section">
                <CardHeading
                  title="Energy Mix Configuration"
                  description="Select the primary power sources supplying your infrastructure to calculate environmental impact."
                />

                <fieldset className="flex flex-col gap-[16px] sm:flex-row">
                  <legend className="sr-only">Energy mix</legend>
                  {ENERGY_OPTIONS.map((option) => (
                    <SelectableCard
                      key={option.value}
                      name="energy-mix"
                      value={option.value}
                      checked={energyMix === option.value}
                      onChange={(value) =>
                        update("energySource", { energyMix: value as EnergyMix })
                      }
                      title={option.title}
                      description={option.description}
                      className="flex-1"
                    />
                  ))}
                </fieldset>
              </Card>
            </Reveal>

            <Reveal delay={80}>
              <Card interactive className="flex items-center justify-between gap-[24px]">
                <CardHeading
                  title="PPA Available?"
                  description="Do you have an active Power Purchase Agreement (PPA) in place for renewable energy credits?"
                />
                <Toggle
                  checked={ppaAvailable}
                  onChange={(checked) => update("energySource", { ppaAvailable: checked })}
                  label="Power Purchase Agreement available"
                />
              </Card>
            </Reveal>
          </div>

          {/* Live preview — Figma node 2:1106 */}
          <Reveal delay={140} className="lg:col-span-4">
            <div
              data-circuit-attract
              className="relative flex h-full flex-col overflow-hidden rounded-card border border-line-card bg-surface p-card backdrop-blur-card"
            >
              <div aria-hidden className="ambient-orb orb-drift absolute -right-[128px] -top-[128px]" />

              <div className="relative flex items-center justify-between border-b border-line pb-[9px]">
                <p className="font-serif text-label text-ink">Live Output</p>
                <Badge variant="status">Synced</Badge>
              </div>

              {previewError ? (
                <p role="alert" className="relative py-[40px] text-center font-serif text-label text-red-400">
                  {previewError.message}
                </p>
              ) : previewLoading && !hasEsg ? (
                <div className="relative flex flex-1 items-center justify-center py-[40px]">
                  <LoadingState label="Calculating" />
                </div>
              ) : !hasEsg ? (
                <div className="relative flex flex-1 items-center justify-center py-[40px]">
                  <p className="max-w-[220px] text-center font-serif text-label text-ink-dim">
                    Select an energy mix to calculate environmental impact.
                  </p>
                </div>
              ) : (
                <div className="relative flex flex-col gap-section py-[40px]">
                  <div className="flex flex-col items-center gap-[8px]">
                    <p className="font-serif text-label uppercase text-ink-dim">Est. ESG Score</p>
                    <ScoreGauge grade={preview.esgScore!} percent={preview.esgPercent!} />
                  </div>

                  <div className="flex flex-col gap-[8px]">
                    <StatRow
                      label="Carbon Footprint"
                      value={
                        preview.carbonFootprintTco2e !== undefined
                          ? `~${preview.carbonFootprintTco2e}`
                          : "—"
                      }
                      unit="tCO2e/yr"
                    />
                    <StatRow
                      label="Renewable Ratio"
                      value={
                        preview.renewableRatioPercent !== undefined
                          ? `${preview.renewableRatioPercent}%`
                          : "—"
                      }
                      emphasis
                    />
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        <StepNav
          backLabel="Back: Power Capacity"
          backHref="/assessment/power-capacity"
          nextLabel="Continue: Facilities"
          nextHref="/assessment/facilities"
          disabled={!energyMix}
        />
      </main>

      <AssessmentFooter />
    </>
  );
}
