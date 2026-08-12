import Link from "next/link";
import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { ContactForm } from "@/components/marketing/sections/ContactForm";
import { FaqAccordion } from "@/components/marketing/sections/FaqAccordion";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { BUY_CTA, BUY_HERO, COMPARISON, HARDWARE_OFFERS } from "@/config/buyGpu";
import { BUY_FAQ } from "@/config/marketingSections";
import { cn } from "@/lib/cn";

/**
 * Buy GPU — Figma node 2:219.
 *   page       — px 64, py 120, 120px between sections
 *   hero       — badge, small headline, body, framed mockup with bottom fade
 *   cards      — three 370.66px panels, radius 48, padding 33, corner glow
 *   comparison — 3-column table, the "Buy" column tinted rgba(0,242,255,.05)
 *   cta        — full-width centred accent pill, 24px semibold black text
 *
 * Server Component — all content is static.
 */
export default function BuyGpuPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
      <ViewportSection>
        <HeroSection />
      </ViewportSection>

      <ViewportSection>
        <HardwareSection />
      </ViewportSection>

      <ViewportSection>
        <ComparisonSection />
      </ViewportSection>

      {/* --- Sections below are additions, not from the Figma file.
              See config/marketingSections.ts for the rationale. --- */}

      <ViewportSection>
        <FaqAccordion title="Buying questions" items={BUY_FAQ} />
      </ViewportSection>

      <ViewportSection>
        <ContactForm
          title="Request a purchase quote"
          subtitle="Tell us the configuration and we'll come back with pricing and lead times."
          defaultInterests={["buy_gpu"]}
        />
      </ViewportSection>

      <ViewportSection>
        <CtaSection />
      </ViewportSection>
    </div>
  );
}

/* ------------------------------ Hero (2:220) ------------------------------ */

function HeroSection() {
  return (
    <Reveal as="section" className="relative flex flex-col items-center gap-[40px] text-center">
      <AnimatedBackdrop stars />

      {/* Radial wash — node 2:221 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(0,242,255,0.1) 0%, rgba(0,242,255,0) 70%)",
        }}
      />

      <span className="relative inline-flex items-center gap-[8px] rounded-full border border-line-strong bg-card px-[17px] py-[9px]">
        <span aria-hidden className="pulse-dot size-[8px] rounded-full bg-accent" />
        <span className="font-sans text-[12px] font-medium leading-[12px] tracking-[0.6px] text-accent">
          {BUY_HERO.badge}
        </span>
      </span>

      {/* Deliberately 16px — see the note in config/buyGpu.ts. */}
      <h1 className="relative font-sans text-[16px] leading-[24px] text-ink">
        {BUY_HERO.titleLead}
        <span className="text-accent">{BUY_HERO.titleAccent}</span>
        {BUY_HERO.titleTail}
      </h1>

      <p className="relative max-w-[672px] px-[16px] font-sans text-[16px] leading-[24px] text-ink-dim">
        {BUY_HERO.body}
      </p>

      {/* The design's 1022:725 mockup is ~726px tall at full width, which does
          not leave room for the badge, headline and body on a 1080p screen.
          Height is capped; the aspect ratio holds below the cap. */}
      <div className="relative w-full max-w-[1024px] pt-[16px]">
        <div className="relative overflow-hidden rounded-card border border-line bg-panel p-px shadow-auth backdrop-blur-card">
          <AssetPlaceholder
            node="2:231"
            label="Server racks in a data center"
            className="aspect-[1022/725] max-h-[calc(100svh-360px)] w-full rounded-card opacity-80"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to top, #0c0e12 0%, rgba(12,14,18,0) 50%, rgba(12,14,18,0) 100%)",
            }}
          />
        </div>
      </div>
    </Reveal>
  );
}

/* ---------------------------- Hardware (2:233) ---------------------------- */

function HardwareSection() {
  return (
    <section className="grid grid-cols-1 items-start gap-grid lg:grid-cols-3">
      {HARDWARE_OFFERS.map((offer, index) => (
        <Reveal key={offer.id} delay={index * 80}>
        <SpotlightCard
          tilt
          className="relative flex h-full flex-col gap-[24px] overflow-hidden rounded-card border border-line-soft bg-panel p-[33px] backdrop-blur-card"
        >
          {/* Corner glow — node 2:251 */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-[64px] -top-[64px] size-[128px] rounded-full bg-accent/5 blur-[32px]"
          />

          {offer.popular ? (
            <span className="absolute right-[16px] top-[16px] rounded-[2px] border border-accent-line bg-accent-soft px-[9px] py-[5px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent">
              POPULAR
            </span>
          ) : null}

          <p className="relative pt-[16px] font-sans text-[16px] leading-[24px] text-ink">
            {offer.title}
          </p>

          <p className="relative font-sans text-[16px] leading-[24px] text-ink-dim">
            {offer.description}
          </p>

          <div className="relative mt-auto flex flex-col gap-[16px] border-t border-line-faint pt-[33px]">
            <p className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-dim">
              {offer.priceLabel}
            </p>
            <p className="font-sans text-[16px] leading-[24px] text-accent [text-shadow:0px_0px_10px_rgba(0,242,255,0.3)]">
              <CountUp value={offer.priceValue} />
              {offer.priceSuffix ? (
                <span className="text-ink-dim"> {offer.priceSuffix}</span>
              ) : null}
            </p>
          </div>

          <div className="relative pt-[24px]">
            <Link
              href={offer.ctaHref}
              className="flex w-full items-center justify-center gap-[8px] rounded-panel border border-accent/30 py-[13px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent transition-colors hover:border-accent"
            >
              {offer.ctaLabel}
              <ArrowRight />
            </Link>
          </div>
        </SpotlightCard>
        </Reveal>
      ))}
    </section>
  );
}

/* --------------------------- Comparison (2:290) --------------------------- */

function ComparisonSection() {
  return (
    <section className="flex flex-col gap-[32px]">
      <Reveal className="flex flex-col items-center gap-[16px] text-center">
        <h2 className="font-sans text-[16px] leading-[24px] text-ink">{COMPARISON.title}</h2>
        <p className="font-sans text-[16px] leading-[24px] text-ink-dim">{COMPARISON.subtitle}</p>
      </Reveal>

      <Reveal delay={80} className="overflow-x-auto">
        <table className="w-full min-w-[720px] overflow-hidden rounded-card border border-line-soft bg-panel backdrop-blur-card">
          <thead>
            <tr className="border-b border-line bg-panel-head">
              <th
                scope="col"
                className="w-1/3 px-[24px] pb-[36px] pt-[24px] text-left font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-dim"
              >
                {COMPARISON.columns.parameter}
              </th>
              <th
                scope="col"
                className="w-1/3 border-l border-line-faint p-[24px] text-center font-sans text-[16px] font-normal leading-[24px] text-ink"
              >
                {COMPARISON.columns.rent}
              </th>
              <th
                scope="col"
                className="w-1/3 border-l border-line-faint bg-accent/5 p-[24px] text-center font-sans text-[16px] font-normal leading-[24px] text-accent"
              >
                {COMPARISON.columns.buy}
              </th>
            </tr>
          </thead>

          <tbody>
            {COMPARISON.rows.map((row, index) => (
              <tr
                key={row.parameter}
                className={cn(index < COMPARISON.rows.length - 1 && "border-b border-line-faint")}
              >
                <th
                  scope="row"
                  className="p-[24px] text-left font-sans text-[16px] font-normal leading-[24px] text-ink"
                >
                  {row.parameter}
                </th>
                <td className="border-l border-line-faint p-[24px] text-center font-sans text-[16px] leading-[24px] text-ink-dim">
                  {row.rent}
                </td>
                <td
                  className={cn(
                    "border-l border-line-faint bg-accent/5 p-[24px] text-center font-sans text-[16px] leading-[24px]",
                    row.highlight ? "text-accent" : "text-ink-dim",
                  )}
                >
                  {row.buy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </section>
  );
}

/* ------------------------------- CTA (2:331) ------------------------------ */

function CtaSection() {
  return (
    <Reveal as="section" className="flex justify-center">
      <Link
        href={BUY_CTA.href}
        className="inline-flex items-center gap-[16px] rounded-card bg-accent px-[48px] py-[23.5px] font-sans text-[24px] font-semibold leading-[31.2px] text-black drop-shadow-[0px_0px_10px_rgba(0,242,255,0.2)] transition-all duration-200 hover:-translate-y-[2px] hover:opacity-90 hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
      >
        {BUY_CTA.label}
        <ArrowRight size={16} />
      </Link>
    </Reveal>
  );
}

/** Plain stroke arrow — not a brand glyph. */
function ArrowRight({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden>
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
