"use client";

import { Kanban } from "@kanban/library";
// Imported here rather than in the root layout so the stylesheet only loads on
// this route. ⚠ It is compiled from the library's own Tailwind build; if it
// ships preflight it will reset typography app-wide once loaded. The fix, if
// that happens, is one line in kaban_cloud/tailwind.config.js:
//   corePlugins: { preflight: false }
// A library should not ship a global reset — the host app already has one.
import "@kanban/library/styles.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SALES_BOARD, VERTICAL_LABELS } from "@/config/sales";
import { useAuth } from "@/controllers/AuthContext";
import { api } from "@/services/api";
import { primaryRole } from "@/models/auth";
import type { DealVertical, SalesCard, SalesColumnDto } from "@/models/sales";
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
 * "Add card" is manual outbound/offline entry only — `POST /api/v1/sales/cards`
 * (UC-004). Cards produced by a customer flow are created by the backend inside
 * the submission transaction, so the board must never create one after a form
 * submission (API_CONTRACT § 9.2).
 *
 * There is deliberately still no "Delete card" surface: the contract has no
 * delete operation, and a lost deal belongs in the `lost` column rather than
 * being erased, which preserves the audit trail.
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
  const [showCreate, setShowCreate] = useState(false);
  const [columns, setColumns] = useState<readonly SalesColumnDto[]>([]);

  // The create form offers an explicit stage, so it needs the column list the
  // board already loads. Failing to load it is not fatal: the modal falls back
  // to "New (default)" and the backend picks the seeded `new` stage.
  useEffect(() => {
    let cancelled = false;
    void api.sales
      .listColumns()
      .then(({ columns: loaded }) => {
        if (!cancelled) setColumns(loaded);
      })
      .catch(() => {
        if (!cancelled) setColumns([]);
      });
    return () => {
      cancelled = true;
    };
  }, [boardVersion]);

  const refreshBoard = useCallback(() => setBoardVersion((version) => version + 1), []);

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

      // The library defaults to gray text that blends into Cloud Panda's dark board.
      columnHeaderRender: (column: { color?: string; title: string }, cards: SalesCard[]) => (
        <div
          className="flex items-center justify-between rounded-t-xl bg-white/[0.045] px-3 py-2"
          style={{ borderTop: `3px solid ${column.color ?? "#22d3ee"}` }}
        >
          <h3 className="text-sm font-semibold text-slate-100">{column.title}</h3>
          <span className="text-xs font-semibold text-slate-200">{cards.length}</span>
        </div>
      ),
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
          {/* Backend enforces sales/manager/admin and answers 403 otherwise;
              this is a convenience guard, not access control. */}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-accent px-[14px] py-[7px] font-sans text-[12px] font-bold uppercase tracking-wider text-accent-fg transition-opacity hover:opacity-90"
          >
            + Add card
          </button>
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

      <ManualDealModal
        open={showCreate}
        columns={columns}
        onClose={() => setShowCreate(false)}
        onCreated={refreshBoard}
      />
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
