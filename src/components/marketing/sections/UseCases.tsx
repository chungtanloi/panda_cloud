import { Reveal } from "@/components/motion/Reveal";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { SectionHeading } from "./SectionHeading";

/**
 * Use-case cards. Added section — not in the Figma file.
 *
 * Each card states who it is for and what they get, which is the part the
 * original design never covered.
 */
export interface UseCase {
  audience: string;
  title: string;
  description: string;
  outcomes: readonly string[];
}

export function UseCases({
  eyebrow = "Use cases",
  title,
  subtitle,
  cases,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  cases: readonly UseCase[];
}) {
  return (
    <section className="flex flex-col gap-[40px]">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-3">
        {cases.map((useCase, index) => (
          <Reveal key={useCase.title} delay={index * 80}>
            <SpotlightCard className="card-highlight flex h-full flex-col gap-[16px] rounded-card border border-line-hair bg-card p-[25px]">
              <span className="relative w-fit rounded-field border border-accent-line bg-accent-soft px-[9px] py-[5px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-accent">
                {useCase.audience}
              </span>

              <h3 className="relative font-sans text-[20px] font-medium leading-[28px] text-white">
                {useCase.title}
              </h3>

              <p className="relative font-sans text-[16px] leading-[25.6px] text-ink-dim">
                {useCase.description}
              </p>

              <ul className="relative mt-auto flex flex-col gap-[8px] border-t border-line-soft pt-[16px]">
                {useCase.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-[8px]">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                      className="mt-[5px] shrink-0 text-accent"
                    >
                      <path
                        d="M3 8.5 6.5 12 13 4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="font-sans text-[14px] leading-[22px] text-ink">{outcome}</span>
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
