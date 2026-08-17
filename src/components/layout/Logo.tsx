import { cn } from "@/lib/cn";

/**
 * Figma node 2:967 — a 27.5×20 brand mark beside the "Panda Cloud" wordmark.
 *
 * ⚠ The mark itself is an exported SVG asset in Figma. Figma's asset URLs
 * expire after ~7 days, and this session had no shell access to download and
 * commit it, so the glyph below is a NEUTRAL PLACEHOLDER — it is deliberately
 * not an attempt to redraw the real logo, which would be wrong.
 *
 * To finish this component: export node 2:967 from Figma, save it as
 * `public/assets/brand/logo.svg`, and replace the inline <svg> with
 * <img src="/assets/brand/logo.svg" alt="" className="h-[20px] w-[27.5px]" />.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[8px]", className)}>
      <span
        aria-hidden
        className="flex h-[20px] w-[27.5px] shrink-0 items-center justify-center"
        data-placeholder="figma-node-2:967"
      >
        <svg viewBox="0 0 28 20" fill="none" className="size-full">
          <rect x="0.75" y="0.75" width="26.5" height="18.5" rx="6" stroke="currentColor" strokeWidth="1.5" className="text-accent" />
        </svg>
      </span>
      <span className="font-sans text-[24px] font-semibold leading-[31.2px] text-ink">
        Panda Cloud
      </span>
    </span>
  );
}
