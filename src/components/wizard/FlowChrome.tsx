import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { cn } from "@/lib/cn";

/**
 * Chrome shared by the Investment and Hyperscale wizards.
 *
 * Both flows suppress the marketing navigation — they are linear, transactional
 * paths — and show only the wordmark plus a status readout or exit link.
 * Generalised from the assessment chrome so all three wizards stay consistent.
 */

export function FlowHeader({
  status,
  exitHref,
  exitLabel,
  className,
}: {
  status?: string;
  exitHref?: string;
  exitLabel?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex w-full items-center justify-between gap-[16px] px-[24px] py-[18px] lg:px-[40px]",
        className,
      )}
    >
      <Link href="/" className="flex items-center gap-[8px]">
        <BrandMark className="h-[16px] w-[22px]" />
        <span className="font-sans text-[16px] font-semibold leading-[24px] text-white">
          Panda Cloud
        </span>
      </Link>

      {status ? (
        <span className="flex items-center gap-[8px] font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-ink-dim">
          <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
          {status}
        </span>
      ) : null}

      <Link
          href={exitHref ?? "/"}
          className="flex items-center gap-[8px] font-sans text-[12px] leading-[18px] text-ink-dim transition-colors hover:text-accent"
        >
          {exitLabel ?? "Back to home"}
          <span aria-hidden>✕</span>
      </Link>
    </header>
  );
}

export function FlowFooter({ note }: { note?: string }) {
  return (
    <footer className="mt-auto flex w-full flex-wrap items-center justify-center gap-[12px] px-[24px] py-[24px] text-center lg:px-[40px]">
      <span className="font-sans text-[11px] leading-[16px] tracking-[0.6px] text-ink-faint">
        {note ?? "© 2024 Panda Cloud Inc. All systems operational."}
      </span>
    </footer>
  );
}

/**
 * Step caption plus a segmented progress bar.
 *
 * The exported designs disagree on step counts across screens; the totals are
 * normalised here so a user moving through a flow sees one consistent scale.
 */
export function FlowProgress({
  label,
  step,
  total,
  className,
}: {
  /** e.g. "STEP 03 / 05". Rendered verbatim. */
  label: string;
  step: number;
  total: number;
  className?: string;
}) {
  const segments = Array.from({ length: total }, (_, index) => index);

  return (
    <div className={cn("flex w-full flex-col gap-[10px]", className)}>
      <p className="font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-ink-mute">
        {label}
      </p>

      <div
        className="flex h-[3px] w-full gap-[3px] overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${step} of ${total}`}
      >
        {segments.map((index) => (
          <span
            key={index}
            className={cn(
              "h-full flex-1 rounded-full transition-colors duration-300",
              index < step ? "bg-accent shadow-accent-bar" : "bg-raised",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Back / forward pair used at the bottom of every step. */
export function FlowNav({
  backLabel,
  backHref,
  nextLabel,
  nextHref,
  onNext,
  disabled,
  busy,
  className,
}: {
  backLabel?: string;
  backHref?: string;
  nextLabel: string;
  nextHref?: string;
  onNext?: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}) {
  const nextClasses = cn(
    "inline-flex items-center gap-[8px] rounded-full bg-accent px-[28px] py-[13px]",
    "font-sans text-[12px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg",
    "transition-all duration-200 hover:-translate-y-[2px]",
    "hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
    (disabled || busy) && "pointer-events-none opacity-40",
  );

  return (
    <nav className={cn("flex items-center justify-between gap-[16px]", className)}>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-[8px] rounded-full border border-line-strong px-[22px] py-[11px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
        >
          <span aria-hidden>←</span>
          {backLabel ?? "Back"}
        </Link>
      ) : (
        <span />
      )}

      {nextHref ? (
        <Link href={nextHref} aria-disabled={disabled} className={nextClasses}>
          {nextLabel}
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <button type="button" onClick={onNext} disabled={disabled || busy} className={nextClasses}>
          {busy ? (
            <span
              aria-hidden
              className="size-[12px] animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          ) : null}
          {nextLabel}
          {!busy ? <span aria-hidden>→</span> : null}
        </button>
      )}
    </nav>
  );
}

/** Glass panel used for every flow's live-output column. */
export function FlowPanel({
  title,
  badge,
  children,
  className,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-circuit-attract
      className={cn(
        "relative flex flex-col gap-[18px] overflow-hidden rounded-card border border-line-hair bg-card p-[24px]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[64px] -top-[64px] size-[160px] rounded-full bg-accent/10 blur-[40px]"
      />

      <div className="relative flex items-center justify-between gap-[12px]">
        <p className="font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-ink-mute">
          {title}
        </p>
        {badge ? (
          <span className="flex items-center gap-[6px] rounded-field border border-accent-line bg-accent-soft px-[9px] py-[4px] font-mono text-[9px] uppercase tracking-[1.1px] text-accent">
            <span aria-hidden className="pulse-dot size-[5px] rounded-full bg-accent" />
            {badge}
          </span>
        ) : null}
      </div>

      <div className="relative flex flex-1 flex-col gap-[16px]">{children}</div>
    </div>
  );
}
