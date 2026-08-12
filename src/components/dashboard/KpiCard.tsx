import { cn } from "@/lib/cn";

/**
 * Figma nodes 2:1502 / 2:1516 / 2:1529 — the three KPI cards.
 *   card  — 301.33px wide, rgba(26,26,26,.8), 1px rgba(255,255,255,.1),
 *           radius 48, padding 24–25, backdrop-blur 6, shadow 0 4px 30px
 *   glow  — 128px rgba(0,242,255,.05) orb, blur 20, offset -64 top/right
 *   label — 12px medium dim, tracking 1.2px
 *   value — 32px semibold, tracking -0.64px, leading 38.4px
 *   unit  — 24px dim beside the value
 */
export interface KpiCardProps {
  label: string;
  value: string;
  /** Smaller dimmed text trailing the value, e.g. "%" or "CPT". */
  unit?: string;
  /** Footer content — a chip, a caption, or a progress bar. */
  footer?: React.ReactNode;
  className?: string;
}

export function KpiCard({ label, value, unit, footer, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[166px] flex-col justify-between gap-[16px] overflow-clip",
        "rounded-card border border-line-soft bg-surface p-[25px]",
        "shadow-chrome backdrop-blur-chrome",
        className,
      )}
    >
      {/* Corner glow — node 2:1515 */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[64px] -top-[64px] size-[128px] rounded-full bg-accent/5 blur-[20px]"
      />

      <p className="relative font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-dim">
        {label}
      </p>

      <p className="relative flex items-baseline gap-[4px]">
        <span className="font-sans text-[32px] font-semibold leading-[38.4px] tracking-[-0.64px] text-ink">
          {value}
        </span>
        {unit ? (
          <span className="font-sans text-[24px] leading-[31.2px] tracking-[-0.64px] text-ink-dim">
            {unit}
          </span>
        ) : null}
      </p>

      {footer ? <div className="relative">{footer}</div> : null}
    </div>
  );
}

/**
 * Mini progress bar — node 2:1526.
 * 8px track #333539, accent fill with a 10px cyan glow.
 */
export function MiniProgressBar({ percent, label }: { percent: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className="h-[8px] w-full overflow-clip rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-accent shadow-accent-bar transition-[width] duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
