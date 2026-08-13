"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ContactForm } from "@/components/marketing/sections/ContactForm";
import { CtaBand } from "@/components/marketing/sections/CtaBand";
import { FaqAccordion } from "@/components/marketing/sections/FaqAccordion";
import { HowItWorks } from "@/components/marketing/sections/HowItWorks";
import { SocialProof } from "@/components/marketing/sections/SocialProof";
import { UseCases } from "@/components/marketing/sections/UseCases";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { ENERGY_HERO } from "@/config/energyLand";
import {
  ENERGY_FAQ,
  ENERGY_STEPS,
  ENERGY_USE_CASES,
  SOCIAL_PROOF,
} from "@/config/marketingSections";
import { cn } from "@/lib/cn";
import { useAsync } from "@/controllers/useAsync";
import type { RegionFacts } from "@/models/hyperscale";
import { api } from "@/services/api";

/**
 * Energy & Land — Figma node 2:405.
 *   backdrop — a 20%-opacity photo plus a faint white radial (node 2:406)
 *   header   — 16px statement line, body, accent CTA (radius 16, black text)
 *   grid     — three region cards, radius 32, padding 25, backdrop-blur 6
 *   card     — region/location, status chip, then four spec rows separated by
 *              1px rgba(255,255,255,.1) rules; the last row has no rule
 *
 * Server Component — all content is static.
 */
export default function EnergyLandPage() {
  const loadRegions = useCallback(() => api.hyperscale.listRegions(), []);
  const { state, run } = useAsync(loadRegions, { immediate: [] });

  return (
    <div className="relative">
      <AnimatedBackdrop stars />

      {/* Backdrop — node 2:406. The photo itself is pending export; the radial
          wash below is reproducible in CSS and is kept. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
        <ViewportSection>
        <Reveal as="section" className="flex flex-col items-center gap-[31px] text-center">
          <h1 className="max-w-[896px] font-sans text-[16px] leading-[20px] text-ink">
            {ENERGY_HERO.titleLead}
            <span className="text-accent">{ENERGY_HERO.titleAccent}</span>
          </h1>

          <p className="max-w-[672px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {ENERGY_HERO.body}
          </p>

          <Link
            href={ENERGY_HERO.cta.href}
            className="inline-flex items-center justify-center rounded-field bg-accent px-[32px] py-[16px] font-sans text-[12px] font-bold uppercase leading-[12px] tracking-[0.6px] text-black transition-all duration-200 hover:-translate-y-[2px] hover:opacity-90 hover:drop-shadow-[0px_0px_16px_rgba(0,242,255,0.4)]"
          >
            {ENERGY_HERO.cta.label}
          </Link>
        </Reveal>
        </ViewportSection>

        <ViewportSection id="sites">
          {state.status === "loading" || state.status === "idle" ? (
            <LoadingState label="Loading live site availability" />
          ) : state.status === "error" ? (
            <ErrorState error={state.error} onRetry={() => void run()} />
          ) : state.data.length === 0 ? (
            <EmptyState title="No sites currently published" message="Live site data will appear here when regions are available." />
          ) : (
          <section className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-3">
            {state.data.map((site, index) => (
              <Reveal key={site.id} delay={index * 80}>
                <SiteCard site={site} />
              </Reveal>
            ))}
          </section>
          )}
        </ViewportSection>

        {/* --- Sections below are additions, not from the Figma file.
                See config/marketingSections.ts for the rationale. --- */}

        <ViewportSection>
          <HowItWorks
            title="From parcel to assessment in four steps"
            subtitle="The whole process is free and takes about five minutes. Nothing commits you to develop."
            steps={ENERGY_STEPS}
          />
        </ViewportSection>

        <ViewportSection>
          <UseCases
            title="Who this is for"
            subtitle="Three different problems, one set of site data."
            cases={ENERGY_USE_CASES}
          />
        </ViewportSection>

        <ViewportSection>
          <SocialProof
            eyebrow="Scale"
            title="Capacity that is already energized"
            subtitle="Figures reflect live sites across Taiwan, Norway and the United States."
            stats={SOCIAL_PROOF.stats}
            logos={SOCIAL_PROOF.logos}
            testimonials={SOCIAL_PROOF.testimonials}
          />
        </ViewportSection>

        <ViewportSection>
          <FaqAccordion title="Questions land owners ask" items={ENERGY_FAQ} />
        </ViewportSection>

        {/* Linked to as /energy-land#enquiry from the assessment report. */}
        <ViewportSection id="enquiry">
          <ContactForm
            title="Talk to the site team"
            subtitle="Tell us about your parcel and we'll come back with an indicative view."
            defaultInterests={["energy_land"]}
          />
        </ViewportSection>

        <ViewportSection>
          <CtaBand
            title="Find out what your land is worth"
            subtitle="Free assessment, results in minutes, no obligation to proceed."
            primary={{ label: "Start the assessment", href: "/assessment" }}
            secondary={{ label: "See available sites", href: "#sites" }}
          />
        </ViewportSection>
      </div>
    </div>
  );
}

/** Figma nodes 2:416 / 2:448 / 2:479. */
function SiteCard({ site }: { site: RegionFacts }) {
  return (
    <SpotlightCard className="flex h-full flex-col gap-[24px] rounded-panel border border-line-card bg-surface p-[25px] backdrop-blur-chrome">
      <header className="relative flex items-start justify-between gap-[16px]">
        <div>
          <h2 className="font-sans text-[16px] leading-[25.6px] text-ink">{site.label}</h2>
          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">Live regional capacity</p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-[8px] rounded-field border px-[9px] py-[5px] font-sans text-[16px] leading-[25.6px]",
            "border-accent-line bg-accent-soft text-accent",
          )}
        >
          <span aria-hidden className="pulse-dot size-[8px] rounded-full bg-accent" />
          REGION
        </span>
      </header>

      <dl className="relative flex flex-col gap-[8px] pt-[16px]">
        {[
          { label: "Available power", value: site.availablePower, accent: true },
          { label: "Cooling", value: site.coolingType, accent: false },
        ].map((spec, index, specs) => {
          const isLast = index === specs.length - 1;

          return (
            <div
              key={spec.label}
              className={cn(
                "flex items-start justify-between gap-[16px]",
                isLast ? "pb-[8px]" : "border-b border-line-soft pb-[9px]",
              )}
            >
              <dt className="font-sans text-[16px] uppercase leading-[25.6px] text-ink-dim">
                {spec.label}
              </dt>
              <dd
                className={cn(
                  "text-right font-sans text-[16px] leading-[25.6px]",
                  spec.accent ? "text-accent" : "text-ink",
                )}
              >
                {spec.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </SpotlightCard>
  );
}
