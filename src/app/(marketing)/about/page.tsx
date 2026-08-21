import type { Metadata } from "next";
import { AssetPlaceholder } from "@/components/marketing/AssetPlaceholder";
import { LeadershipProfileCard } from "@/components/marketing/LeadershipProfileCard";
import { ViewportSection } from "@/components/marketing/ViewportSection";
import { CtaBand } from "@/components/marketing/sections/CtaBand";
import { HowItWorks } from "@/components/marketing/sections/HowItWorks";
import { SectionHeading } from "@/components/marketing/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { ABOUT_PAGE, LEADERSHIP_PROFILES, type AboutCard } from "@/config/about";

export const metadata: Metadata = {
  title: "About Panda Cloud.AI | AI Infrastructure",
  description:
    "Meet Panda Cloud.AI and learn how we bring compute, data centers, energy, sites, operations and capital together.",
};

function CardGrid({ cards, columns = 4 }: { cards: readonly AboutCard[]; columns?: 3 | 4 }) {
  return (
    <div className={columns === 3 ? "grid gap-[20px] md:grid-cols-3" : "grid gap-[20px] md:grid-cols-2 xl:grid-cols-4"}>
      {cards.map((card, index) => (
        <Reveal key={card.title} delay={index * 60}>
          <SpotlightCard className="card-highlight flex h-full flex-col rounded-card border border-line-hair bg-card p-[25px]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[1.1px] text-accent">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="pt-[18px] font-sans text-[20px] font-medium leading-[28px] text-white">
              {card.title}
            </h3>
            <p className="pt-[10px] font-sans text-[15px] leading-[24px] text-ink-dim">
              {card.description}
            </p>
          </SpotlightCard>
        </Reveal>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      <ViewportSection className="border-b border-line-band bg-band">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-[48px] px-[24px] lg:grid-cols-2 lg:gap-[64px] lg:px-[64px]">
          <Reveal>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[1.8px] text-accent">
              {ABOUT_PAGE.hero.eyebrow}
            </p>
            <h1 className="max-w-[660px] pt-[18px] font-sans text-[40px] font-semibold leading-[1.04] tracking-[-1.5px] text-white md:text-[52px] lg:text-[64px]">
              {ABOUT_PAGE.hero.title}
            </h1>
            <div className="max-w-[680px] space-y-[18px] pt-[28px]">
              {ABOUT_PAGE.hero.paragraphs.map((paragraph) => (
                <p key={paragraph} className="font-sans text-[16px] leading-[26px] text-ink-dim">
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={100} className="card-highlight rounded-field border border-line-hair bg-card p-[9px]">
            <AssetPlaceholder
              node="1:74"
              label="AI data center infrastructure"
              src="/assets/visuals/liquid-cooled-data-hall.png"
              alt="Liquid-cooled server racks inside a modern AI data center"
              priority
              className="aspect-[4/3] w-full rounded-card"
            />
          </Reveal>
        </div>
      </ViewportSection>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col px-[24px] lg:px-[64px]">
        <ViewportSection>
          <section className="flex flex-col gap-[40px]">
            <SectionHeading
              eyebrow={ABOUT_PAGE.system.eyebrow}
              title={ABOUT_PAGE.system.title}
              subtitle={ABOUT_PAGE.system.subtitle}
            />
            <CardGrid cards={ABOUT_PAGE.capabilities} />
          </section>
        </ViewportSection>

        <ViewportSection>
          <HowItWorks
            eyebrow={ABOUT_PAGE.approach.eyebrow}
            title={ABOUT_PAGE.approach.title}
            subtitle={ABOUT_PAGE.approach.subtitle}
            steps={ABOUT_PAGE.approach.steps}
          />
        </ViewportSection>

        <ViewportSection>
          <section className="flex flex-col gap-[40px]">
            <SectionHeading
              eyebrow="Who we work with"
              title="Built for the parties that make infrastructure possible."
              subtitle="Panda Cloud.AI connects the organizations that demand compute with the sites, operators and capital that deliver it."
            />
            <CardGrid cards={ABOUT_PAGE.audiences} />
          </section>
        </ViewportSection>

        <ViewportSection>
          <section className="grid items-center gap-[40px] lg:grid-cols-[0.8fr_1.2fr] lg:gap-[64px]">
            <SectionHeading
              eyebrow="Why Panda Cloud.AI"
              title="Client economics first. Long-term by design."
              subtitle={ABOUT_PAGE.closing}
              align="left"
            />
            <CardGrid cards={ABOUT_PAGE.proof} columns={3} />
          </section>
        </ViewportSection>

        <ViewportSection>
          <section className="flex flex-col gap-[40px]">
            <SectionHeading
              eyebrow={ABOUT_PAGE.leadership.eyebrow}
              title={ABOUT_PAGE.leadership.title}
              subtitle={ABOUT_PAGE.leadership.subtitle}
            />
            <div className="grid items-stretch gap-[24px] lg:grid-cols-3">
              {LEADERSHIP_PROFILES.map((profile, index) => (
                <Reveal key={profile.id} delay={index * 80}>
                  <LeadershipProfileCard profile={profile} />
                </Reveal>
              ))}
            </div>
          </section>
        </ViewportSection>

        <ViewportSection>
          <section className="flex flex-col gap-[40px]">
            <SectionHeading
              eyebrow={ABOUT_PAGE.engagements.eyebrow}
              title="Experience that will be shared with permission."
              subtitle="We protect client confidentiality while approved project narratives are prepared."
            />
            <Reveal>
              <SpotlightCard className="card-highlight mx-auto flex max-w-[880px] flex-col items-center rounded-card border border-line-hair bg-card p-[36px] text-center lg:p-[48px]">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[1.4px] text-accent">
                  {ABOUT_PAGE.engagements.title}
                </p>
                <p className="max-w-[680px] pt-[18px] font-sans text-[16px] leading-[26px] text-ink-dim">
                  {ABOUT_PAGE.engagements.description}
                </p>
              </SpotlightCard>
            </Reveal>
          </section>
        </ViewportSection>

        <ViewportSection>
          <CtaBand
            title={ABOUT_PAGE.cta.title}
            subtitle={ABOUT_PAGE.cta.subtitle}
            primary={ABOUT_PAGE.cta.primary}
            secondary={ABOUT_PAGE.cta.secondary}
          />
        </ViewportSection>
      </div>
    </div>
  );
}
