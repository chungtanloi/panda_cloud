import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Numbered process steps. Added section — not in the Figma file.
 *
 * Uses the existing glass-card language: #1e2024 surface, hairline border,
 * accent numerals, and a connecting rule between steps on wide viewports.
 */
export interface ProcessStep {
  title: string;
  description: string;
}

export function HowItWorks({
  eyebrow = "How it works",
  title,
  subtitle,
  steps,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  steps: readonly ProcessStep[];
}) {
  return (
    <section className="flex flex-col gap-[40px]">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <ol className="relative grid grid-cols-1 gap-[24px] md:grid-cols-2 lg:grid-cols-4">
        {/* Connector rule, hidden when the steps stack. */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-[46px] hidden h-px bg-gradient-to-r from-transparent via-line-soft to-transparent lg:block"
        />

        {steps.map((step, index) => (
          <Reveal as="li" key={step.title} delay={index * 80}>
            <div className="card-highlight hover-lift relative flex h-full flex-col gap-[16px] rounded-card border border-line-hair bg-card p-[25px]">
              <span
                aria-hidden
                className="flex size-[44px] items-center justify-center rounded-full border border-accent/30 bg-accent-soft font-sans text-[16px] font-bold text-accent"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="font-sans text-[20px] font-medium leading-[28px] text-white">
                {step.title}
              </h3>

              <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
                {step.description}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
