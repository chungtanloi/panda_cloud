import { cn } from "@/lib/cn";

/**
 * Figma nodes 2:1128 / 2:1136 — the metric chips under the ESG ring.
 * bg rgba(26,26,26,.8), border rgba(58,73,75,.2), radius 16, padding 9,
 * label 12px dim, value 12px ink, optional 10px dim unit.
 */
export interface StatRowProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  /** Renders the value in the accent colour (used for "100%" renewable). */
  emphasis?: boolean;
  className?: string;
}

export function StatRow({ icon, label, value, unit, emphasis, className }: StatRowProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between rounded-field border border-line-faint bg-surface p-[9px] backdrop-blur-card",
        className,
      )}
    >
      <div className="flex items-center gap-[4px]">
        {icon ? <span className="shrink-0 text-ink-dim">{icon}</span> : null}
        <span className="font-serif text-label text-ink-dim">{label}</span>
      </div>

      <div className="flex items-end gap-[1px] text-right">
        <span className={cn("font-serif text-label", emphasis ? "text-accent" : "text-ink")}>
          {value}
        </span>
        {unit ? <span className="font-serif text-micro text-ink-dim">{unit}</span> : null}
      </div>
    </div>
  );
}
