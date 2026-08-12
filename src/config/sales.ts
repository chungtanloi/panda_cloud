import type { RequestKind } from "@/models/dashboard";

/**
 * Sales board presentation config.
 *
 * Columns themselves come from the API (`api.sales.listColumns`) so sales ops
 * can change the pipeline without a deploy. Only the things the UI must know
 * about — badge labels and colours per source — live here.
 */

export type DealSource = RequestKind | "lead_form";

export const SOURCE_LABELS: Record<DealSource, string> = {
  assessment: "Land",
  booking: "GPU",
  investment: "Token",
  hyperscale: "Hyperscale",
  lead_form: "Enquiry",
};

/**
 * Badge tints. Deliberately not the accent colour — on a board every card
 * glowing cyan would carry no information. The accent is reserved for the
 * user's own interactions (hover, drag, selection).
 */
export const SOURCE_STYLES: Record<DealSource, string> = {
  assessment: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  booking: "border-sky-400/30 bg-sky-400/10 text-sky-300",
  investment: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  hyperscale: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  lead_form: "border-line-soft bg-white/5 text-ink-dim",
};

/** Where "Open submission" links to, per source. */
export const SOURCE_ROUTES: Record<DealSource, ((id: string) => string) | null> = {
  assessment: (id) => `/assessment/results?id=${encodeURIComponent(id)}`,
  booking: null, // no customer-facing detail route yet
  investment: (id) => `/investment/confirmation?id=${encodeURIComponent(id)}`,
  hyperscale: null,
  lead_form: null,
};

export const SALES_BOARD = {
  title: "Sales Pipeline",
  subtitle: "Every inbound request across the four flows, in one board.",
  filterAllLabel: "All sources",
  emptyTitle: "No deals yet",
  emptyBody:
    "Cards appear here automatically when a customer completes an assessment, booking, investment or hyperscale request.",
  searchPlaceholder: "Search company, contact or reference…",
} as const;
