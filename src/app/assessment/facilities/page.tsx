"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AssessmentFooter,
  AssessmentHeader,
  StepHeader,
  StepNav,
} from "@/components/assessment/AssessmentChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useAssessment } from "@/controllers/AssessmentContext";
import { useAuth } from "@/controllers/AuthContext";
import { ASSESSMENT_TOTAL_STEPS, STEP_FACILITIES } from "@/config/assessment";
import type {
  AssessmentSubmission,
  BuildingClassification,
  FiberProximity,
} from "@/models/assessment";
import { toLandIntakeData } from "@/models/assessment";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 4 — Facilities & Infrastructure.
 *
 * ⚠ Built from the written system report rather than a Figma export; see the
 * note on STEP_FACILITIES in config/assessment.ts.
 *
 * This is the last input step, so it also submits the assessment. Every metric
 * in the telemetry panel comes from the backend preview — nothing is computed
 * here, and each metric renders an em-dash until the server returns it.
 */
export default function FacilitiesPage() {
  const router = useRouter();
  const { draft, update, preview, previewLoading } = useAssessment();
  const { isAuthenticated, initializing: authInitializing, profile } = useAuth();
  const config = STEP_FACILITIES;

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const sqft = draft.facilities?.buildingSqft;
  const classification = draft.facilities?.buildingClassification;
  const fiber = draft.facilities?.fiberProximity;

  // Zero is a valid footprint (bare land), so check for undefined explicitly.
  const canSubmit = sqft !== undefined && Boolean(classification) && Boolean(fiber);

  async function handleSubmit() {
    if (!canSubmit) return;
    if (authInitializing) {
      setSubmitError("Đang xác thực tài khoản Panda Cloud. Vui lòng thử lại sau giây lát.");
      return;
    }
    if (!isAuthenticated || !profile) {
      router.push(`/login?returnTo=${encodeURIComponent("/assessment/facilities")}`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    try {
      const submission = draft as AssessmentSubmission;
      const session = await api.assessment.createSession({
        assessmentType: "land",
        landIntakeData: toLandIntakeData(submission),
        clientRequestId: crypto.randomUUID(),
      });
      router.push(`/assessment/ai?sessionId=${encodeURIComponent(session.session.sessionId)}`);
    } catch (cause) {
      setSubmitError(normalizeError(cause).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <AssessmentHeader exitHref="/" exitLabel="Exit assessment" />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[40px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal>
          <StepHeader
            eyebrow={config.eyebrow}
            title={config.title}
            step={4}
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

              <div className="flex flex-col gap-[8px]">
                <label
                  htmlFor="building-sqft"
                  className="flex items-center gap-[8px] font-sans text-[13px] leading-[20px] text-ink"
                >
                  <span aria-hidden className="size-[6px] rounded-full bg-accent" />
                  {config.sqft.label}
                </label>

                <div className="relative">
                  <input
                    id="building-sqft"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder={config.sqft.placeholder}
                    value={sqft ?? ""}
                    onChange={(event) =>
                      update("facilities", {
                        buildingSqft: event.target.value === "" ? undefined : Number(event.target.value),
                      })
                    }
                    className="w-full rounded-field border border-line-strong bg-deep px-[17px] py-[13px] pr-[72px] font-sans text-[16px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <span className="pointer-events-none absolute right-[17px] top-1/2 -translate-y-1/2 font-mono text-[11px] uppercase tracking-[1.2px] text-ink-dim">
                    {config.sqft.suffix}
                  </span>
                </div>

                <p className="font-sans text-[12px] leading-[18px] text-ink-faint">
                  {config.sqft.hint}
                </p>
              </div>

              <SelectField
                id="building-classification"
                label={config.classification.label}
                placeholder={config.classification.placeholder}
                options={config.classification.options}
                value={classification ?? ""}
                onChange={(value) =>
                  update("facilities", {
                    buildingClassification: value as BuildingClassification,
                  })
                }
              />

              <SelectField
                id="fiber-proximity"
                label={config.fiber.label}
                placeholder={config.fiber.placeholder}
                options={config.fiber.options}
                value={fiber ?? ""}
                onChange={(value) =>
                  update("facilities", { fiberProximity: value as FiberProximity })
                }
              />
            </div>
          </Reveal>

          {/* Telemetry */}
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
                {previewLoading ? (
                  <span className="rounded-field border border-accent-line bg-accent-soft px-[9px] py-[4px] font-mono text-[10px] uppercase tracking-[1.2px] text-accent">
                    {config.output.badge}
                  </span>
                ) : null}
              </div>

              <div className="relative flex flex-col items-center gap-[10px] rounded-panel border border-line-soft bg-surface p-[20px] text-center">
                <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">
                  {config.output.readinessLabel}
                </p>
                <p className="flex items-baseline gap-[2px]">
                  <span className="font-sans text-[44px] font-bold leading-[52px] text-accent [text-shadow:0px_0px_16px_rgba(0,242,255,0.4)]">
                    {preview.facilityReadiness ?? "—"}
                  </span>
                  <span className="font-sans text-[16px] text-ink-dim">/100</span>
                </p>
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full bg-accent shadow-accent-bar transition-[width] duration-500 ease-out"
                    style={{ width: `${preview.facilityReadiness ?? 0}%` }}
                  />
                </div>
              </div>

              <dl className="relative flex flex-col gap-[8px]">
                <Metric
                  label={config.output.metrics.pue.label}
                  value={preview.projectedPue?.toFixed(2) ?? config.output.metrics.pue.empty}
                />
                <Metric
                  label={config.output.metrics.density.label}
                  value={
                    preview.rackDensityKw !== undefined
                      ? `${preview.rackDensityKw} ${config.output.metrics.density.unit}`
                      : config.output.metrics.density.empty
                  }
                />
                <Metric
                  label={config.output.metrics.network.label}
                  value={preview.networkCapacity ?? config.output.metrics.network.empty}
                  emphasis
                />
              </dl>

              <p className="relative text-center font-mono text-[10px] uppercase tracking-[1.2px] text-ink-faint">
                ⟳ {config.output.footnote}
              </p>
            </div>
          </Reveal>
        </div>

        {submitError ? (
          <p role="alert" className="font-sans text-[13px] text-red-400">
            {submitError}
          </p>
        ) : null}

        <StepNav
          backLabel={config.back}
          backHref="/assessment/energy-source"
          nextLabel={submitting ? "Generating report…" : config.next}
          onNext={handleSubmit}
          disabled={!canSubmit || submitting}
        />
      </main>

      <AssessmentFooter note="Assessment Module v3.4" />
    </>
  );
}

function SelectField({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <label
        htmlFor={id}
        className="flex items-center gap-[8px] font-sans text-[13px] leading-[20px] text-ink"
      >
        <span aria-hidden className="size-[6px] rounded-full bg-accent" />
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full rounded-field border border-line-strong bg-deep px-[17px] py-[13px]",
          "font-sans text-[14px] focus:border-accent focus:outline-none",
          value ? "text-ink" : "text-ink-faint",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-deep text-ink">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Metric({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-field border border-line-faint bg-surface px-[12px] py-[10px]">
      <dt className="font-sans text-[12px] leading-[18px] text-ink-dim">{label}</dt>
      <dd
        className={cn(
          "font-sans text-[13px] font-medium leading-[18px]",
          emphasis ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
