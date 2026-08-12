import type { NormalizedError } from "@/models/common";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

/**
 * The three non-happy-path states every data-driven screen must handle.
 * Styling follows the same glass-panel language as Card.
 */

export function LoadingState({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center gap-[16px] py-[64px]", className)}
    >
      <span
        aria-hidden
        className="size-[32px] animate-spin rounded-full border-2 border-accent border-t-transparent drop-shadow-glow"
      />
      <p className="font-serif text-label uppercase text-ink-dim">{label}</p>
    </div>
  );
}

/**
 * Skeleton block for content-shaped placeholders.
 * Uses a sweeping highlight rather than a flat opacity pulse — it reads as
 * "loading" more clearly and is calmer to sit next to.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-field bg-raised", className)} />;
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: NormalizedError;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-[16px] rounded-card border border-line bg-surface p-card text-center backdrop-blur-card",
        className,
      )}
    >
      <p className="font-serif text-h2 font-bold text-ink">Something went wrong</p>
      <p className="max-w-[440px] font-serif text-body text-ink-dim">{error.message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  className,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-[16px] rounded-card border border-line bg-surface p-card text-center backdrop-blur-card",
        className,
      )}
    >
      <p className="font-serif text-h2 font-bold text-ink">{title}</p>
      {message ? <p className="max-w-[440px] font-serif text-body text-ink-dim">{message}</p> : null}
      {action}
    </div>
  );
}
