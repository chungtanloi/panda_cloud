"use client";

import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { LoadingState, Skeleton } from "@/components/ui/states";
import { useBooking } from "@/controllers/BookingContext";
import { STEP_HARDWARE } from "@/config/booking";
import type { GpuModel } from "@/models/booking";
import { cn } from "@/lib/cn";

/**
 * Step 2 — GPU Hardware. Transcribed from `GPU_2.png`.
 *
 * Four model cards on the left, a live spec sheet on the right. Both come from
 * `api.booking.listGpuModels()`, so adding a GPU is a backend change.
 *
 * Pre-order models have no rate; the design shows "TBD" rather than a price,
 * and they can still be selected (the quote treats them as unpriced).
 */
export default function HardwarePage() {
  const { draft, update, models, modelsLoading, selectedModel } = useBooking();
  const config = STEP_HARDWARE;

  return (
    <>
      <TopNavBar />

      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[28px] px-[24px] py-[40px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[10px]">
          <p className="font-mono text-[11px] uppercase leading-[12px] tracking-[1.2px] text-ink-mute">
            {config.statusLine}
          </p>
          <h1 className="font-sans text-[34px] font-bold leading-[42px] tracking-[-0.9px] text-white">
            {config.title}
          </h1>
          <p className="font-sans text-[14px] leading-[22px] text-ink-dim">{config.body}</p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.5fr_1fr]">
          {/* Model grid */}
          {modelsLoading ? (
            <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-2" aria-hidden>
              <Skeleton className="h-[150px] rounded-card" />
              <Skeleton className="h-[150px] rounded-card" />
              <Skeleton className="h-[150px] rounded-card" />
              <Skeleton className="h-[150px] rounded-card" />
            </div>
          ) : (
            <fieldset className="grid grid-cols-1 gap-[16px] sm:grid-cols-2">
              <legend className="sr-only">GPU model</legend>

              {models.map((model, index) => (
                <Reveal key={model.id} delay={index * 60}>
                  <ModelCard
                    model={model}
                    selected={draft.hardware?.gpuModelId === model.id}
                    onSelect={() => update("hardware", { gpuModelId: model.id })}
                  />
                </Reveal>
              ))}
            </fieldset>
          )}

          {/* Spec sheet */}
          <Reveal delay={120}>
            <div
              data-circuit-attract
              className="card-highlight flex flex-col gap-[18px] rounded-card border border-line-hair bg-card p-[24px]"
            >
              <div className="flex items-center justify-between gap-[12px]">
                <h2 className="flex items-center gap-[8px] font-sans text-[15px] font-medium leading-[22px] text-white">
                  <span aria-hidden className="size-[8px] rounded-[2px] bg-accent" />
                  {config.panel.title}
                </h2>
                {selectedModel ? (
                  <span className="rounded-field border border-line-soft px-[9px] py-[4px] font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">
                    {selectedModel.name}
                  </span>
                ) : null}
              </div>

              {!selectedModel ? (
                <p className="py-[32px] text-center font-sans text-[13px] leading-[21px] text-ink-faint">
                  {config.panel.empty}
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-[14px]">
                    <SpecBar
                      label={config.panel.bars.tensor}
                      value={`${selectedModel.specs.fp64TensorTflops} TFLOPS`}
                      percent={selectedModel.specs.bars.tensor}
                    />
                    <SpecBar
                      label={config.panel.bars.bandwidth}
                      value={`${selectedModel.specs.memoryBandwidthTbs} TB/s`}
                      percent={selectedModel.specs.bars.bandwidth}
                    />
                    <SpecBar
                      label={config.panel.bars.tdp}
                      value={`${selectedModel.specs.tdpWatts}W`}
                      percent={selectedModel.specs.bars.tdp}
                    />
                  </div>

                  <dl className="flex flex-col gap-[2px] rounded-panel border border-line-soft bg-surface p-[14px]">
                    <SpecRow label={config.panel.rows.vram} value={selectedModel.specs.vram} />
                    <SpecRow
                      label={config.panel.rows.interconnect}
                      value={selectedModel.specs.interconnect}
                    />
                    <SpecRow
                      label={config.panel.rows.formFactor}
                      value={selectedModel.specs.formFactor}
                    />
                  </dl>

                  <p className="font-sans text-[11px] leading-[16px] text-ink-faint">
                    ⓘ {config.panel.footnote}
                  </p>
                </>
              )}
            </div>
          </Reveal>
        </div>

        <nav className="flex items-center justify-between gap-[16px] pt-[8px]">
          <Link
            href="/booking/workload"
            className="inline-flex items-center gap-[8px] rounded-full border border-line-strong px-[22px] py-[11px] font-sans text-[13px] font-medium leading-[20px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>←</span>
            {config.back}
          </Link>

          <Link
            href="/booking/scale"
            aria-disabled={!selectedModel}
            className={cn(
              "inline-flex items-center gap-[8px] rounded-full bg-accent px-[28px] py-[12px]",
              "font-sans text-[12px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg",
              "transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
              !selectedModel && "pointer-events-none opacity-40",
            )}
          >
            {config.next}
            <span aria-hidden>→</span>
          </Link>
        </nav>
      </main>

      <Footer />
    </>
  );
}

function ModelCard({
  model,
  selected,
  onSelect,
}: {
  model: GpuModel;
  selected: boolean;
  onSelect: () => void;
}) {
  const config = STEP_HARDWARE;
  const stockLabel = config.stockLabels[model.stock];

  return (
    <SpotlightCard
      className={cn(
        "card-highlight h-full rounded-card border transition-colors",
        selected ? "border-accent bg-accent-soft" : "border-line-hair bg-card",
      )}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className="relative flex h-full w-full flex-col gap-[14px] p-[22px] text-left"
      >
        <span className="flex items-start justify-between gap-[12px]">
          <span
            aria-hidden
            className={cn(
              "grid size-[34px] place-items-center rounded-field border",
              selected ? "border-accent bg-accent-soft" : "border-line-soft bg-white/[0.03]",
            )}
          >
            <span
              className={cn(
                "size-[11px] rounded-[2px] border-2",
                selected ? "border-accent" : "border-ink-dim",
              )}
            />
          </span>

          <span
            className={cn(
              "inline-flex items-center gap-[6px] rounded-field border px-[8px] py-[4px] font-mono text-[9px] uppercase tracking-[1.1px]",
              model.stock === "in_stock" && "border-accent-line bg-accent-soft text-accent",
              model.stock === "limited" && "border-amber-400/30 bg-amber-400/10 text-amber-300",
              model.stock === "pre_order" && "border-line-soft bg-white/[0.03] text-ink-dim",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "size-[5px] rounded-full",
                model.stock === "in_stock" && "pulse-dot bg-accent",
                model.stock === "limited" && "bg-amber-300",
                model.stock === "pre_order" && "bg-line-subtle",
              )}
            />
            {stockLabel}
          </span>
        </span>

        <span className="flex flex-col gap-[2px]">
          <span className="font-sans text-[22px] font-semibold leading-[30px] text-white">
            {model.name}
          </span>
          <span className="font-sans text-[12px] leading-[18px] text-ink-dim">{model.memory}</span>
        </span>

        <span className="mt-auto flex items-end justify-between gap-[12px] border-t border-line-soft pt-[12px]">
          <span className="font-sans text-[11px] leading-[16px] text-ink-dim">
            {config.architectureLabel}: {model.architecture}
          </span>
          <span
            className={cn(
              "font-sans text-[14px] font-semibold leading-[20px]",
              model.hourlyRateUsd === null ? "text-ink-dim" : "text-accent",
            )}
          >
            {model.hourlyRateUsd === null ? config.priceTbd : `$${model.hourlyRateUsd.toFixed(2)}/hr`}
          </span>
        </span>
      </button>
    </SpotlightCard>
  );
}

function SpecBar({ label, value, percent }: { label: string; value: string; percent: number }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-baseline justify-between gap-[12px]">
        <span className="font-mono text-[10px] uppercase leading-[14px] tracking-[1.1px] text-ink-mute">
          {label}
        </span>
        <span className="font-sans text-[12px] font-medium leading-[18px] text-accent">{value}</span>
      </div>
      <div className="h-[4px] w-full overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-accent shadow-accent-bar transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[12px] py-[6px]">
      <dt className="font-sans text-[12px] leading-[18px] text-ink-dim">{label}</dt>
      <dd className="font-sans text-[12px] font-medium leading-[18px] text-ink">{value}</dd>
    </div>
  );
}
