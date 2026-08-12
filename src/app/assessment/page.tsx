import Link from "next/link";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { Badge } from "@/components/ui/Badge";
import { ASSESSMENT_INTRO } from "@/config/assessment";

/**
 * Land Owner Assessment intro — Figma node 2:1152, transcribed from
 * `Ownerland.png`.
 *
 * Centred hero, three benefit cards, one CTA and a reassurance footnote. No
 * navigation chrome: the design treats this as the entry to a linear flow.
 */
export default function AssessmentIntroPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-[24px] py-[64px]">
      <AnimatedBackdrop stars />

      <Reveal className="relative flex w-full max-w-[900px] flex-col items-center gap-[24px] text-center">
        <Badge variant="pill">{ASSESSMENT_INTRO.badge}</Badge>

        <h1 className="font-sans text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-white lg:text-[48px]">
          {ASSESSMENT_INTRO.title}
        </h1>

        <p className="max-w-[680px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
          {ASSESSMENT_INTRO.body}
        </p>
      </Reveal>

      <div className="relative mt-[48px] grid w-full max-w-[900px] grid-cols-1 items-start gap-[24px] md:grid-cols-3">
        {ASSESSMENT_INTRO.cards.map((card, index) => (
          <Reveal key={card.title} delay={index * 80}>
            <SpotlightCard
              tilt
              className="card-highlight flex h-full flex-col items-center gap-[16px] rounded-card border border-line-hair bg-card p-[25px] text-center"
            >
              <span
                aria-hidden
                className="relative grid size-[44px] place-items-center rounded-field border border-accent/30 bg-accent-soft"
              >
                <span className="size-[14px] rounded-[3px] border-2 border-accent" />
              </span>

              <h2 className="relative font-sans text-[18px] font-semibold leading-[26px] text-white">
                {card.title}
              </h2>

              <p className="relative font-sans text-[14px] leading-[22px] text-ink-dim">
                {card.body}
              </p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={160} className="relative mt-[48px] flex flex-col items-center gap-[16px]">
        <Link
          href={ASSESSMENT_INTRO.cta.href}
          className="inline-flex items-center gap-[10px] rounded-full bg-accent px-[36px] py-[15px] font-sans text-[12px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_24px_rgba(0,242,255,0.5)]"
        >
          {ASSESSMENT_INTRO.cta.label}
          <span aria-hidden>→</span>
        </Link>

        <p className="font-mono text-[11px] leading-[16px] tracking-[0.6px] text-ink-faint">
          {ASSESSMENT_INTRO.footnote}
        </p>
      </Reveal>
    </main>
  );
}
