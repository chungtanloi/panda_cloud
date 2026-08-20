"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { useAsync } from "@/controllers/useAsync";
import { api } from "@/services/api";

/**
 * Request Received — the shared confirmation screen for every flow.
 *
 * ⚠ DESIGNED HERE, NOT TRANSCRIBED. Figma node 2:1809 was never exported, and
 * the system report describes only "Status Complete; acknowledgment; Return to
 * Platform". Built from the existing design language and agreed with the
 * product owner. Reconcile when the design is available.
 *
 * Content is fetched rather than hard-coded, so the same screen serves
 * assessment, booking, investment and hyperscale submissions.
 */
export default function RequestReceivedPage() {
  const params = useParams<{ reference: string }>();
  const reference = decodeURIComponent(params.reference);

  const fetchReceipt = useCallback(() => api.dashboard.getReceipt(reference), [reference]);
  const { state, run } = useAsync(fetchReceipt, { immediate: [] });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex w-full items-center px-[24px] py-[20px] lg:px-[40px]">
        <Link href="/" className="flex items-center gap-[8px]">
          <BrandMark className="h-[16px] w-[22px]" />
          <span className="font-sans text-[16px] font-semibold leading-[24px] text-white">
            Panda Cloud
          </span>
        </Link>
      </header>

      <main className="relative mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center justify-center px-[24px] py-[48px] text-center lg:px-[40px]">
        <AnimatedBackdrop stars />

        {state.status === "error" ? (
          <ErrorState error={state.error} onRetry={() => void run()} className="w-full" />
        ) : state.status === "success" ? (
          <>
            <Reveal className="relative flex flex-col items-center gap-[20px]">
              <span
                aria-hidden
                className="grid size-[72px] place-items-center rounded-full border border-accent/40 bg-accent-soft text-accent drop-shadow-[0px_0px_24px_rgba(0,242,255,0.35)]"
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path
                    d="M7 15.5 12.5 21 23 10"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px] font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-accent">
                <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
                Request received
              </span>

              <h1 className="font-sans text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-white lg:text-[42px]">
                {state.data.title}
              </h1>

              <p className="max-w-[560px] font-sans text-[15px] leading-[24px] text-ink-dim">
                {state.data.message}
              </p>

              <p className="rounded-field border border-line-soft bg-card px-[16px] py-[10px] font-mono text-[13px] tracking-[1px] text-accent">
                {state.data.reference}
              </p>
            </Reveal>

            {state.data.nextSteps.length > 0 ? (
              <Reveal delay={100} className="relative mt-[40px] w-full">
                <div className="card-highlight rounded-card border border-line-hair bg-card p-[24px] text-left">
                  <h2 className="font-mono text-[10px] uppercase leading-[14px] tracking-[1.2px] text-ink-mute">
                    What happens next
                  </h2>

                  <ol className="mt-[16px] flex flex-col gap-[14px]">
                    {state.data.nextSteps.map((step, index) => (
                      <li key={step} className="flex items-start gap-[12px]">
                        <span
                          aria-hidden
                          className="grid size-[24px] shrink-0 place-items-center rounded-full border border-accent/30 bg-accent-soft font-mono text-[10px] text-accent"
                        >
                          {index + 1}
                        </span>
                        <span className="font-sans text-[13px] leading-[21px] text-ink-dim">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={160} className="relative mt-[36px] flex flex-wrap justify-center gap-[12px]">
              <Link
                href="/"
                className="rounded-full bg-accent px-[32px] py-[13px] font-sans text-[13px] font-bold leading-[20px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
              >
                Return to Platform
              </Link>

            </Reveal>
          </>
        ) : (
          <div className="relative flex w-full flex-col items-center gap-[20px]">
            <span className="sr-only">
              <LoadingState label="Loading confirmation" />
            </span>
            <Skeleton className="size-[72px] rounded-full" />
            <Skeleton className="h-[44px] w-[320px] max-w-full" />
            <Skeleton className="h-[24px] w-[460px] max-w-full" />
            <Skeleton className="mt-[24px] h-[180px] w-full rounded-card" />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
