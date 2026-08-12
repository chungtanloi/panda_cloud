import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { cn } from "@/lib/cn";

/**
 * Minimal header and footer used by the assessment steps.
 *
 * The design suppresses the marketing navigation during the wizard (the Figma
 * frames name this explicitly, e.g. node 2:1326 "Header - Top Navigation Bar
 * (Hidden as this is a linear transactional flow)"). Only the wordmark and a
 * status/exit affordance remain.
 */

export function AssessmentHeader({
  /** Right-hand slot: a status readout on step 1, an exit link on step 2. */
  status,
  exitHref,
  exitLabel,
}: {
  status?: string;
  exitHref?: string;
  exitLabel?: string;
}) {
  return (
    <header className="flex w-full items-center justify-between gap-[16px] px-[24px] py-[20px] lg:px-[40px]">
      <Link href="/" className="flex items-center gap-[8px]">
        <BrandMark className="h-[16px] w-[22px]" />
        <span className="font-sans text-[16px] font-semibold leading-[24px] text-white">
          Cloud Panda
        </span>
      </Link>

      {status ? (
        <span className="flex items-center gap-[8px] font-mono text-[11px] uppercase leading-[12px] tracking-[1.2px] text-ink-dim">
          <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
          {status}
        </span>
      ) : null}

      {exitHref ? (
        <Link
          href={exitHref}
          className="flex items-center gap-[8px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:text-accent"
        >
          <span aria-hidden>×</span>
          {exitLabel ?? "Exit assessment"}
        </Link>
      ) : null}
    </header>
  );
}

export function AssessmentFooter({ note }: { note?: string }) {
  return (
    <footer className="mt-auto flex w-full flex-wrap items-center justify-between gap-[12px] border-t border-line-band px-[24px] py-[24px] lg:px-[40px]">
      <span className="font-sans text-[14px] font-semibold leading-[20px] text-white">
        Cloud Panda
      </span>
      <span className="font-sans text-[12px] leading-[18px] tracking-[0.6px] text-accent-dim">
        © 2024 Cloud Panda Inc. All systems operational.
        {note ? ` ${note}` : ""}
      </span>
    </footer>
  );
}

/**
 * Step header used by steps 2 and 3: eyebrow, title, step counter and a
 * progress bar.
 *
 * ⚠ The Figma steps do not share one header design — step 1 uses a
 * "STEP 1 OF 5 // INITIAL ASSESSMENT" caption with a solid underline, step 2
 * uses an eyebrow plus a percentage, and step 3 uses a segmented bar. This
 * component follows the step-2/3 pattern; step 1 renders its own variant. See
 * the note in docs/FIGMA_SCREEN_MAP.md.
 */
export function StepHeader({
  eyebrow,
  title,
  step,
  total,
  percentLabel,
  className,
}: {
  eyebrow: string;
  title: string;
  step: number;
  total: number;
  percentLabel?: string;
  className?: string;
}) {
  const percent = Math.round((step / total) * 100);

  return (
    <header className={cn("flex w-full flex-col gap-[12px]", className)}>
      <div className="flex items-end justify-between gap-[16px]">
        <div className="flex flex-col gap-[8px]">
          <p className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-accent">
            {eyebrow}
          </p>
          <h1 className="font-sans text-[32px] font-semibold leading-[40px] tracking-[-0.8px] text-white lg:text-[40px] lg:leading-[48px]">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-[4px] text-right">
          <p className="font-sans text-[12px] leading-[18px] text-ink-dim">
            Step {step} of {total}
          </p>
          <p className="font-sans text-[24px] font-semibold leading-[28px] text-accent">
            {percentLabel ?? `${percent}%`}
          </p>
        </div>
      </div>

      <div
        className="h-[3px] w-full overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${step} of ${total}: ${title}`}
      >
        <div
          className="h-full rounded-full bg-accent shadow-accent-bar transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </header>
  );
}

/** Back / forward pair used at the bottom of every step. */
export function StepNav({
  backLabel,
  backHref,
  nextLabel,
  onNext,
  nextHref,
  disabled,
}: {
  backLabel: string;
  backHref: string;
  nextLabel: string;
  onNext?: () => void;
  nextHref?: string;
  disabled?: boolean;
}) {
  const nextClasses =
    "inline-flex items-center gap-[8px] rounded-full bg-accent px-[28px] py-[13px] font-sans " +
    "text-[12px] font-bold uppercase leading-[12px] tracking-[1.2px] text-accent-fg " +
    "transition-all duration-200 hover:-translate-y-[2px] " +
    "hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)] " +
    "aria-disabled:pointer-events-none aria-disabled:opacity-40";

  return (
    <nav className="flex items-center justify-between gap-[16px] pt-[16px]">
      <Link
        href={backHref}
        className="inline-flex items-center gap-[8px] rounded-full border border-line-strong px-[24px] py-[12px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
      >
        <span aria-hidden>←</span>
        {backLabel}
      </Link>

      {nextHref ? (
        <Link href={nextHref} aria-disabled={disabled} className={nextClasses}>
          {nextLabel}
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <button type="button" onClick={onNext} disabled={disabled} className={nextClasses}>
          {nextLabel}
          <span aria-hidden>→</span>
        </button>
      )}
    </nav>
  );
}
