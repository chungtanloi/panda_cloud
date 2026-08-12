import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { INVESTMENT_LANDING } from "@/config/investment";

/**
 * AI Token Investment landing — transcribed from the left half of `AI.png`.
 *
 * Keeps the marketing navigation, as the design shows: this is a public
 * product page, not part of the linear wizard.
 */
export default function InvestmentLandingPage() {
  const config = INVESTMENT_LANDING;

  return (
    <>
      <TopNavBar />

      <main className="relative mx-auto flex w-full max-w-[1280px] flex-1 items-center px-[24px] py-[56px] lg:px-[40px]">
        <AnimatedBackdrop stars />

        <div className="relative grid w-full grid-cols-1 items-center gap-[48px] lg:grid-cols-2">
          <Reveal className="flex flex-col items-start gap-[20px]">
            <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px] font-sans text-[12px] leading-[16px] text-accent">
              <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
              {config.badge}
            </span>

            <h1 className="font-sans text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-white lg:text-[44px]">
              {config.titleLead}
              <span className="text-accent">{config.titleAccent}</span>
            </h1>

            <p className="max-w-[520px] font-sans text-[14px] leading-[23px] text-ink-dim">
              {config.body}
            </p>

            <div className="flex flex-wrap items-center gap-[14px] pt-[6px]">
              <Link
                href={config.primaryCta.href}
                className="inline-flex items-center gap-[8px] rounded-full bg-accent px-[28px] py-[13px] font-sans text-[14px] font-bold leading-[20px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
              >
                {config.primaryCta.label}
                <span aria-hidden>→</span>
              </Link>

              <Link
                href={config.secondaryCta.href}
                className="rounded-full border border-line-strong px-[28px] py-[13px] font-sans text-[14px] font-medium leading-[20px] text-ink transition-colors hover:border-accent hover:text-accent"
              >
                {config.secondaryCta.label}
              </Link>
            </div>

            <ul className="flex flex-col gap-[8px] pt-[10px]">
              {config.chips.map((chip) => (
                <li
                  key={chip}
                  className="inline-flex w-fit items-center gap-[8px] rounded-field border border-accent/20 bg-accent-soft px-[10px] py-[6px] font-sans text-[11px] leading-[16px] text-accent"
                >
                  <span aria-hidden>✦</span>
                  {chip}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="flex flex-col gap-[16px]">
            {config.cards.map((card, index) => (
              <Reveal key={card.title} delay={index * 80}>
                <SpotlightCard className="card-highlight flex flex-col gap-[10px] rounded-card border border-line-hair bg-card p-[22px]">
                  <span className="relative flex items-start justify-between gap-[12px]">
                    <span
                      aria-hidden
                      className="grid size-[34px] place-items-center rounded-field border border-accent/30 bg-accent-soft"
                    >
                      <span className="size-[11px] rounded-[2px] border-2 border-accent" />
                    </span>

                    {"badge" in card && card.badge ? (
                      <span className="rounded-field border border-accent-line bg-accent-soft px-[9px] py-[4px] font-mono text-[9px] uppercase tracking-[1.1px] text-accent">
                        {card.badge}
                      </span>
                    ) : null}
                  </span>

                  <h2 className="relative font-sans text-[17px] font-semibold leading-[25px] text-white">
                    {card.title}
                  </h2>

                  <p className="relative font-sans text-[12px] leading-[19px] text-ink-dim">
                    {card.body}
                  </p>
                </SpotlightCard>
              </Reveal>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
