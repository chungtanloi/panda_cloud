"use client";

import { useCallback, useEffect } from "react";
import { FlowFooter, FlowHeader, FlowNav, FlowPanel, FlowProgress } from "@/components/wizard/FlowChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useAsync } from "@/controllers/useAsync";
import { useInvestment } from "@/controllers/InvestmentContext";
import { INVESTMENT_TOTAL_STEPS, STEP_PAYMENT } from "@/config/investment";
import type { PaymentMethodType, SettlementNetwork } from "@/models/investment";
import { api } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 3 — Payment Method. Transcribed from `payment.png`.
 *
 * ⚠ The design's Settlement panel shows "Token Allocation Volume: 50,000 GPU"
 * — a unit mismatch flagged in the system report, since the asset elsewhere is
 * CPT. The value here is rendered in CPT, matching every other screen. If GPU
 * really is a separate unit, say so and it becomes a contract field.
 *
 * No card details are collected in the frontend. Card payment hands off to the
 * processor; only the method choice is stored.
 */
export default function PaymentPage() {
  const { draft, update } = useInvestment();
  const config = STEP_PAYMENT;

  const method = draft.payment?.method;
  const network = draft.payment?.network;

  const fetchSettlement = useCallback(() => api.investment.settlement(draft), [draft]);
  const { state, run } = useAsync(fetchSettlement);

  useEffect(() => {
    if (method) void run();
  }, [method, network, run]);

  const settlement = state.status === "success" ? state.data : null;
  const needsNetwork = method === "usdc" && !network;

  return (
    <>
      <FlowHeader status={config.statusRight} />

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-[24px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[12px]">
          <FlowProgress
            label={config.stepLabel}
            step={3}
            total={INVESTMENT_TOTAL_STEPS}
            className="max-w-[280px]"
          />

          <h1 className="font-sans text-[32px] font-bold leading-[40px] tracking-[-0.9px] text-white">
            {config.title}
          </h1>

          <p className="font-sans text-[14px] leading-[22px] text-ink-dim">{config.body}</p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[20px] lg:grid-cols-[1.5fr_1fr]">
          <fieldset className="flex flex-col gap-[16px]">
            <legend className="sr-only">Funding source</legend>

            {config.methods.map((option, index) => {
              const isSelected = method === option.value;

              return (
                <Reveal key={option.value} delay={index * 70}>
                  <div
                    className={cn(
                      "card-highlight rounded-card border transition-colors",
                      isSelected ? "border-accent bg-accent-soft" : "border-line-hair bg-card",
                    )}
                  >
                    <label className="flex cursor-pointer flex-col gap-[10px] p-[22px]">
                      <input
                        type="radio"
                        name="payment-method"
                        value={option.value}
                        checked={isSelected}
                        onChange={() =>
                          update("payment", { method: option.value as PaymentMethodType })
                        }
                        className="sr-only"
                      />

                      <span className="flex items-start justify-between gap-[12px]">
                        <span className="flex items-center gap-[10px]">
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-[16px] shrink-0 place-items-center rounded-full border",
                              isSelected ? "border-accent" : "border-line-strong",
                            )}
                          >
                            {isSelected ? (
                              <span className="size-[7px] rounded-full bg-accent" />
                            ) : null}
                          </span>

                          <span
                            className={cn(
                              "font-sans text-[17px] font-semibold leading-[25px]",
                              isSelected ? "text-accent" : "text-white",
                            )}
                          >
                            {option.title}
                          </span>
                        </span>

                        {option.badge ? (
                          <span className="rounded-field border border-accent-line bg-accent-soft px-[9px] py-[4px] font-mono text-[9px] uppercase tracking-[1.1px] text-accent">
                            {option.badge}
                          </span>
                        ) : null}
                      </span>

                      <span className="pl-[26px] font-sans text-[12px] leading-[19px] text-ink-dim">
                        {option.body}
                      </span>
                    </label>

                    {/* Network picker, only for the stablecoin route. */}
                    {isSelected && option.networkLabel ? (
                      <div className="flex flex-col gap-[10px] border-t border-line-soft px-[22px] py-[16px]">
                        <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
                          {option.networkLabel}
                        </span>

                        <div className="flex flex-wrap gap-[8px]">
                          {config.networks.map((option) => {
                            const active = network === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() =>
                                  update("payment", {
                                    network: option.value as SettlementNetwork,
                                  })
                                }
                                className={cn(
                                  "rounded-full border px-[14px] py-[7px] font-sans text-[11px] leading-[16px] transition-colors",
                                  active
                                    ? "border-accent bg-accent-soft text-accent"
                                    : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40",
                                )}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              );
            })}
          </fieldset>

          {/* Settlement details */}
          <Reveal delay={140}>
            <FlowPanel title={config.panel.title}>
              <dl className="flex flex-col gap-[2px]">
                <Row label={config.panel.rows.volume} value={settlement?.allocationVolume ?? "—"} />
                <Row
                  label={config.panel.rows.value}
                  value={
                    settlement
                      ? `$${settlement.estimatedUsdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : "—"
                  }
                />
                <Row
                  label={config.panel.rows.fee}
                  value={settlement ? `$${settlement.networkFeeUsd.toFixed(2)}` : "—"}
                />
                <Row label={config.panel.rows.time} value={settlement?.settlementTime ?? "—"} />
              </dl>

              {settlement ? (
                <p className="rounded-field border border-line-soft bg-surface p-[12px] font-sans text-[11px] leading-[17px] text-ink-dim">
                  ⓘ{" "}
                  {config.panel.notice.replace(
                    "{minutes}",
                    String(settlement.rateLockMinutes),
                  )}
                </p>
              ) : null}

              <FlowNav
                backLabel={config.back}
                backHref="/investment/volume"
                nextLabel={config.next}
                nextHref="/investment/kyc"
                disabled={!method || needsNetwork}
                className="mt-auto flex-col-reverse items-stretch gap-[10px] sm:flex-row sm:items-center"
              />
            </FlowPanel>
          </Reveal>
        </div>
      </main>

      <FlowFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[12px] py-[8px]">
      <dt className="font-sans text-[12px] leading-[18px] text-ink-dim">{label}</dt>
      <dd className="font-mono text-[12px] leading-[18px] text-ink">{value}</dd>
    </div>
  );
}
