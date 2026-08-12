import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

/**
 * Shared heading for the extended marketing sections.
 *
 * NOT from the Figma file — part of the added sections. It deliberately reuses
 * the eyebrow/title/subtitle rhythm already present in the Service Ecosystem
 * block (node 1:97) so the new content sits naturally beside the original.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-[16px]",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow ? (
        <span className="flex items-center gap-[8px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-accent">
          <span aria-hidden className="size-[6px] rounded-full bg-accent" />
          {eyebrow}
        </span>
      ) : null}

      <h2 className="max-w-[720px] font-sans text-[32px] font-semibold leading-[38.4px] tracking-[-0.64px] text-white">
        {title}
      </h2>

      {subtitle ? (
        <p className="max-w-[672px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}
