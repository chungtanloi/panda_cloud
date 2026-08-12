import { cn } from "@/lib/cn";

/**
 * Figma node 2:1122 — 128px ring, rotated -90° so the arc starts at 12 o'clock,
 * with the grade centred at 36px bold serif.
 * The original export is a static SVG; this redraws it as a live arc so the
 * value can be driven by data.
 */
export interface ScoreGaugeProps {
  /** Letter grade rendered in the centre, e.g. "A-". */
  grade: string;
  /** 0–100, drives the arc length. */
  percent: number;
  size?: number;
  className?: string;
}

export function ScoreGauge({ grade, percent, size = 128, className }: ScoreGaugeProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Estimated ESG score ${grade}, ${clamped} percent`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-raised)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ filter: "drop-shadow(var(--glow-accent))" }}
        />
      </svg>

      <span className="absolute font-serif text-score font-bold text-ink">{grade}</span>
    </div>
  );
}
