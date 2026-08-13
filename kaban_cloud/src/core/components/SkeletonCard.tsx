export interface SkeletonCardProps {
  className?: string;
}

/** Pulsing placeholder rendered in place of a Card while the board is loading. */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-kanban-border bg-kanban-surface p-3 ${className ?? ''}`}
      aria-hidden="true"
    >
      <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-2 h-2.5 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="mt-2 h-2.5 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}
