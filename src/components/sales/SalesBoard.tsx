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
import { DealReadinessProvider } from "@/controllers/ReadinessContext";
import { api } from "@/services/api";
import { hasRole, primaryRole } from "@/models/auth";
import type {
  DealVertical,
  SalesCard,
  SalesCardMoveRequest,
  SalesColumnDto,
  SalesTransitionOption,
} from "@/models/sales";
import { cn } from "@/lib/cn";
import { createSalesAdapter, type SalesBoardAdapter } from "./salesAdapter";
import { DealCardView } from "./DealCardView";
import { DealDetail } from "./DealDetail";
import { ManualDealModal } from "./ManualDealModal";
import { TransitionReviewDialog } from "./TransitionReviewDialog";

type TransitionExtras = Pick<
  SalesCardMoveRequest,
  "reason" | "followUpAt" | "override" | "overrideReason"
>;

type PendingReview = {
  option: SalesTransitionOption;
  resolve: (value: TransitionExtras | null) => void;
};

const RESOLVABLE_BLOCKERS = new Set([
  "HOLD_REASON_REQUIRED",
  "HOLD_FOLLOW_UP_REQUIRED",
  "OVERRIDE_REQUIRED",
]);

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
 * access control).
 */
export function SalesBoard() {
  const { profile, user } = useAuth();
  const [verticalFilter, setVerticalFilter] = useState<DealVertical | "all">("all");
  const [boardVersion, setBoardVersion] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [columns, setColumns] = useState<readonly SalesColumnDto[]>([]);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [policyVersion, setPolicyVersion] = useState(0);

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
  const handlePolicyLoaded = useCallback(
    () => setPolicyVersion((version) => version + 1),
    [],
  );

  /**
   * Terminal columns are Won and Lost — the two the backend restricts to
   * manager and admin (DEALFLOW § 9.2). `isTerminal` comes from the backend's
   * own column payload rather than a hard-coded code list, so a stage rename
   * never silently unlocks a column.
   */
  const terminalColumnIds = useMemo(
    () => new Set(columns.filter((column) => column.isTerminal).map((column) => column.columnId)),
    [columns],
  );
  const isManager = hasRole(profile, "manager") || hasRole(profile, "admin");

  const reviewTransition = useCallback(
    (_cardId: string, option: SalesTransitionOption) =>
      new Promise<TransitionExtras | null>((resolve) => setPendingReview({ option, resolve })),
    [],
  );

  const finishTransitionReview = useCallback(
    (value: TransitionExtras | null) => {
      pendingReview?.resolve(value);
      setPendingReview(null);
    },
    [pendingReview],
  );

  // Recreating the adapter would refetch the whole board on every render.
  // boardVersion is deliberately a dependency even though the memo doesn't read
  // it: bumping it recreates the adapter (fresh revision cache + column load)
  // when the board remounts after a save.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const adapter = useMemo(
    () => createSalesAdapter(api.sales, reviewTransition),
    // `boardVersion` intentionally creates a fresh revision/policy cache.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [boardVersion, reviewTransition],
  );

  const config = useMemo(
    () => {
      // Policy completion changes the cached answers on the stable adapter;
      // reading this version makes that external cache update explicit.
      void policyVersion;
      return {
      adapter,
      // The library only needs a label; authorization is the backend's.
      // See WORKSPACE_ROLE_PRECEDENCE (U-03) for how one role is chosen when an
      // identity holds several active memberships.
      user: user ? { id: user.id, role: primaryRole(profile) ?? undefined } : undefined,

      cardRender: (card: SalesCard) => (
        <PolicyAwareCard
          card={card}
          adapter={adapter}
          onPolicyLoaded={handlePolicyLoaded}
        />
      ),

      // The library defaults to gray text that blends into Cloud Panda's dark
      // board. A column a person cannot drop into says so in the header rather
      // than letting them find out by failing.
      columnHeaderRender: (column: { id?: string; color?: string; title: string }, cards: SalesCard[]) => {
        // Won/Lost are request-only for every role. Manager/Admin approve the
        // request in their queue; nobody bypasses the audited workflow by drag.
        const locked = Boolean(column.id && terminalColumnIds.has(column.id));
        return (
          <div
            className="rounded-t-xl bg-white/[0.045] px-3 py-2"
            style={{ borderTop: `3px solid ${locked ? "#475569" : (column.color ?? "#22d3ee")}` }}
          >
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-semibold", locked ? "text-slate-400" : "text-slate-100")}>
                {column.title}
              </h3>
              <span className="text-xs font-semibold text-slate-200">{cards.length}</span>
            </div>
            {locked ? (
              <p className="pt-[3px] font-mono text-[9px] uppercase tracking-[0.8px] text-slate-500">
                Approval request required
              </p>
            ) : null}
          </div>
        );
      },

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

      /**
       * ⚠ WHY THIS IS NOT `() => Boolean(user)` ANY MORE.
       *
       * The backend restricts Won/Lost transitions to manager and admin and
       * answers 403 otherwise. The previous callback allowed every signed-in
       * user to drag into those columns, so a salesperson learned about the
       * restriction only after completing a deliberate drag — the failure
       * arrived after the effort, which is the worst possible ordering.
       *
       * The library checks this both to enable dragging and again on drop, so
       * gating here removes the affordance instead of punishing its use. This
       * is still not access control: the backend rejects the same move
       * independently, and must keep doing so.
       */
      canMoveCard: (card: SalesCard, toColumnId: string) => {
        if (!user) return false;
        // The Kanban library asks about the current column when deciding
        // whether a card itself is draggable. It is not a transition.
        if (toColumnId === card.columnId) return true;
        if (terminalColumnIds.has(toColumnId)) return false;

        const option = adapter.cachedTransitionOption(card.id, toColumnId);
        // Policy loads lazily. The adapter always preflights again on drop, so
        // this temporary true cannot bypass backend policy.
        if (!option) return true;
        if (option.allowed) return true;
        const needsOverride = option.blockers.some((blocker) => blocker.code === "OVERRIDE_REQUIRED");
        return option.blockers.every((blocker) => RESOLVABLE_BLOCKERS.has(blocker.code)) &&
          (!needsOverride || (isManager && option.canOverride));
      },
      };
    },
    [adapter, profile, user, terminalColumnIds, isManager, policyVersion, handlePolicyLoaded],
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
        {/*
          Readiness is fetched per card, lazily, inside this provider. The
          provider is keyed to `boardVersion` so a refreshed board re-reads
          readiness instead of showing a status from before the move.
        */}
        <DealReadinessProvider version={boardVersion}>
          <Kanban key={boardVersion} {...config} className="min-h-0 min-w-0" />
        </DealReadinessProvider>
      </div>

      <ManualDealModal
        open={showCreate}
        columns={columns}
        onClose={() => setShowCreate(false)}
        onCreated={refreshBoard}
      />

      {pendingReview ? (
        <TransitionReviewDialog
          key={`${pendingReview.option.columnId}-${pendingReview.option.blockers.map((item) => item.code).join("-")}`}
          option={pendingReview.option}
          onResolve={finishTransitionReview}
        />
      ) : null}
    </div>
  );
}

function PolicyAwareCard({
  card,
  adapter,
  onPolicyLoaded,
}: {
  card: SalesCard;
  adapter: SalesBoardAdapter;
  onPolicyLoaded: () => void;
}) {
  useEffect(() => {
    let cancelled = false;
    void adapter
      .loadTransitionOptions(card.id)
      .then(() => {
        if (!cancelled) onPolicyLoaded();
      })
      .catch(() => {
        // The move adapter will surface a typed API error if the user tries to
        // drag while this best-effort policy hint is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [adapter, card.id, onPolicyLoaded]);

  return <DealCardView card={card} />;
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
