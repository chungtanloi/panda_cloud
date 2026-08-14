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
import { SALES_BOARD, SOURCE_LABELS, type DealSource } from "@/config/sales";
import { useAuth } from "@/controllers/AuthContext";
import { canManageSalesBoard, isStaff, primaryRole } from "@/models/auth";
import type { DealCard } from "@/models/sales";
import { cn } from "@/lib/cn";
import { createSalesAdapter } from "./salesAdapter";
import { DealCardView } from "./DealCardView";
import { DealDetail } from "./DealDetail";
import { ManualDealModal } from "./ManualDealModal";

/**
 * The sales pipeline board.
 *
 * Client-only: the library uses @dnd-kit and pointer events, neither of which
 * survives server rendering. The page that mounts this imports it with
 * `ssr: false`.
 *
 * Permissions are passed through to the library rather than enforced by hiding
 * UI: `canEditCard` and `canMoveCard` gate the affordances, and the backend
 * must reject the same operations independently. A UI guard alone is not
 * access control.
 */
export function SalesBoard() {
  const { profile, user } = useAuth();
  const [sourceFilter, setSourceFilter] = useState<DealSource | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);

  // Recreating the adapter would refetch the whole board on every render.
  const adapter = useMemo(() => createSalesAdapter(), [boardVersion]);

  // sales_manager gets the same board power as admin here — see the doc
  // comment on canManageSalesBoard for why this is a separate check from
  // "is admin".
  const canManageBoard = canManageSalesBoard(profile);

  const config = useMemo(
    () => ({
      adapter,
      // The library only needs a label; authorization is the backend's.
      // See WORKSPACE_ROLE_PRECEDENCE (U-03) for how one role is chosen when an
      // identity holds several active memberships.
      user: user ? { id: user.id, role: primaryRole(profile) ?? undefined } : undefined,

      cardRender: (card: DealCard) => <DealCardView card={card} />,

      detailPanelRender: (card: DealCard, close: () => void) => (
        <DealDetail
          card={card}
          close={close}
          canEdit={Boolean(user)}
          canDelete={canManageBoard}
          onDeleted={() => setBoardVersion((version) => version + 1)}
          onSaved={() => {
            // The library refetches on close; nothing to do here beyond
            // letting the panel keep its own saved state.
          }}
        />
      ),

      /** Any signed-in staff member may work a deal. */
      canEditCard: () => Boolean(user),
      canMoveCard: () => Boolean(user),
      /** Staff may add outbound/offline leads; customer forms still create cards automatically. */
      canCreateCard: () => isStaff(profile),
      /** Sales managers and admins only, and even then the backend should prefer "Lost". */
      canDeleteCard: () => canManageBoard,
    }),
    [adapter, profile, user, canManageBoard],
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

        {/* Source filter. Client-side: the board holds every card already, so
            a round trip per filter change would be wasted. */}
        <div className="flex flex-wrap items-center justify-end gap-[8px]">
          <button type="button" onClick={() => setShowCreate(true)} className="rounded-full bg-accent px-4 py-2 font-sans text-[12px] font-bold uppercase tracking-wider text-accent-fg">+ Add card</button>
          <FilterChip
            active={sourceFilter === "all"}
            onClick={() => setSourceFilter("all")}
            label={SALES_BOARD.filterAllLabel}
          />
          {(Object.keys(SOURCE_LABELS) as DealSource[]).map((source) => (
            <FilterChip
              key={source}
              active={sourceFilter === source}
              onClick={() => setSourceFilter(source)}
              label={SOURCE_LABELS[source]}
            />
          ))}
        </div>
      </header>

      <div
        className={cn(
          "kanban-scope min-h-0 min-w-0 flex-1 overflow-hidden rounded-[28px] border border-line-hair bg-card p-[16px]",
          // Hides cards whose source is filtered out without unmounting them,
          // so drag state and scroll position survive a filter change.
          sourceFilter !== "all" && `filter-${sourceFilter}`,
        )}
        data-source-filter={sourceFilter}
      >
        <Kanban key={boardVersion} {...config} className="min-h-0 min-w-0" />
      </div>
      <ManualDealModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => setBoardVersion((version) => version + 1)} />
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
