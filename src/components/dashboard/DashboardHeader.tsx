"use client";

import { cn } from "@/lib/cn";

/**
 * Figma node 2:1481 — dashboard top bar.
 *   bar     — 80px tall, rgba(26,26,26,.8), 1px rgba(58,73,75,.2),
 *             backdrop-blur 6, shadow 0 4px 30px rgba(0,0,0,.1), px 41
 *   search  — max 448px, #1a1a1a, radius 9999, pl 49 / pr 17 / py 13,
 *             12px medium, placeholder #6b7280, 18px icon inset 16px
 *   bell    — 16×20 with an 8px accent dot, glow 0 0 8px rgba(0,242,255,.8)
 *   action  — "New Instance" accent pill, px 24 / py 8, 12px bold
 */
export interface DashboardHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onNewInstance?: () => void;
  hasNotifications?: boolean;
  className?: string;
}

export function DashboardHeader({
  search,
  onSearchChange,
  onNewInstance,
  hasNotifications = true,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "z-20 flex h-[80px] w-full items-center justify-between gap-[24px]",
        "border border-line-faint bg-surface px-[41px] shadow-chrome backdrop-blur-chrome",
        className,
      )}
    >
      <div className="relative w-full max-w-[448px]">
        <span
          aria-hidden
          className="pointer-events-none absolute left-[16px] top-1/2 -translate-y-1/2 text-ink-search"
        >
          <SearchIcon />
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search clusters, projects, or transactions..."
          aria-label="Search clusters, projects, or transactions"
          className={cn(
            "w-full rounded-full border border-line bg-surface-solid py-[13px] pl-[49px] pr-[17px]",
            "font-sans text-[12px] font-medium tracking-[1.2px] text-ink",
            "placeholder:text-ink-search focus:border-accent focus:outline-none",
          )}
        />
      </div>

      <div className="flex items-center gap-[24px]">
        <button
          type="button"
          aria-label={hasNotifications ? "Notifications, unread" : "Notifications"}
          className="relative flex items-center justify-center text-ink-dim transition-colors hover:text-ink"
        >
          <BellIcon />
          {hasNotifications ? (
            <span
              aria-hidden
              className="absolute -right-[1px] top-0 size-[8px] rounded-full bg-accent shadow-accent-dot"
            />
          ) : null}
        </button>

        <button
          type="button"
          onClick={onNewInstance}
          className={cn(
            "rounded-full bg-accent px-[24px] py-[8px]",
            "font-sans text-[12px] font-bold leading-[12px] tracking-[1.2px] text-accent-fg",
            "drop-shadow-[0px_0px_7.5px_rgba(0,242,255,0.2)] transition-opacity hover:opacity-90",
          )}
        >
          New Instance
        </button>
      </div>
    </header>
  );
}

/* Generic UI glyphs (magnifier, bell) — not brand marks. The KPI and nav icons
   in this screen ARE bespoke Figma assets and are pending export; see
   docs/FIGMA_ASSETS.md. */

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m12.5 12.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden>
      <path
        d="M3 8a5 5 0 0 1 10 0c0 4 1.5 5 1.5 5h-13S3 12 3 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6.5 16a1.75 1.75 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
