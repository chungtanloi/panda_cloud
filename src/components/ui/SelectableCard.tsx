"use client";

import { cn } from "@/lib/cn";

/**
 * Radio card used by every wizard's option group.
 * Figma nodes 2:1061 (unselected) / 2:1072 (selected):
 *   unselected — bg rgba(26,26,26,.8), border rgba(58,73,75,.3)
 *   selected   — bg rgba(0,242,255,.1), border #00f2ff
 *   radius 32, padding 17, gap 8, backdrop-blur 8px
 *   title 12px serif tracking 1.2px, body 12px serif tracking 1.2px dim
 *
 * Rendered as a real radio input so keyboard and screen-reader behaviour comes
 * for free; the input is visually hidden and the label carries the styling.
 */
export interface SelectableCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SelectableCard({
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon,
  disabled = false,
  className,
}: SelectableCardProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col justify-center",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <div
        className={cn(
          "relative flex flex-col gap-[8px] overflow-clip rounded-panel border p-[17px]",
          "backdrop-blur-card transition-colors",
          checked
            ? "border-accent bg-accent-soft"
            : "border-line bg-surface hover:border-line-strong",
        )}
      >
        {icon ? <span className="mb-[8px] block h-[25px]">{icon}</span> : null}

        <h3 className="font-serif text-label text-ink">{title}</h3>

        {description ? (
          <p className="font-serif text-label text-ink-dim">{description}</p>
        ) : null}
      </div>
    </label>
  );
}
