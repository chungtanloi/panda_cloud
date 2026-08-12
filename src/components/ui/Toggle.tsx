"use client";

import { cn } from "@/lib/cn";

/**
 * Figma node 2:1103 ("PPA Available?"):
 *   track 56×32, radius 9999, bg #282a2e, border rgba(58,73,75,.3)
 *   thumb 24×24 at (4,4), bg #111318, 4px border #3a494b
 * Checked state adopts the accent colour, consistent with the design's
 * cyan-for-active language.
 */
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name — required, since the control has no visible label. */
  label: string;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, disabled = false, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[32px] w-[56px] shrink-0 rounded-full border transition-colors",
        checked ? "border-accent bg-accent-soft" : "border-line bg-raised",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-[4px] size-[24px] rounded-full border-4 transition-all",
          checked
            ? "left-[28px] border-accent bg-base drop-shadow-glow"
            : "left-[4px] border-ink-faint bg-base",
        )}
      />
    </button>
  );
}
