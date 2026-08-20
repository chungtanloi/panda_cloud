import Link from "next/link";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { BOOKING_INTRO } from "@/config/booking";
import { FlowHeader } from "@/components/wizard/FlowChrome";

/**
 * GPU Cluster Booking entry — transcribed from `GPU.png`.
 *
 * Centred hero, three capability cards, three reassurance chips, one CTA.
 * No navigation chrome: the design treats this as the door into a linear flow.
 */
export default function BookingIntroPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-[24px] py-[64px]">
      <AnimatedBackdrop stars />
      <div className="absolute left-0 right-0 top-0">
        <FlowHeader exitHref="/" exitLabel="Back to home" />
      </div>

      <Reveal className="relative flex w-full max-w-[820px] flex-col items-center gap-[20px] text-center">
        <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px] font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-accent">
          <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
          {BOOKING_INTRO.badge}
        </span>

        <h1 className="font-sans text-[36px] font-bold leading-[1.15] tracking-[-1.2px] text-white lg:text-[48px]">
          {BOOKING_INTRO.titleLead}
          <span className="text-accent">{BOOKING_INTRO.titleAccent}</span>
        </h1>

        <p className="max-w-[620px] font-sans text-[15px] leading-[24px] text-ink-dim">
          {BOOKING_INTRO.body}
        </p>
      </Reveal>

      <div className="relative mt-[44px] grid w-full max-w-[900px] grid-cols-1 items-start gap-[20px] md:grid-cols-3">
        {BOOKING_INTRO.cards.map((card, index) => (
          <Reveal key={card.title} delay={index * 80}>
            <SpotlightCard
              tilt
              className="card-highlight flex h-full flex-col gap-[14px] rounded-card border border-line-hair bg-card p-[24px]"
            >
              <span
                aria-hidden
                className="relative grid size-[40px] place-items-center rounded-field border border-accent/30 bg-accent-soft"
              >
                <span className="size-[13px] rounded-[3px] border-2 border-accent" />
              </span>

              <h2 className="relative font-sans text-[17px] font-semibold leading-[25px] text-white">
                {card.title}
              </h2>

              <p className="relative font-sans text-[13px] leading-[21px] text-ink-dim">
                {card.body}
              </p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>

      <Reveal delay={200} className="relative mt-[36px] flex flex-wrap justify-center gap-[10px]">
        {BOOKING_INTRO.chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-[6px] rounded-full border border-line-soft bg-white/[0.03] px-[14px] py-[7px] font-sans text-[12px] leading-[16px] text-ink-dim"
          >
            <span aria-hidden className="text-accent">
              ✦
            </span>
            {chip}
          </span>
        ))}
      </Reveal>

      <Reveal delay={260} className="relative mt-[44px]">
        <Link
          href={BOOKING_INTRO.cta.href}
          className="inline-flex items-center gap-[10px] rounded-full bg-accent px-[40px] py-[16px] font-sans text-[18px] font-semibold leading-[24px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_28px_rgba(0,242,255,0.5)]"
        >
          {BOOKING_INTRO.cta.label}
          <span aria-hidden>→</span>
        </Link>
      </Reveal>
    </main>
  );
}
