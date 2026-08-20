"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { FlowHeader } from "@/components/wizard/FlowChrome";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";

export default function InvestmentConfirmationPage() {
  return <Suspense fallback={null}><InquiryReceipt /></Suspense>;
}

function InquiryReceipt() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("id") ?? "pending";
  return (
    <>
      <FlowHeader />
      <main className="relative mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-[28px] px-[24px] py-[48px]">
        <AnimatedBackdrop stars />
        <Reveal className="relative flex flex-col items-center gap-[14px] text-center">
          <span className="grid size-[52px] place-items-center rounded-full bg-accent text-accent-fg">✓</span>
          <h1 className="font-sans text-[38px] font-bold text-white">Inquiry Received</h1>
          <p className="max-w-[600px] text-[13px] leading-[21px] text-ink-dim">Your non-binding AI token investment inquiry was received. Compliance and Sales will contact you before any payment, settlement, or token allocation.</p>
        </Reveal>
        <Reveal>
          <div className="relative rounded-card border border-line-hair bg-card p-[24px] text-center">
            <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-mute">Inquiry reference</p>
            <p className="mt-[8px] font-mono text-[20px] text-accent">{reference}</p>
            <p className="mt-[16px] text-[11px] leading-[18px] text-ink-dim">Any projections shown during the flow are estimates only and are not a settlement result.</p>
          </div>
        </Reveal>
        <Reveal className="flex justify-center"><Link href="/" className="rounded-full bg-accent px-[20px] py-[10px] text-[12px] font-bold text-accent-fg">Return home</Link></Reveal>
      </main>
      <Footer />
    </>
  );
}
