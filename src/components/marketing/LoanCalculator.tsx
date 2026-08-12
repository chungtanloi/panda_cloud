"use client";

import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { LOAN_CALCULATOR } from "@/config/financing";

/**
 * Interactive loan estimator from the Financing design.
 *
 * The monthly figure is a real amortised payment computed from the inputs, not
 * a fixed string — see the DESIGN INCONSISTENCY note in config/financing.ts for
 * why the mock's number was not copied verbatim.
 *
 * Presentation only: nothing here submits, and no rate is quoted as binding.
 */

/** Standard amortisation: M = P·r(1+r)ⁿ / ((1+r)ⁿ − 1). */
function monthlyPayment(principal: number, months: number, aprPercent: number): number {
  const r = aprPercent / 100 / 12;
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function LoanCalculator() {
  const config = LOAN_CALCULATOR;
  // Explicit <number>: the config object is `as const`, so the defaults are
  // literal types and useState would otherwise infer `1000000` / `36`.
  const [amount, setAmount] = useState<number>(config.amount.default);
  const [months, setMonths] = useState<number>(config.term.default);

  const payment = useMemo(
    () => monthlyPayment(amount, months, config.aprPercent),
    [amount, months, config.aprPercent],
  );

  return (
    <Reveal>
      <div
        id="calculator"
        data-circuit-attract
        className="card-highlight scroll-mt-[96px] rounded-card border border-line-hair bg-card p-[33px]"
      >
        <header className="flex flex-col gap-[8px]">
          <h2 className="flex items-center gap-[10px] font-sans text-[20px] font-medium leading-[28px] text-white">
            <span aria-hidden className="size-[8px] rounded-[2px] bg-accent" />
            {config.title}
          </h2>
          <p className="font-sans text-[14px] leading-[22px] text-ink-dim">{config.subtitle}</p>
        </header>

        <div className="mt-[32px] grid grid-cols-1 items-center gap-[40px] lg:grid-cols-2">
          <div className="flex flex-col gap-[32px]">
            <SliderField
              label={config.amount.label}
              value={formatUsd(amount)}
              min={config.amount.min}
              max={config.amount.max}
              step={config.amount.step}
              current={amount}
              onChange={setAmount}
              minLabel={config.amount.minLabel}
              maxLabel={config.amount.maxLabel}
              ariaValueText={formatUsd(amount)}
            />

            <SliderField
              label={config.term.label}
              value={`${months} Months`}
              min={config.term.min}
              max={config.term.max}
              step={config.term.step}
              current={months}
              onChange={setMonths}
              minLabel={config.term.minLabel}
              maxLabel={config.term.maxLabel}
              ariaValueText={`${months} months`}
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-[12px] rounded-panel border border-accent-line bg-accent-soft px-[24px] py-[32px] text-center">
            <p className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim">
              {config.resultLabel}
            </p>

            <p
              aria-live="polite"
              className="font-sans text-[44px] font-bold leading-[52px] text-accent [text-shadow:0px_0px_16px_rgba(0,242,255,0.35)]"
            >
              {formatUsd(payment)}
            </p>

            <p className="flex items-center gap-[8px] font-sans text-[12px] leading-[18px] text-ink-dim">
              <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
              {config.disclaimer.replace("{apr}", String(config.aprPercent))}
            </p>
          </div>
        </div>

        <p className="mt-[24px] font-sans text-[12px] leading-[18px] text-ink-faint">
          Estimate only. Not an offer of credit — final rates and terms follow a credit review.
        </p>
      </div>
    </Reveal>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
  minLabel,
  maxLabel,
  ariaValueText,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (next: number) => void;
  minLabel: string;
  maxLabel: string;
  ariaValueText: string;
}) {
  // Percentage drives the filled portion of the track.
  const percent = ((current - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-baseline justify-between gap-[16px]">
        <span className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim">
          {label}
        </span>
        <span className="font-sans text-[16px] font-semibold leading-[24px] text-accent">
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        aria-label={label}
        aria-valuetext={ariaValueText}
        onChange={(event) => onChange(Number(event.target.value))}
        className="circuit-range w-full"
        style={{ ["--fill" as string]: `${percent}%` }}
      />

      <div className="flex justify-between font-sans text-[12px] leading-[18px] text-ink-faint">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
