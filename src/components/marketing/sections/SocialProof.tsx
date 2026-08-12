import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "./SectionHeading";

/**
 * Social proof — logo strip, headline figures, and testimonials.
 * Added section, not in the Figma file.
 *
 * ⚠ IMPORTANT: this component never invents customers. Quotes and logos are
 * rendered only from data you pass in. When `testimonials` or `logos` are
 * empty it draws a clearly-labelled placeholder so nothing fabricated can ship
 * by accident. Fill these from the real customer list before launch.
 */
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface ProofStat {
  value: string;
  label: string;
}

export function SocialProof({
  eyebrow = "Trusted by",
  title,
  subtitle,
  stats = [],
  logos = [],
  testimonials = [],
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: readonly ProofStat[];
  /** Customer names for the logo strip. Empty renders a placeholder. */
  logos?: readonly string[];
  /** Empty renders a placeholder rather than invented quotes. */
  testimonials?: readonly Testimonial[];
}) {
  return (
    <section className="flex flex-col gap-[40px]">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      {stats.length > 0 ? (
        <div className="grid grid-cols-1 gap-[24px] sm:grid-cols-3">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 70}>
              <div className="card-highlight hover-lift flex flex-col items-center gap-[8px] rounded-card border border-line-hair bg-card p-[25px] text-center">
                <CountUp
                  value={stat.value}
                  className="text-gradient-accent font-sans text-[36px] font-bold leading-[48px]"
                />
                <p className="font-sans text-[14px] leading-[22px] text-ink-dim">{stat.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      ) : null}

      {/* Logo strip */}
      <Reveal>
        {logos.length > 0 ? (
          <ul className="flex flex-wrap items-center justify-center gap-x-[48px] gap-y-[24px] opacity-70">
            {logos.map((name) => (
              <li
                key={name}
                className="font-sans text-[18px] font-semibold tracking-[-0.2px] text-ink-dim"
              >
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <PendingContent
            label="Customer logos"
            hint="Pass a `logos` array once the customer list is approved."
          />
        )}
      </Reveal>

      {/* Testimonials */}
      {testimonials.length > 0 ? (
        <div className="grid grid-cols-1 items-start gap-[24px] lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal key={item.author} delay={index * 80}>
              <figure className="card-highlight hover-lift flex h-full flex-col gap-[24px] rounded-card border border-line-hair bg-card p-[25px]">
                <span aria-hidden className="font-serif text-[48px] leading-[24px] text-accent/40">
                  &ldquo;
                </span>

                <blockquote className="flex-1 font-sans text-[16px] leading-[25.6px] text-ink">
                  {item.quote}
                </blockquote>

                <figcaption className="border-t border-line-soft pt-[16px]">
                  <p className="font-sans text-[14px] font-medium leading-[22px] text-white">
                    {item.author}
                  </p>
                  <p className="font-sans text-[12px] leading-[18px] tracking-[0.6px] text-ink-dim">
                    {item.role}, {item.company}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal>
          <PendingContent
            label="Customer testimonials"
            hint="Pass a `testimonials` array. Do not write placeholder quotes — an invented endorsement is a legal and trust risk."
          />
        </Reveal>
      )}
    </section>
  );
}

/** Visible, self-describing gap marker — impossible to mistake for content. */
function PendingContent({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-card border border-dashed border-line-soft bg-card/40 p-[25px] text-center">
      <p className="font-mono text-[12px] uppercase leading-[16px] tracking-[1.2px] text-ink-mute">
        {label} — pending real content
      </p>
      <p className="mx-auto max-w-[520px] pt-[8px] font-sans text-[14px] leading-[22px] text-ink-faint">
        {hint}
      </p>
    </div>
  );
}
