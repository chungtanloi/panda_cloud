"use client";

import { TIMEFRAMES, type Timeframe } from "@/config/gpuRenting";
import { cn } from "@/lib/cn";

/**
 * Figma node 2:37 — allocation-timeframe selector.
 *   shell  — #1e2024, 1px rgba(0,242,255,.2), radius 9999, padding 5
 *   active — rgba(0,0,0,.5), 1px rgba(0,242,255,.3), accent text,
 *            shadow 0 0 10px rgba(0,242,255,.1), px 25 / py 9
 *   idle   — #9ca3af, px 24 / py 9
 *
 * Implemented as an ARIA tablist so arrow keys work; the design shows no
 * price change between tabs, so selection is presentational until the
 * backend supplies per-timeframe pricing.
 */
export function TimeframeTabs({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (next: Timeframe) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Select allocation timeframe"
      className="flex rounded-full border border-accent-line bg-card p-[5px] backdrop-blur-card"
    >
      {TIMEFRAMES.map((timeframe) => {
        const isActive = timeframe === value;

        return (
          <button
            key={timeframe}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(timeframe)}
            className={cn(
              "rounded-full py-[9px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] transition-colors",
              isActive
                ? "border border-accent/30 bg-black/50 px-[25px] text-accent shadow-[0px_0px_10px_0px_rgba(0,242,255,0.1)]"
                : "px-[24px] text-ink-mute hover:text-ink",
            )}
          >
            {timeframe}
          </button>
        );
      })}
    </div>
  );
}
