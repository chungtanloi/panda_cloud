import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Figma nodes 1:103 / 1:116 / 1:129 / 1:143 — the Service Ecosystem bento.
 *   card  — #1e2024, 1px rgba(255,255,255,.05), radius 16, padding 33,
 *           inset 0 1px 0 rgba(255,255,255,.05) highlight
 *   title — 20px medium white, leading 28
 *   body  — 16px / 25.6px dim
 *   link  — 16px bold accent with a 7.6px chevron
 */
export interface BentoCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  /** Extra content rendered to the right of the text (node 1:143). */
  aside?: React.ReactNode;
  /** Diagonal accent wash on the large GPU Renting card (node 1:130). */
  glow?: boolean;
  className?: string;
}

export function BentoCard({
  icon,
  title,
  description,
  linkLabel,
  href,
  aside,
  glow = false,
  className,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "card-highlight relative flex overflow-hidden rounded-field border border-line-hair bg-card p-[33px]",
        aside ? "items-center justify-between gap-[32px]" : "flex-col justify-between",
        className,
      )}
    >
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 right-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to left, rgba(0,242,255,0.5) 0%, rgba(0,242,255,0) 100%)",
          }}
        />
      ) : null}

      <div className="relative flex flex-1 flex-col gap-[8px]">
        {icon ? <span className="block h-[30px] text-accent">{icon}</span> : null}

        <h3 className="pt-[16px] font-sans text-[20px] font-medium leading-[28px] text-white">
          {title}
        </h3>

        <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">{description}</p>

        <div className="pt-[32px]">
          <Link
            href={href}
            className="inline-flex items-center gap-[8px] font-sans text-[16px] font-bold leading-[24px] text-accent hover:underline"
          >
            {linkLabel}
            <Chevron />
          </Link>
        </div>
      </div>

      {aside ? <div className="relative shrink-0">{aside}</div> : null}
    </div>
  );
}

/** Figma node 1:114 — 7.58px chevron. A plain stroke, not a brand glyph. */
function Chevron() {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
      <path
        d="M2.5 1 6 4 2.5 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
