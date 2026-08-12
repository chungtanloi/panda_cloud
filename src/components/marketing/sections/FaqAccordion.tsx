import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * FAQ accordion. Added section — not in the Figma file.
 *
 * Built on native <details>/<summary>: keyboard and screen-reader behaviour is
 * correct with no JavaScript, and it works before hydration. That also keeps
 * the enclosing page a Server Component.
 */
export interface FaqItem {
  question: string;
  answer: string;
}

export function FaqAccordion({
  eyebrow = "FAQ",
  title,
  subtitle,
  items,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  items: readonly FaqItem[];
}) {
  return (
    <section className="flex flex-col gap-[40px]">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <div className="mx-auto flex w-full max-w-[880px] flex-col gap-[12px]">
        {items.map((item, index) => (
          <Reveal key={item.question} delay={index * 50}>
            <details className="group card-highlight rounded-panel border border-line-hair bg-card transition-colors open:border-accent/40 hover:border-accent/30">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-[16px] p-[25px] font-sans text-[16px] font-medium leading-[24px] text-white [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="grid size-[24px] shrink-0 place-items-center rounded-full border border-line-soft text-accent transition-transform duration-200 group-open:rotate-45"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 2v8M2 6h8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </summary>

              <p className="px-[25px] pb-[25px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
                {item.answer}
              </p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
