import { SkeletonCard } from './SkeletonCard';

export interface SkeletonColumnProps {
  /** Number of skeleton cards to render in this column. Defaults to a random-looking 3-5. */
  cardCount?: number;
  className?: string;
}

/** Placeholder column (header bar + N skeleton cards) shown while the board's initial fetch is in flight. */
export function SkeletonColumn({ cardCount, className }: SkeletonColumnProps) {
  const count = cardCount ?? 3 + Math.floor(Math.random() * 3); // 3-5

  return (
    <div className={`flex h-full w-72 shrink-0 flex-col rounded-xl bg-kanban-bg ${className ?? ''}`} aria-hidden="true">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="h-3.5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-2">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
