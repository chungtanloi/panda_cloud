"use client";

import { Kanban } from "@kanban/library";
// Imported here rather than in the root layout so the stylesheet only loads on
// this route. ⚠ It is compiled from the library's own Tailwind build; if it
// ships preflight it will reset typography app-wide once loaded. The fix, if
// that happens, is one line in kaban_cloud/tailwind.config.js:
//   corePlugins: { preflight: false }
// A library should not ship a global reset — the host app already has one.
import "@kanban/library/styles.css";
import { useMemo, useState } from "react";
import { SALES_BOARD, VERTICAL_LABELS } from "@/config/sales";
import { useAuth } from "@/controllers/AuthContext";
import { primaryRole } from "@/models/auth";
import type { DealVertical, SalesCard } from "@/models/sales";
import { cn } from "@/lib/cn";
import { createSalesAdapter } from "./salesAdapter";
import { DealCardView } from "./DealCardView";
import { DealDetail } from "./DealDetail";

/**
 * The sales pipeline board.
 *
 * Client-only: the library uses @dnd-kit and pointer events, neither of which
 * survives server rendering. The page that mounts this imports it with
 * `ssr: false`.
 *
 * There is deliberately no "Add card" or "Delete card" surface: the backend
 * contract has no create or delete operation, so the adapter does not expose
 * them and the board must not either.
 *
 * Permissions are passed through to the library rather than enforced by hiding
 * UI: `canEditCard` and `canMoveCard` gate the affordances, and the backend
 * must reject the same operations independently (a UI guard alone is not
 * access control — the backend restricts Won/Lost transitions to manager and
 * admin, which is enforced server-side and surfaced cleanly here).
 */
export function SalesBoard() {
  const { profile, user } = useAuth();
  const [verticalFilter, setVerticalFilter] = useState<DealVertical | "all">("all");
  const [boardVersion, setBoardVersion] = useState(0);

  // Recreating the adapter would refetch the whole board on every render.
  // boardVersion is deliberately a dependency even though the memo doesn't read
  // it: bumping it recreates the adapter (fresh revision cache + column load)
  // when the board remounts after a save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const adapter = useMemo(() => createSalesAdapter(), [boardVersion]);

  const config = useMemo(
    () => ({
      adapter,
      // The library only needs a label; authorization is the backend's.
      // See WORKSPACE_ROLE_PRECEDENCE (U-03) for how one role is chosen when an
      // identity holds several active memberships.
      user: user ? { id: user.id, role: primaryRole(profile) ?? undefined } : undefined,

      cardRender: (card: SalesCard) => <DealCardView card={card} />,

      detailPanelRender: (card: SalesCard, close: () => void) => (
        <DealDetail
          card={card}
          close={close}
          canEdit={Boolean(user)}
          onSaved={() => {
            // Show the panel's own "Saved" state, then refetch the board so the
            // latest revision is reflected.
            window.setTimeout(() => setBoardVersion((version) => version + 1), 700);
          }}
        />
      ),

      /** Any signed-in staff member may work a deal. */
      canEditCard: () => Boolean(user),
      canMoveCard: () => Boolean(user),
    }),
    [adapter, profile, user],
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-[20px] overflow-hidden">
      <header className="flex flex-wrap items-end justify-between gap-[16px]">
        <div>
          <h1 className="font-sans text-[28px] font-bold leading-[36px] tracking-[-0.7px] text-white">
            {SALES_BOARD.title}
          </h1>
          <p className="pt-[6px] font-sans text-[13px] leading-[20px] text-ink-dim">
            {SALES_BOARD.subtitle}
          </p>
        </div>

        {/* Vertical filter. Client-side: the board holds every card already, so
            a round trip per filter change would be wasted. */}
        <div className="flex flex-wrap items-center justify-end gap-[8px]">
          <FilterChip
            active={verticalFilter === "all"}
            onClick={() => setVerticalFilter("all")}
            label={SALES_BOARD.filterAllLabel}
          />
          {(Object.keys(VERTICAL_LABELS) as DealVertical[]).map((vertical) => (
            <FilterChip
              key={vertical}
              active={verticalFilter === vertical}
              onClick={() => setVerticalFilter(vertical)}
              label={VERTICAL_LABELS[vertical]}
            />
          ))}
        </div>
      </header>

      <div
        className={cn(
          "kanban-scope min-h-0 min-w-0 flex-1 overflow-hidden rounded-[28px] border border-line-hair bg-card p-[16px]",
          // Hides cards whose vertical is filtered out without unmounting them,
          // so drag state and scroll position survive a filter change.
          verticalFilter !== "all" && `filter-${verticalFilter}`,
        )}
        data-vertical-filter={verticalFilter}
      >
        <Kanban key={boardVersion} {...config} className="min-h-0 min-w-0" />
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-[14px] py-[7px] font-sans text-[12px] leading-[16px] transition-colors",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40",
      )}
    >
      {label}
    </button>
  );
}
