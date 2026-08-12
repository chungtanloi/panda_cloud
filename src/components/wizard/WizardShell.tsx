import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { ProgressHeader } from "./ProgressHeader";

/**
 * The page frame every wizard step reuses.
 * Figma node 2:1031: 64px page padding, 40px gap between header/body/nav,
 * a 12-column grid with 20px gutters, and a bottom nav row with 64px top pad.
 */

export interface WizardShellProps {
  eyebrow: string;
  title: string;
  stepNumber: number;
  totalSteps: number;
  stepLabel: string;
  /** Left column — the input controls (spans 8 of 12 columns). */
  children: React.ReactNode;
  /** Right column — the live preview panel (spans 4 of 12). Optional. */
  aside?: React.ReactNode;
  backLabel?: string;
  nextLabel: string;
  onBack?: () => void;
  onNext: () => void;
  canGoNext?: boolean;
  submitting?: boolean;
}

export function WizardShell({
  eyebrow,
  title,
  stepNumber,
  totalSteps,
  stepLabel,
  children,
  aside,
  backLabel = "Back",
  nextLabel,
  onBack,
  onNext,
  canGoNext = true,
  submitting = false,
}: WizardShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-canvas flex-col gap-section px-[24px] py-[40px] md:px-[40px] lg:p-gutter">
      <ProgressHeader
        eyebrow={eyebrow}
        title={title}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        stepLabel={stepLabel}
        className="pb-section"
      />

      <div
        className={cn(
          "grid w-full gap-grid",
          aside ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1",
        )}
      >
        <div className={cn("flex flex-col gap-grid", aside && "lg:col-span-8")}>{children}</div>
        {aside ? <div className="lg:col-span-4">{aside}</div> : null}
      </div>

      <nav className="flex items-center justify-between pt-[64px]">
        {onBack ? (
          <Button variant="secondary" onClick={onBack} iconLeft={<ArrowLeft />}>
            {backLabel}
          </Button>
        ) : (
          <span />
        )}

        <Button
          variant="primary"
          onClick={onNext}
          disabled={!canGoNext}
          loading={submitting}
          iconRight={<ArrowRight />}
        >
          {nextLabel}
        </Button>
      </nav>
    </div>
  );
}

/* Inline arrows match the 16px containers in Figma nodes 2:1145 / 2:1150.
   These are simple geometric glyphs, not brand icons — see
   docs/FIGMA_ASSETS.md for the exported-asset workflow used elsewhere. */

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13 8H3m0 0 4-4M3 8l4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 8h10m0 0-4-4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
