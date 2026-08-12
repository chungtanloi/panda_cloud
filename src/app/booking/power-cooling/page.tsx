"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { Reveal } from "@/components/motion/Reveal";
import { useBooking } from "@/controllers/BookingContext";
import { STEP_POWER_COOLING, type OptionCard } from "@/config/booking";
import type { CoolingTechnology, DeploymentModel, SlaTier } from "@/models/booking";
import { cn } from "@/lib/cn";

/**
 * Step 4 — Power & Cooling. Transcribed from `power.png`.
 *
 * Air cooling is styled as discouraged in the design ("Not recommended for
 * H100 density"). It stays selectable — the user may have a reason — but is
 * visually de-emphasised and explains itself on selection, rather than being
 * silently disabled.
 */
export default function PowerCoolingPage() {
  const { draft, update, selectedModel } = useBooking();
  const config = STEP_POWER_COOLING;

  const deploymentModel = draft.powerCooling?.deploymentModel;
  const cooling = draft.powerCooling?.cooling;
  const sla = draft.powerCooling?.sla ?? "enterprise";

  const complete = Boolean(deploymentModel && cooling);
  const gpuCount = draft.scale?.gpuCount;

  const discouragedCooling = config.cooling.options.find(
    (option) => option.value === cooling && option.discouraged,
  );

  return (
    <>
      <TopNavBar />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[28px] px-[24px] py-[40px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[10px]">
          <h1 className="font-sans text-[34px] font-bold leading-[42px] tracking-[-0.9px] text-white">
            {config.title}
          </h1>
          <p className="max-w-[660px] font-sans text-[14px] leading-[22px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[20px]">
            <Reveal>
              <OptionGroup
                title={config.deployment.title}
                icon="▤"
                options={config.deployment.options}
                value={deploymentModel}
                onChange={(value) =>
                  update("powerCooling", { deploymentModel: value as DeploymentModel })
                }
              />
            </Reveal>

            <Reveal delay={80}>
              <OptionGroup
                title={config.cooling.title}
                icon="❄"
                options={config.cooling.options}
                value={cooling}
                onChange={(value) =>
                  update("powerCooling", { cooling: value as CoolingTechnology })
                }
              />
            </Reveal>

            {discouragedCooling ? (
              <p
                role="status"
                className="rounded-field border border-amber-400/30 bg-amber-400/10 px-[14px] py-[10px] font-sans text-[12px] leading-[18px] text-amber-200"
              >
                ⚠ {discouragedCooling.discouragedReason}
              </p>
            ) : null}
          </div>

          {/* Summary */}
          <Reveal delay={140}>
            <div
              data-circuit-attract
              className="card-highlight flex flex-col gap-[18px] rounded-card border border-line-hair bg-card p-[24px]"
            >
              <h2 className="font-sans text-[15px] font-medium leading-[22px] text-white">
                {config.summary.title}
              </h2>

              <dl className="flex flex-col gap-[2px]">
                <SummaryRow
                  label={config.summary.rows.cluster}
                  value={
                    selectedModel && gpuCount
                      ? `${gpuCount}x NVIDIA ${selectedModel.name}`
                      : "—"
                  }
                />
                <SummaryRow
                  label={config.summary.rows.deployment}
                  value={labelFor(config.deployment.options, deploymentModel)}
                />
                <SummaryRow
                  label={config.summary.rows.cooling}
                  value={labelFor(config.cooling.options, cooling)}
                />
              </dl>

              <fieldset className="flex flex-col gap-[10px] rounded-panel border border-line-soft bg-surface p-[16px]">
                <legend className="flex items-center gap-[8px] px-[4px] font-sans text-[12px] font-medium leading-[18px] text-accent">
                  <span aria-hidden>✓</span>
                  {config.summary.slaTitle}
                </legend>

                {config.summary.slaOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-[10px] rounded-field px-[8px] py-[7px] transition-colors hover:bg-white/[0.03]"
                  >
                    <input
                      type="radio"
                      name="sla"
                      value={option.value}
                      checked={sla === option.value}
                      onChange={() => update("powerCooling", { sla: option.value as SlaTier })}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-[16px] shrink-0 place-items-center rounded-full border",
                        sla === option.value ? "border-accent" : "border-line-strong",
                      )}
                    >
                      {sla === option.value ? (
                        <span className="size-[7px] rounded-full bg-accent" />
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "font-sans text-[12px] leading-[18px]",
                        sla === option.value ? "text-accent" : "text-ink-dim",
                      )}
                    >
                      {option.label}
                    </span>
                  </label>
                ))}
              </fieldset>

              <Link
                href="/booking/review"
                aria-disabled={!complete}
                className={cn(
                  "mt-auto inline-flex w-full items-center justify-center gap-[8px] rounded-full bg-accent px-[20px] py-[13px]",
                  "font-sans text-[12px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg",
                  "transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
                  !complete && "pointer-events-none opacity-40",
                )}
              >
                {config.next}
              </Link>
            </div>
          </Reveal>
        </div>

        <nav className="flex items-center pt-[8px]">
          <Link
            href="/booking/scale"
            className="inline-flex items-center gap-[8px] rounded-full border border-line-strong px-[22px] py-[11px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>←</span>
            {config.back}
          </Link>
        </nav>
      </main>

      <Footer />
    </>
  );
}

function OptionGroup<T extends string>({
  title,
  icon,
  options,
  value,
  onChange,
}: {
  title: string;
  icon: string;
  options: readonly OptionCard<T>[];
  value: T | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="card-highlight flex flex-col gap-[16px] rounded-card border border-line-hair bg-card p-[24px]">
      <legend className="flex items-center gap-[8px] font-sans text-[16px] font-medium leading-[24px] text-white">
        <span aria-hidden className="text-accent">
          {icon}
        </span>
        {title}
      </legend>

      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer flex-col gap-[8px] rounded-panel border p-[16px] transition-colors",
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-line-soft bg-surface hover:border-accent/40",
                option.discouraged && !selected && "opacity-55",
              )}
            >
              <input
                type="radio"
                name={title}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              <span
                aria-hidden
                className={cn(
                  "grid size-[28px] place-items-center rounded-field border",
                  selected ? "border-accent" : "border-line-soft",
                )}
              >
                <span
                  className={cn(
                    "size-[10px] rounded-[2px] border-2",
                    selected ? "border-accent" : "border-ink-dim",
                  )}
                />
              </span>

              <span
                className={cn(
                  "font-sans text-[14px] font-semibold leading-[20px]",
                  selected ? "text-accent" : "text-white",
                )}
              >
                {option.title}
              </span>

              <span className="font-sans text-[11px] leading-[17px] text-ink-dim">
                {option.caption}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[12px] py-[7px]">
      <dt className="font-sans text-[12px] leading-[18px] text-ink-dim">{label}</dt>
      <dd className="font-sans text-[12px] font-medium leading-[18px] text-accent">{value}</dd>
    </div>
  );
}

function labelFor<T extends string>(
  options: readonly OptionCard<T>[],
  value: T | undefined,
): string {
  return options.find((option) => option.value === value)?.title ?? "—";
}
