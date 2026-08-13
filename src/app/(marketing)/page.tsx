import Link from "next/link";
import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import { BentoCard } from "@/components/marketing/BentoCard";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { CtaBand } from "@/components/marketing/sections/CtaBand";
import { FaqAccordion } from "@/components/marketing/sections/FaqAccordion";
import { HowItWorks } from "@/components/marketing/sections/HowItWorks";
import { SocialProof } from "@/components/marketing/sections/SocialProof";
import { UseCases } from "@/components/marketing/sections/UseCases";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { AIScan } from "@/components/effects/AIScan";
import { DataFlowConnector } from "@/components/effects/DataFlowConnector";
import { InfraHud } from "@/components/effects/InfraHud";
import { ABOUT, ECOSYSTEM, HERO, METRICS, NETWORK, SERVICES } from "@/config/landing";
import {
  LANDING_FAQ,
  LANDING_STEPS,
  LANDING_USE_CASES,
  SOCIAL_PROOF,
} from "@/config/marketingSections";
import { cn } from "@/lib/cn";
import { GlobalNetworkGlobe } from "@/components/globe";
import { networkNodesToGlobeLocations } from "@/components/globe/networkAdapter";
/**
 * Landing page — Figma node 1:3 ("Main Content" inside frame 1:2).
 *
 * Four stacked sections: Hero (1:48), About (1:71), Service Ecosystem (1:95)
 * and Trust & Scale Metrics (1:4). Figma positions these absolutely at fixed
 * offsets; here they are normal flow so the page reflows correctly at every
 * width — the visual result at 1280px is identical.
 *
 * This is a Server Component: the copy is static, so nothing ships to the
 * client. When the content moves behind an API, swap in a controller and keep
 * this file's markup unchanged.
 */
export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <DataFlowConnector label="DATA" />
      <AboutSection />
      <DataFlowConnector label="COMPUTE" />
      <EcosystemSection />

      {/* --- Sections below are additions, not from the Figma file.
              See config/marketingSections.ts for the rationale. --- */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
        <ViewportSection>
          <HowItWorks
            title="Four steps from question to capacity"
            subtitle="No sales call required to get a number you can take to procurement."
            steps={LANDING_STEPS}
          />
        </ViewportSection>

        <ViewportSection>
          <UseCases
            title="Built for three different jobs"
            subtitle="Compute, land and construction sit on the same platform because they gate each other."
            cases={LANDING_USE_CASES}
          />
        </ViewportSection>

        <ViewportSection>
          <SocialProof
            title="Operating at production scale"
            subtitle="Live capacity across Taiwan, Norway and the United States."
            stats={SOCIAL_PROOF.stats}
            logos={SOCIAL_PROOF.logos}
            testimonials={SOCIAL_PROOF.testimonials}
          />
        </ViewportSection>

        <ViewportSection>
          <FaqAccordion title="Common questions" items={LANDING_FAQ} />
        </ViewportSection>
      </div>

      <DataFlowConnector label="AI" />
      <MetricsSection />

      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
        <ViewportSection>
          <CtaBand
            title="Start where it makes sense for you"
            subtitle="Rent compute today, or find out what your land and power are worth. Both are free to begin."
            primary={{ label: "Choose your path", href: "/choose-path" }}
            secondary={{ label: "Browse GPUs", href: "/gpu-renting" }}
          />
        </ViewportSection>
      </div>
    </>
  );
}

/* ------------------------------- Hero (1:48) ------------------------------ */

function HeroSection() {
  return (
    <section className="relative flex items-center overflow-hidden py-[48px] lg:min-h-[calc(100svh-73px)] lg:py-[64px]">
      <AnimatedBackdrop stars />
      <AIScan />

      {/* Radial depth overlay — node 1:49 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(17,19,24,0) 0%, rgba(17,19,24,1) 80%)",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-[48px] px-[24px] lg:grid-cols-2 lg:px-[64px]">
        <Reveal className="flex flex-col items-start">
          <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent/15 px-[13px] py-[7px]">
            <span aria-hidden className="size-[8px] rounded-full bg-accent" />
            <span className="font-sans text-[14px] font-semibold leading-[20px] tracking-[0.7px] text-accent">
              {HERO.badge}
            </span>
          </span>

          {/* Figma sets 72px/80px. Capped to 64px/70px at this breakpoint so
              the five-line headline plus body and CTAs still fit one screen at
              1080p — the design's own line breaks are preserved. */}
          <h1 className="pt-[24px] font-sans text-[40px] font-bold leading-[1.11] tracking-[-1.44px] text-white lg:text-[64px] lg:leading-[70px] 2xl:text-[72px] 2xl:leading-[80px]">
            {HERO.titleLead.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
            {HERO.titleAccent.map((line) => (
              <span key={line} className="text-gradient-accent gradient-sweep block">
                {line}
              </span>
            ))}
          </h1>

          <p className="max-w-[672px] pt-[24px] font-sans text-[18px] leading-[28.8px] text-ink-dim">
            {HERO.body}
          </p>

          <div className="flex flex-wrap items-center gap-[16px] pt-[28px]">
            {/* Both CTAs are unfilled in the design — colour alone distinguishes
                them (nodes 1:62 / 1:66). Kept faithful; see the contrast note
                in docs/FIGMA_SCREEN_MAP.md. */}
            <Link
              href={HERO.primaryCta.href}
              className="cta-connect inline-flex items-center gap-[8px] rounded-panel px-[32px] py-[16px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent-deep transition-colors hover:text-accent"
            >
              {HERO.primaryCta.label}
              <ArrowRight />
            </Link>

            <Link
              href={HERO.secondaryCta.href}
              className="inline-flex items-center rounded-panel px-[32px] py-[16px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent hover:underline"
            >
              {HERO.secondaryCta.label}
            </Link>
          </div>
        </Reveal>

        <Reveal delay={120} className="relative">
          {/* Figma height is 552px; capped with a viewport-relative max so the
              two-column hero still fits one screen on a 1080p laptop. */}
          <AssetPlaceholder
            node="1:70"
            label="AI infrastructure campus"
            src="/assets/visuals/energy-land-campus.png"
            alt="Aerial view of an AI data center campus connected to renewable power and grid infrastructure"
            priority
            className="h-[552px] max-h-[min(552px,52svh)] w-full max-w-[600px] rounded-panel shadow-[0px_0px_40px_0px_rgba(0,242,255,0.3)]"
          />

          {/* Decorative "system is running" HUD — demo figures, not backend
              data. Hidden below lg so it never crowds the mobile layout. */}
          <InfraHud
            className="absolute bottom-[16px] left-[16px] hidden lg:flex"
            title="GPU CLUSTER"
            metrics={[
              { label: "COMPUTE", percent: 82 },
              { label: "NETWORK", percent: 76 },
            ]}
            counter={{ label: "ACTIVE NODES", value: 128 }}
            statusLines={["SYSTEM ONLINE", "PROCESSING"]}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ About (1:71) ------------------------------ */

function AboutSection() {
  return (
    <section className="flex flex-col justify-center border-y border-line-band bg-band py-[48px] lg:min-h-[calc(100svh-73px)] lg:py-[64px]">
      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 items-center gap-[64px] px-[24px] lg:grid-cols-2 lg:px-[64px]">
        <Reveal className="card-highlight hover-lift w-full max-w-[553px] rounded-field border border-line-hair bg-card p-[9px]">
          <AssetPlaceholder
            node="1:74"
            label="Data center visual"
            src="/assets/visuals/liquid-cooled-data-hall.png"
            alt="Liquid-cooled server racks inside a modern AI data center"
            className="aspect-[4/3] max-h-[52svh] w-full rounded-card"
          />
        </Reveal>

        <Reveal delay={100} className="max-w-[535px]">
          <h2 className="font-sans text-[16px] leading-[24px] text-white">{ABOUT.eyebrow}</h2>

          <p className="pt-[23px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {ABOUT.body}
          </p>

          <ul className="flex flex-col gap-[16px] pt-[40px]">
            {ABOUT.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-[12px]">
                <CheckIcon />
                <span className="font-sans text-[16px] leading-[25.6px] text-ink">{bullet}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------------------- Ecosystem (1:95) ---------------------------- */

function EcosystemSection() {
  const [gpu, hardware, energy, financing] = SERVICES;

  return (
    <section className="flex flex-col justify-center bg-base py-[48px] lg:min-h-[calc(100svh-73px)] lg:py-[64px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[40px] px-[24px] lg:px-[64px]">
        <Reveal className="flex max-w-[672px] flex-col gap-[16px] text-center">
          <h2 className="font-sans text-[16px] leading-[24px] text-white">{ECOSYSTEM.eyebrow}</h2>
          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {ECOSYSTEM.subtitle}
          </p>
        </Reveal>

        {/* Bento layout — node 1:102.
            Row 1: GPU Renting spans 2 cols, Buy Hardware takes col 3.
            Row 2: Energy & Land takes col 1, Financing spans cols 2–3. */}
        <div className="grid w-full grid-cols-1 gap-[24px] lg:grid-cols-3">
          {gpu ? (
            <Reveal className="lg:col-span-2">
              <SpotlightCard className="h-full rounded-field">
                <BentoCard {...toCardProps(gpu)} glow className="h-full lg:min-h-[298.78px]" />
              </SpotlightCard>
            </Reveal>
          ) : null}

          {hardware ? (
            <Reveal delay={60}>
              <SpotlightCard className="h-full rounded-field">
                <BentoCard {...toCardProps(hardware)} className="h-full lg:min-h-[298.78px]" />
              </SpotlightCard>
            </Reveal>
          ) : null}

          {energy ? (
            <Reveal delay={120}>
              <SpotlightCard className="h-full rounded-field">
                <BentoCard {...toCardProps(energy)} className="h-full lg:min-h-[324.38px]" />
              </SpotlightCard>
            </Reveal>
          ) : null}

          {financing ? (
            <Reveal delay={180} className="lg:col-span-2">
              <SpotlightCard className="h-full rounded-field">
                <BentoCard
                  {...toCardProps(financing)}
                  className="h-full lg:min-h-[324.38px]"
                  aside={
                    <AssetPlaceholder
                      node="1:152"
                      label="Financing orb"
                      src="/assets/visuals/gpu-cluster-closeup.png"
                      alt="Close-up of liquid-cooled GPU accelerator hardware"
                      className="size-[128px] rounded-full shadow-[0px_0px_20px_0px_rgba(0,242,255,0.3)]"
                    />
                  }
                />
              </SpotlightCard>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function toCardProps(service: (typeof SERVICES)[number]) {
  return {
    title: service.title,
    description: service.description,
    linkLabel: service.linkLabel,
    href: service.href,
  };
}

/* ----------------------------- Metrics (1:4) ------------------------------ */

function MetricsSection() {
  return (
    <section className="flex flex-col justify-center border-t border-line-faint bg-muted px-[24px] py-[48px] lg:min-h-[calc(100svh-73px)] lg:px-[64px] lg:py-[64px]">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-[48px] lg:flex-row">
        <Reveal delay={120} className="w-full flex-1">
          <h3 className="font-sans text-[32px] font-semibold leading-[38.4px] tracking-[-0.64px] text-white">
            {NETWORK.title}
          </h3>

          <p className="pt-[23px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {NETWORK.body}
          </p>

          <div className="pt-[40px]">
            <GlobalNetworkGlobe
              locations={networkNodesToGlobeLocations(NETWORK.nodes)}
              autoRotate
              rotationSpeed={0.15}
              showConnections
              showPulse
              interactive
              intensity={0.75}
            />
          </div>
        </Reveal>

        <div className="grid w-full flex-1 grid-cols-1 gap-[32px] sm:grid-cols-2">
          {METRICS.map((metric, index) => (
            <Reveal key={metric.label} delay={index * 60}>
              <div className="card-highlight hover-lift flex min-h-[142px] flex-col items-center justify-center gap-[8px] rounded-card border border-line-hair bg-card p-[25px]">
                <CountUp
                  value={metric.value}
                  className="text-gradient-accent text-center font-sans text-[40px] font-bold leading-[60px]"
                />
                <p className="text-center font-sans text-[16px] font-bold leading-[24px] text-ink-dim">
                  {metric.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------- Icons --------------------------------- */

/** Node 1:64 — 13.3px arrow. Plain stroke. */
function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M2.5 6.5h8m0 0-3.25-3.25M10.5 6.5 7.25 9.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Node 1:84 — 20×22 check. Plain stroke. */
function CheckIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden className="shrink-0 text-accent">
      <path
        d="M4 11.5 8 15.5 16 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
