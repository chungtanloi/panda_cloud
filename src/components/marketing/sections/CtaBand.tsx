import Link from "next/link";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

/**
 * Repeating call-to-action band. Added section — not in the Figma file.
 *
 * Reuses the accent pill and glow treatment from the Buy GPU final CTA
 * (node 2:332) so it does not read as a foreign element.
 */
export function CtaBand({
  title,
  subtitle,
  primary,
  secondary,
  className,
}: {
  title: string;
  subtitle?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  className?: string;
}) {
  return (
    <Reveal
      as="section"
      className={cn(
        "relative overflow-hidden rounded-card border border-accent-line bg-glass p-[48px] text-center backdrop-blur-card",
        className,
      )}
    >
      <AnimatedBackdrop />

      <div className="relative flex flex-col items-center gap-[16px]">
        <h2 className="max-w-[720px] font-sans text-[32px] font-semibold leading-[38.4px] tracking-[-0.64px] text-white">
          {title}
        </h2>

        {subtitle ? (
          <p className="max-w-[600px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {subtitle}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-[16px] pt-[16px]">
          <Link
            href={primary.href}
            className="rounded-full bg-accent px-[32px] py-[16px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
          >
            {primary.label}
          </Link>

          {secondary ? (
            <Link
              href={secondary.href}
              className="rounded-full border border-accent/30 px-[32px] py-[16px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent transition-colors hover:border-accent"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}
