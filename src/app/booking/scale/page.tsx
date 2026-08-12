"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { Reveal } from "@/components/motion/Reveal";
import { useBooking } from "@/controllers/BookingContext";
import { STEP_SCALE } from "@/config/booking";
import type { CommitmentTerm, DeploymentTarget } from "@/models/booking";
import { cn } from "@/lib/cn";

/**
 * Step 3 — Scale & Deployment ("Initialize Cluster"). From `ini.png`.
 *
 * ⚠ The design's terminal panel does not add up: it lists $245.60 + $13.00 −
 * $65.00 and displays a total of $288.48, and shows a 1-year discount while
 * the commitment dropdown reads "On-demand (No commit)".
 *
 * This implementation shows a total that equals the sum of its own line items,
 * and only renders the discount row when a term is actually selected. A
 * customer who adds up the column will get the number shown. See the note on
 * COMMITMENT_DISCOUNTS in config/booking.ts.
 */
export default function ScalePage() {
  const { draft, update, quote, quoteLoading, selectedModel } = useBooking();
  const config = STEP_SCALE;

  const gpuCount = draft.scale?.gpuCount ?? 128;
  const target = draft.scale?.deploymentTarget ?? "asap";
  const commitment = draft.scale?.commitment ?? "on_demand";

  const { min, max } = config.scaleCard;
  const percent = ((gpuCount - min) / (max - min)) * 100;

  return (
    <>
      <TopNavBar />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[28px] px-[24px] py-[40px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[12px]">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-[8px] font-sans text-[12px] leading-[18px] text-ink-dim">
              {config.breadcrumb.map((crumb, index) => (
                <li key={crumb} className="flex items-center gap-[8px]">
                  <span className={index === 1 ? "text-accent" : undefined}>{crumb}</span>
                  {index < config.breadcrumb.length - 1 ? (
                    <span aria-hidden className="text-ink-faint">
                      ›
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="font-sans text-[34px] font-bold leading-[42px] tracking-[-0.9px] text-white">
            {config.title}
          </h1>

          <p className="max-w-[620px] font-sans text-[14px] leading-[22px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.5fr_1fr]">
          <div className="flex flex-col gap-[20px]">
            {/* Compute scale */}
            <Reveal>
              <div className="card-highlight flex flex-col gap-[24px] rounded-card border border-line-hair bg-card p-[24px]">
                <div className="flex flex-wrap items-start justify-between gap-[12px]">
                  <div className="flex flex-col gap-[2px]">
                    <h2 className="font-sans text-[18px] font-semibold leading-[26px] text-white">
                      {config.scaleCard.title}
                    </h2>
                    <p className="font-sans text-[12px] leading-[18px] text-ink-dim">
                      {selectedModel ? `NVIDIA ${selectedModel.name} ${selectedModel.specs.formFactor}` : "—"}
                    </p>
                  </div>

                  <span className="rounded-field border border-accent-line bg-accent-soft px-[10px] py-[5px] font-mono text-[10px] uppercase tracking-[1.2px] text-accent">
                    {config.scaleCard.allocationLabel}: {gpuCount}
                  </span>
                </div>

                <div className="flex flex-col gap-[10px]">
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={8}
                    value={gpuCount}
                    aria-label="GPU count"
                    aria-valuetext={`${gpuCount} GPUs`}
                    onChange={(event) =>
                      update("scale", { gpuCount: Number(event.target.value) })
                    }
                    className="circuit-range w-full"
                    style={{ ["--fill" as string]: `${percent}%` }}
                  />
                  <div className="flex justify-between font-sans text-[11px] leading-[16px] text-ink-faint">
                    <span>{config.scaleCard.minLabel}</span>
                    <span>{config.scaleCard.maxLabel}</span>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Schedule + term */}
            <Reveal delay={80}>
              <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
                <SelectCard
                  id="deployment-target"
                  label={config.targetField.label}
                  value={target}
                  options={config.targetField.options}
                  onChange={(value) =>
                    update("scale", { deploymentTarget: value as DeploymentTarget })
                  }
                />
                <SelectCard
                  id="commitment-term"
                  label={config.commitmentField.label}
                  value={commitment}
                  options={config.commitmentField.options}
                  onChange={(value) => update("scale", { commitment: value as CommitmentTerm })}
                />
              </div>
            </Reveal>
          </div>

          {/* Terminal */}
          <Reveal delay={140}>
            <div
              data-circuit-attract
              className="relative flex flex-col gap-[18px] overflow-hidden rounded-card border border-line-hair bg-card p-[24px]"
            >
              <div className="flex items-center justify-between gap-[12px]">
                <h2 className="font-sans text-[15px] font-medium leading-[22px] text-white">
                  {config.terminal.title}
                </h2>
                <span className="flex items-center gap-[6px] font-mono text-[10px] uppercase tracking-[1.2px] text-accent">
                  <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
                  {config.terminal.badge}
                </span>
              </div>

              {quote ? (
                <>
                  <dl className="flex flex-col gap-[2px]">
                    {quote.hourly.lineItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-[12px] py-[7px]"
                      >
                        <dt
                          className={cn(
                            "font-sans text-[12px] leading-[18px]",
                            item.amountUsd < 0 ? "text-accent" : "text-ink-dim",
                          )}
                        >
                          {item.label}
                        </dt>
                        <dd
                          className={cn(
                            "font-mono text-[12px] leading-[18px]",
                            item.amountUsd < 0 ? "text-accent" : "text-ink",
                          )}
                        >
                          {item.amountUsd < 0 ? "−" : ""}${Math.abs(item.amountUsd).toFixed(2)}/hr
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <div className="flex flex-col items-end gap-[2px] border-t border-line-soft pt-[16px]">
                    <p className="font-sans text-[34px] font-bold leading-[42px] text-accent [text-shadow:0px_0px_16px_rgba(0,242,255,0.35)]">
                      ${quote.hourly.total.toFixed(2)}
                    </p>
                    <p className="font-sans text-[11px] leading-[16px] text-ink-dim">
                      {config.terminal.totalLabel}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-faint">
                      {config.terminal.unit}
                    </p>
                  </div>
                </>
              ) : (
                <p className="py-[32px] text-center font-sans text-[13px] leading-[21px] text-ink-faint">
                  {quoteLoading ? "Calculating…" : "Select a GPU model to see the run rate."}
                </p>
              )}

              <Link
                href="/booking/power-cooling"
                aria-disabled={!quote}
                className={cn(
                  "mt-auto inline-flex w-full items-center justify-center gap-[8px] rounded-full bg-accent px-[20px] py-[13px]",
                  "font-sans text-[12px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg",
                  "transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
                  !quote && "pointer-events-none opacity-40",
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

function SelectCard({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="card-highlight flex flex-col gap-[10px] rounded-card border border-line-hair bg-card p-[20px]">
      <label
        htmlFor={id}
        className="flex items-center gap-[8px] font-sans text-[12px] leading-[18px] text-ink-dim"
      >
        <span aria-hidden className="text-accent">
          ⌁
        </span>
        {label}
      </label>

      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-field border border-line-strong bg-deep px-[14px] py-[11px] font-sans text-[13px] text-ink focus:border-accent focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-deep text-ink">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
