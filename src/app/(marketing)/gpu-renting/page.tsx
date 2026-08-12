"use client";

import Link from "next/link";
import { useState } from "react";
import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import { GpuOfferCard } from "@/components/marketing/GpuOfferCard";
import { TimeframeTabs } from "@/components/marketing/TimeframeTabs";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { CtaBand } from "@/components/marketing/sections/CtaBand";
import { FaqAccordion } from "@/components/marketing/sections/FaqAccordion";
import { HowItWorks } from "@/components/marketing/sections/HowItWorks";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import {
  GPU_HERO,
  GPU_OFFERS,
  PLATFORM_ADVANTAGES,
  type Timeframe,
} from "@/config/gpuRenting";
import { GPU_FAQ, GPU_STEPS } from "@/config/marketingSections";

/**
 * GPU Renting — Figma node 2:5.
 *   page     — px 64, py 128, 128px between sections
 *   hero     — centred badge, 48px title, 18px body, two CTAs
 *   showcase — bordered image frame with a bottom fade (node 2:26)
 *   pricing  — section header + timeframe tabs + three spec cards
 *   features — "PLATFORM ADVANTAGES" plus four accent-edged cards
 *
 * Client component only because of the timeframe tabs; everything else is
 * static content from config/gpuRenting.ts.
 */
export default function GpuRentingPage() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Hourly");

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
      <ViewportSection>
      {/* Hero — node 2:6 */}
      <Reveal as="section" className="relative flex flex-col items-center text-center">
        <AnimatedBackdrop stars />

        <span className="relative inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px]">
          <span aria-hidden className="pulse-dot size-[8px] rounded-full bg-accent" />
          <span className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent">
            {GPU_HERO.badge}
          </span>
        </span>

        <h1 className="relative max-w-[896px] pt-[48px] font-sans text-[36px] font-bold leading-[1.1] tracking-[-1.92px] text-white lg:text-[48px] lg:leading-[52.8px]">
          <span className="block">{GPU_HERO.titleLead}</span>
          <span
            className="gradient-sweep block font-normal text-transparent"
            style={{
              backgroundImage: "linear-gradient(to right, #00f2ff 0%, #ffffff 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            {GPU_HERO.titleAccent}
          </span>
        </h1>

        <p className="relative max-w-[672px] pt-[32px] font-sans text-[18px] leading-[28.8px] text-ink-bright">
          {GPU_HERO.body}
        </p>

        <div className="relative flex flex-wrap items-center justify-center gap-[16px] pt-[32px]">
          <Link
            href={GPU_HERO.primaryCta.href}
            className="inline-flex items-center gap-[8px] rounded-full bg-accent px-[32px] py-[17px] font-sans text-[16px] font-bold leading-[24px] text-accent-fg transition-opacity hover:opacity-90"
          >
            {GPU_HERO.primaryCta.label}
            <ArrowRight />
          </Link>

          <Link
            href={GPU_HERO.secondaryCta.href}
            className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-glass px-[33px] py-[17px] font-sans text-[16px] font-bold leading-[24px] text-white backdrop-blur-card transition-colors hover:border-accent"
          >
            <PlayIcon />
            {GPU_HERO.secondaryCta.label}
          </Link>
        </div>
      </Reveal>
      </ViewportSection>

      {/* Showcase image — node 2:26.
          The design's 1134:890 ratio is ~1030px tall at full width, which
          alone overflows a 1080p screen. Height is capped so the framed image
          fits one viewport; the aspect ratio is preserved below the cap. */}
      <ViewportSection>
      <Reveal
        as="section"
        className="relative overflow-hidden rounded-panel border border-accent-line bg-glass p-[9px] shadow-auth backdrop-blur-card"
      >
        <AssetPlaceholder
          node="2:27"
          label="Cluster showcase"
          className="aspect-[1134/890] max-h-[calc(100svh-220px)] w-full rounded-[24px] opacity-90"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[128px]"
          style={{
            backgroundImage: "linear-gradient(to top, #0c0e12 0%, rgba(12,14,18,0) 100%)",
          }}
        />
      </Reveal>
      </ViewportSection>

      {/* Pricing & specs — node 2:29 */}
      <ViewportSection>
      <section className="flex flex-col gap-[40px]">
        <div className="flex flex-col items-start justify-between gap-[24px] border-b border-line-soft pb-[17px] md:flex-row md:items-end">
          <div>
            <h2 className="font-sans text-[32px] font-semibold leading-[38.4px] tracking-[-0.64px] text-accent">
              Available Hardware
            </h2>
            <p className="pt-[16px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-mute">
              SELECT ALLOCATION TIMEFRAME
            </p>
          </div>

          <TimeframeTabs value={timeframe} onChange={setTimeframe} />
        </div>

        <div className="grid grid-cols-1 items-start gap-[16px] lg:grid-cols-3">
          {GPU_OFFERS.map((offer, index) => (
            <Reveal key={offer.id} delay={index * 80}>
              <SpotlightCard tilt className="rounded-panel">
                <GpuOfferCard offer={offer} />
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </section>
      </ViewportSection>

      {/* Platform advantages — node 2:149 */}
      <ViewportSection>
      <section className="flex flex-col gap-[24px]">
        <h3 className="border-b border-line-soft pb-[9px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent">
          PLATFORM ADVANTAGES
        </h3>

        <ul className="grid grid-cols-1 gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
          {PLATFORM_ADVANTAGES.map((advantage, index) => (
            <Reveal as="li" key={advantage} delay={index * 60}>
              <div className="hover-lift flex h-full flex-col gap-[8px] rounded-field border border-accent border-l-2 bg-glass py-[17px] pl-[18px] pr-[17px] backdrop-blur-card">
                <span className="font-sans text-[16px] font-bold leading-[24px] text-white">
                  {advantage}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>
      </ViewportSection>

      {/* --- Sections below are additions, not from the Figma file.
              See config/marketingSections.ts for the rationale. --- */}

      <ViewportSection>
        <HowItWorks
          title="Running in four steps"
          subtitle="No procurement cycle, no infrastructure team required."
          steps={GPU_STEPS}
        />
      </ViewportSection>

      <ViewportSection>
        <FaqAccordion title="Before you reserve" items={GPU_FAQ} />
      </ViewportSection>

      <ViewportSection>
        <CtaBand
          title="Reserve capacity for your next run"
          subtitle="Per-second billing, no minimum term, cancel whenever the job finishes."
          primary={{ label: "Reserve a cluster", href: "/booking" }}
          secondary={{ label: "Compare buying instead", href: "/buy-gpu" }}
        />
      </ViewportSection>
    </div>
  );
}

/* Plain geometric glyphs — not brand marks. */

function ArrowRight() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path
        d="M2 5h6m0 0L5.5 2.5M8 5 5.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
      <path d="M3 1.5 9 5l-6 3.5V1.5Z" fill="currentColor" />
    </svg>
  );
}
