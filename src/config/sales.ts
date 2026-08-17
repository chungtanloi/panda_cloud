import type { DealPriority, DealStatus, DealVertical } from "@/models/sales";

/**
 * Sales board presentation config.
 *
 * Columns themselves come from the API (`api.sales.listColumns`), so sales ops
 * can change the pipeline without a deploy. Only the things the UI must know —
 * badge labels and colours per vertical, priority and status — live here.
 */

export const VERTICAL_LABELS: Record<DealVertical, string> = {
  land: "Land",
  gpu: "GPU",
  token: "Token",
  hyperscale: "Hyperscale",
};

/**
 * Badge tints. Deliberately not the accent colour — on a board every card
 * glowing cyan would carry no information. The accent is reserved for the
 * user's own interactions (hover, drag, selection).
 */
export const VERTICAL_STYLES: Record<DealVertical, string> = {
  land: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  gpu: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  token: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  hyperscale: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

export const PRIORITY_LABELS: Record<DealPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_STYLES: Record<DealPriority, string> = {
  low: "border-line-soft bg-white/[0.03] text-ink-dim",
  normal: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  high: "border-orange-400/30 bg-orange-400/10 text-orange-300",
  urgent: "border-red-400/40 bg-red-400/10 text-red-300",
};

export const STATUS_LABELS: Record<DealStatus, string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
  on_hold: "On hold",
  archived: "Archived",
};

export const SALES_BOARD = {
  title: "Sales Pipeline",
  subtitle: "Every deal across land, GPU, token and hyperscale, in one board.",
  filterAllLabel: "All verticals",
  emptyTitle: "No deals yet",
  emptyBody:
    "Cards appear here automatically when a customer completes an assessment, booking, investment or hyperscale request.",
  searchPlaceholder: "Search deals…",
} as const;
