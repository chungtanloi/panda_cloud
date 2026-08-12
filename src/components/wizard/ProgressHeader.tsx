import { cn } from "@/lib/cn";

/**
 * Figma node 2:1033.
 *   eyebrow  — 8px accent dot + 12px serif accent text, tracking 1.2px
 *   title    — 48px bold serif, leading 52.8px, tracking -1.92px
 *   right    — "Step 3 / 5" dim over "Energy Mix & PPA" in ink
 *   bar      — 4px tall, radius 9999, track #282a2e; completed segments
 *              #333539; active segment #00f2ff with a 10px cyan glow and a
 *              blurred 50%-opacity overlay (node 2:1049)
 */
export interface ProgressHeaderProps {
  eyebrow: string;
  title: string;
  stepNumber: number;
  totalSteps: number;
  stepLabel: string;
  className?: string;
}

export function ProgressHeader({
  eyebrow,
  title,
  stepNumber,
  totalSteps,
  stepLabel,
  className,
}: ProgressHeaderProps) {
  const segments = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <header className={cn("flex w-full flex-col gap-[8px]", className)}>
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center gap-[8px]">
            <span className="size-[8px] rounded-full bg-accent" aria-hidden />
            <p className="font-serif text-label uppercase text-accent">{eyebrow}</p>
          </div>
          <h1 className="font-serif text-display font-bold text-ink">{title}</h1>
        </div>

        <div className="flex flex-col items-end text-right">
          <p className="font-serif text-label text-ink-dim">
            Step {stepNumber} / {totalSteps}
          </p>
          <p className="font-serif text-label text-ink">{stepLabel}</p>
        </div>
      </div>

      <div
        className="mt-[16px] flex h-[4px] w-full overflow-clip rounded-full bg-raised"
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${stepNumber} of ${totalSteps}: ${stepLabel}`}
      >
        {segments.map((index) => {
          const isComplete = index < stepNumber - 1;
          const isActive = index === stepNumber - 1;

          return (
            <div
              key={index}
              className={cn(
                "relative h-full flex-1 border-r border-base last:border-r-0",
                isComplete && "bg-muted",
                isActive && "bg-accent drop-shadow-glow",
              )}
            >
              {isActive ? (
                <span aria-hidden className="absolute inset-0 bg-accent opacity-50 blur-[2px]" />
              ) : null}
            </div>
          );
        })}
      </div>
    </header>
  );
}
