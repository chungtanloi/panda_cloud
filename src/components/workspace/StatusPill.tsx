import { cn } from "@/lib/cn";

/**
 * Lifecycle status pill shared by the Legal, Compliance and Technical
 * workspaces.
 *
 * Colour carries meaning and is assigned by outcome, not by position in the
 * enum: green means done and good, red means stopped and bad, amber means
 * waiting on someone, slate means not started. A reviewer scanning a list
 * should be able to find the problems without reading a single word.
 */
export type StatusTone = "neutral" | "progress" | "waiting" | "good" | "bad";

const TONES: Record<StatusTone, string> = {
  neutral: "border-line-strong bg-white/[0.04] text-ink-dim",
  progress: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  waiting: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  good: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  bad: "border-red-400/30 bg-red-400/10 text-red-300",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-field border px-[9px] py-[4px] font-mono text-[9px] uppercase tracking-[1px]",
        TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}
