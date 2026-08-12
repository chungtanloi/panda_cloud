"use client";

import { useCallback, useEffect } from "react";
import { FlowFooter, FlowHeader, FlowNav, FlowPanel, FlowProgress } from "@/components/wizard/FlowChrome";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { useAsync } from "@/controllers/useAsync";
import { useHyperscale } from "@/controllers/HyperscaleContext";
import { HYPERSCALE_TOTAL_STEPS, STEP_CAPACITY } from "@/config/hyperscale";
import type { CoolingArchitecture } from "@/models/hyperscale";
import { api } from "@/services/api";

/**
 * Step 2 — Capacity & Cooling. Transcribed from `Hyper.png`.
 *
 * ⚠ The export's next button read "Proceed to Network", but no Networking
 * screen exists in the flow. Confirmed as a leftover label; it now names the
 * screen it actually leads to. See models/hyperscale.ts.
 */
export default function CapacityPage() {
  const { draft, update } = useHyperscale();
  const config = STEP_CAPACITY;

  const capacity = draft.capacity?.targetCapacityMw ?? config.capacity.default;
  const cooling = draft.capacity?.cooling ?? "air_hot_cold";
  const percent =
    ((capacity - config.capacity.min) / (config.capacity.max - config.capacity.min)) * 100;

  const fetchCapex = useCallback(() => api.hyperscale.projectCapex(draft), [draft]);
  const { state, run } = useAsync(fetchCapex);

  useEffect(() => {
    void run();
  }, [capacity, cooling, run]);

  const projection = state.status === "success" ? state.data : null;

  return (
    <>
      <FlowHeader exitHref="/" exitLabel="Save & Exit" />

      <main className="mx-auto flex w-full max-w-[1150px] flex-1 flex-col gap-[24px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[12px]">
          <FlowProgress
            label={config.statusLine}
            step={2}
            total={HYPERSCALE_TOTAL_STEPS}
            className="max-w-[240px]"
          />

          <h1 className="font-sans text-[30px] font-bold leading-[38px] tracking-[-0.8px] text-white">
            {config.title}
          </h1>

          <p className="max-w-[620px] font-sans text-[13px] leading-[21px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[20px] lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <div className="card-highlight flex flex-col gap-[28px] rounded-card border border-line-hair bg-card p-[24px]">
              {/* Capacity slider */}
              <div className="flex flex-col gap-[12px]">
                <div className="flex items-center justify-between gap-[12px]">
                  <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">
                    {config.capacity.label}
                  </span>
                  <span className="rounded-field border border-accent-line bg-accent-soft px-[10px] py-[5px] font-sans text-[13px] font-semibold text-accent">
                    {capacity} {config.capacity.unit}
                  </span>
                </div>

                <input
                  type="range"
                  min={config.capacity.min}
                  max={config.capacity.max}
                  step={config.capacity.step}
                  value={capacity}
                  aria-label="Target capacity"
                  aria-valuetext={`${capacity} megawatts`}
                  onChange={(event) =>
                    update("capacity", { targetCapacityMw: Number(event.target.value) })
                  }
                  className="circuit-range w-full"
                  style={{ ["--fill" as string]: `${percent}%` }}
                />

                <div className="flex justify-between font-sans text-[10px] leading-[14px] text-ink-faint">
                  <span>{config.capacity.minLabel}</span>
                  <span>{config.capacity.maxLabel}</span>
                </div>
              </div>

              {/* Cooling */}
              <div className="flex flex-col gap-[10px]">
                <label
                  htmlFor="cooling"
                  className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim"
                >
                  {config.cooling.label}
                </label>

                <select
                  id="cooling"
                  value={cooling}
                  onChange={(event) =>
                    update("capacity", { cooling: event.target.value as CoolingArchitecture })
                  }
                  className="w-full rounded-field border border-line-strong bg-deep px-[16px] py-[13px] font-sans text-[14px] text-ink focus:border-accent focus:outline-none"
                >
                  {config.cooling.options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-deep text-ink">
                      {option.label}
                    </option>
                  ))}
                </select>

                <p className="font-sans text-[11px] leading-[17px] text-ink-faint">
                  {config.cooling.hint}
                </p>
              </div>
            </div>
          </Reveal>

          {/* CapEx projection */}
          <Reveal delay={120}>
            <FlowPanel title={config.panel.title} badge={config.panel.badge} className="h-full">
              <dl className="flex flex-col gap-[2px]">
                {projection?.categories.map((category) => (
                  <div
                    key={category.label}
                    className="flex items-center justify-between gap-[12px] py-[9px]"
                  >
                    <dt className="font-sans text-[12px] leading-[18px] text-ink-dim">
                      {category.label}
                    </dt>
                    <dd
                      className={
                        category.emphasis
                          ? "font-mono text-[12px] leading-[18px] text-accent"
                          : "font-mono text-[12px] leading-[18px] text-ink"
                      }
                    >
                      ${(category.amountUsd / 1_000_000).toFixed(1)}M
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto rounded-panel border border-accent/30 bg-accent-soft p-[16px] text-center">
                <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
                  {config.panel.totalLabel}
                </p>

                <CountUp
                  value={
                    projection ? `$${(projection.totalUsd / 1_000_000).toFixed(1)}M` : "—"
                  }
                  className="block pt-[6px] font-sans text-[30px] font-bold leading-[38px] text-accent [text-shadow:0px_0px_16px_rgba(0,242,255,0.35)]"
                />

                <p className="pt-[6px] font-sans text-[10px] leading-[14px] text-ink-faint">
                  ⓘ {config.panel.note}
                </p>
              </div>
            </FlowPanel>
          </Reveal>
        </div>

        <FlowNav
          backLabel={config.back}
          backHref="/hyperscale/stage"
          nextLabel={config.next}
          nextHref="/hyperscale/geography"
          disabled={!projection}
        />
      </main>

      <FlowFooter />
    </>
  );
}
