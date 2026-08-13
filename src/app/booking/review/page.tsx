"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/controllers/AuthContext";
import { useBooking } from "@/controllers/BookingContext";
import { STEP_DEPLOYMENT_READY } from "@/config/booking";
import type { BookingSubmission } from "@/models/booking";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 5 — Deployment Ready. Transcribed from `dev.png`.
 *
 * This is the only gated point in the flow. The screen states that
 * provisioning is binding, so "Initialize Deployment" requires an account —
 * committing a customer to a contract without knowing who they are is not
 * something the UI should allow. Everything before this stays open.
 */
export default function ReviewPage() {
  const router = useRouter();
  const { draft, quote, selectedModel } = useBooking();
  const { isAuthenticated, initializing } = useAuth();
  const config = STEP_DEPLOYMENT_READY;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAccount, setNeedsAccount] = useState(false);

  const gpuCount = draft.scale?.gpuCount ?? 0;
  const ready = Boolean(selectedModel && quote && draft.powerCooling?.cooling);

  async function initialize() {
    if (!ready) return;

    if (!isAuthenticated) {
      setNeedsAccount(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await api.booking.submit(draft as BookingSubmission);
      router.push(`/requests/${encodeURIComponent(result.reference)}`);
    } catch (cause) {
      setError(normalizeError(cause).message);
      setSubmitting(false);
    }
  }

  const returnTo = "/booking/review";

  return (
    <>
      <main className="relative mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[32px] px-[24px] py-[48px] lg:px-[40px]">
        <AnimatedBackdrop stars />

        <Reveal className="relative flex flex-col items-center gap-[14px] text-center">
          <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px] font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-accent">
            <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
            {config.badge}
          </span>

          <h1 className="font-sans text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-white lg:text-[44px]">
            {config.title}
          </h1>

          <p className="max-w-[620px] font-sans text-[14px] leading-[22px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="relative grid grid-cols-1 items-start gap-[24px] lg:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-[20px]">
            {/* Architecture */}
            <Reveal>
              <div
                data-circuit-attract
                className="card-highlight flex flex-col gap-[20px] rounded-card border border-line-hair bg-card p-[24px]"
              >
                <h2 className="flex items-center gap-[10px] font-sans text-[16px] font-medium leading-[24px] text-white">
                  <span aria-hidden className="text-accent">
                    ⊕
                  </span>
                  {config.architectureTitle}
                </h2>

                <div className="flex flex-wrap gap-[32px]">
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">
                      {config.labels.primaryGpu}
                    </span>
                    <span className="flex items-center gap-[8px]">
                      <span className="font-sans text-[24px] font-semibold leading-[32px] text-white">
                        {selectedModel ? `NVIDIA ${selectedModel.name}` : "—"}
                      </span>
                      {selectedModel ? (
                        <span className="rounded-field border border-accent-line bg-accent-soft px-[7px] py-[3px] font-mono text-[9px] uppercase tracking-[1.1px] text-accent">
                          {selectedModel.specs.formFactor}
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <div className="flex flex-col gap-[4px]">
                    <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">
                      {config.labels.nodeCount}
                    </span>
                    <span className="flex items-baseline gap-[6px]">
                      <CountUp
                        value={String(gpuCount)}
                        className="font-sans text-[24px] font-semibold leading-[32px] text-white"
                      />
                      <span className="font-sans text-[12px] text-ink-dim">
                        {config.labels.instances}
                      </span>
                    </span>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-[16px] border-t border-line-soft pt-[16px] sm:grid-cols-4">
                  <SpecCell label={config.labels.interconnect} value="InfiniBand NDR 400G" />
                  <SpecCell label={config.labels.vram} value={selectedModel?.specs.vram ?? "—"} />
                  <SpecCell label={config.labels.systemMemory} value="2TB / Node" />
                  <SpecCell label={config.labels.storage} value="30TB NVMe" />
                </dl>
              </div>
            </Reveal>

            {/* Acknowledgement */}
            <Reveal delay={80}>
              <div className="card-highlight flex flex-col gap-[14px] rounded-card border border-line-hair bg-card p-[24px]">
                <h2 className="flex items-center gap-[10px] font-sans text-[15px] font-medium leading-[22px] text-white">
                  <span aria-hidden className="text-amber-400">
                    ⚠
                  </span>
                  {config.riskTitle}
                </h2>

                <p className="font-sans text-[13px] leading-[21px] text-ink-dim">
                  {config.riskBody}
                </p>

                <span className="inline-flex w-fit items-center gap-[8px] rounded-field border border-accent-line bg-accent-soft px-[12px] py-[8px] font-sans text-[11px] leading-[16px] text-accent">
                  <span aria-hidden>🛡</span>
                  {slaLabel(draft.powerCooling?.sla)}
                </span>
              </div>
            </Reveal>
          </div>

          {/* Commitment */}
          <Reveal delay={140}>
            <div className="card-highlight flex flex-col gap-[16px] rounded-card border border-line-hair bg-card p-[24px]">
              <p className="font-sans text-[12px] leading-[18px] text-ink-dim">
                {config.commitmentTitle}
              </p>

              <p className="flex items-baseline gap-[4px]">
                <span className="font-sans text-[36px] font-bold leading-[44px] text-accent [text-shadow:0px_0px_16px_rgba(0,242,255,0.35)]">
                  {quote ? `$${quote.monthly.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}
                </span>
                <span className="font-sans text-[14px] text-ink-dim">{config.perMonth}</span>
              </p>

              {quote ? (
                <dl className="flex flex-col gap-[2px] border-y border-line-soft py-[12px]">
                  {quote.monthly.lineItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-[12px] py-[5px]">
                      <dt className="font-sans text-[12px] leading-[18px] text-ink-dim">
                        {item.label}
                      </dt>
                      <dd className="font-mono text-[12px] leading-[18px] text-ink">
                        ${item.amountUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <button
                type="button"
                onClick={initialize}
                disabled={!ready || submitting || initializing}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-[8px] rounded-full bg-accent px-[20px] py-[13px]",
                  "font-sans text-[13px] font-bold leading-[20px] text-accent-fg transition-all duration-200",
                  "hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                <span aria-hidden>⚡</span>
                {submitting ? "Reserving…" : config.primaryCta}
              </button>

              {needsAccount ? (
                <div
                  role="status"
                  className="flex flex-col gap-[10px] rounded-field border border-accent-line bg-accent-soft p-[14px]"
                >
                  <p className="font-sans text-[12px] leading-[18px] text-ink">
                    Provisioning is binding, so we need an account before reserving. Your
                    configuration is saved — you will come straight back here.
                  </p>
                  <div className="flex flex-wrap gap-[8px]">
                    <Link
                      href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}
                      className="rounded-full bg-accent px-[16px] py-[8px] font-sans text-[12px] font-bold leading-[16px] text-accent-fg"
                    >
                      Create account
                    </Link>
                    <Link
                      href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
                      className="rounded-full border border-line-strong px-[16px] py-[8px] font-sans text-[12px] font-medium leading-[16px] text-ink transition-colors hover:border-accent hover:text-accent"
                    >
                      I have an account
                    </Link>
                  </div>
                </div>
              ) : null}

              {error ? (
                <p role="alert" className="font-sans text-[12px] text-red-400">
                  {error}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-[10px]">
                {/* The PDF is generated server-side; disabled until it exists. */}
                <button
                  type="button"
                  disabled
                  title="The quote PDF is generated once the cluster is reserved."
                  className="inline-flex cursor-not-allowed items-center justify-center gap-[6px] rounded-full border border-line-strong px-[14px] py-[10px] font-sans text-[11px] font-medium uppercase leading-[14px] tracking-[1px] text-ink-dim opacity-50"
                >
                  <span aria-hidden>⭳</span>
                  {config.pdfCta}
                </button>

                {/* The GPU Renting page has no contact form, so this goes to
                    the shared intake screen rather than a dead anchor. */}
                <Link
                  href="/submit-request"
                  className="inline-flex items-center justify-center gap-[6px] rounded-full border border-line-strong px-[14px] py-[10px] font-sans text-[11px] font-medium uppercase leading-[14px] tracking-[1px] text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  <span aria-hidden>☎</span>
                  {config.callCta}
                </Link>
              </div>

              <AssetPlaceholder
                node="dev.png panel"
                label="Data hall visual"
                src="/assets/visuals/liquid-cooled-data-hall.png"
                alt="Deployment-ready liquid-cooled AI data hall"
                className="aspect-[16/10] w-full rounded-panel"
              />
            </div>
          </Reveal>
        </div>

        <nav className="relative flex items-center">
          <Link
            href="/booking/power-cooling"
            className="inline-flex items-center gap-[8px] rounded-full border border-line-strong px-[22px] py-[11px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>←</span>
            Back
          </Link>
        </nav>
      </main>

      <Footer />
    </>
  );
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[4px]">
      <dt className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">{label}</dt>
      <dd className="font-sans text-[13px] font-medium leading-[20px] text-ink">{value}</dd>
    </div>
  );
}

function slaLabel(sla: string | undefined): string {
  switch (sla) {
    case "standard":
      return "Standard SLA Tier 3 Active (99.5% Uptime)";
    case "critical":
      return "Critical SLA Tier 0 Active (99.999% Uptime)";
    default:
      return "Enterprise SLA Tier 1 Active (99.99% Uptime)";
  }
}
