import { PRIORITY_LABELS, PRIORITY_STYLES, STATUS_LABELS, VERTICAL_LABELS, VERTICAL_STYLES } from "@/config/sales";
import type { SalesCard } from "@/models/sales";
import { formatMinorUnitsCompact } from "@/models/common";
import { cn } from "@/lib/cn";

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Card renderer passed to the board via `cardRender`.
 *
 * The whole card is the drag handle, so nothing interactive goes inside — a
 * button here would either swallow the drag or start one accidentally. Links
 * live in the detail panel instead.
 */
export function DealCardView({ card }: { card: SalesCard }) {
  return (
    // data-deal-vertical drives the CSS vertical filter — see .kanban-scope in
    // globals.css. Filtering this way keeps cards mounted, so drag state and
    // scroll position survive.
    <article data-deal-vertical={card.vertical} className="flex flex-col gap-[10px]">
      <header className="flex items-start justify-between gap-[8px]">
        <span
          className={cn(
            "rounded-field border px-[7px] py-[3px] font-mono text-[9px] uppercase tracking-[1px]",
            VERTICAL_STYLES[card.vertical],
          )}
        >
          {VERTICAL_LABELS[card.vertical]}
        </span>

        <span
          className={cn(
            "rounded-field border px-[7px] py-[3px] font-mono text-[9px] uppercase tracking-[1px]",
            PRIORITY_STYLES[card.priority],
          )}
        >
          {PRIORITY_LABELS[card.priority]}
        </span>
      </header>

      <h3 className="font-sans text-[13px] font-medium leading-[19px] text-white">{card.title}</h3>

      <p className="font-sans text-[11px] leading-[16px] text-ink-dim">
        {formatMinorUnitsCompact(card.estimatedValueMinor, card.currency)}
        {card.probabilityPercent !== null && card.probabilityPercent !== undefined
          ? ` · ${card.probabilityPercent}%`
          : ""}
        {card.expectedCloseDate ? ` · close ${card.expectedCloseDate}` : ""}
      </p>

      <footer className="flex items-center justify-between gap-[8px] border-t border-line-soft pt-[8px]">
        <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-faint">
          {STATUS_LABELS[card.status]}
        </span>
        <span className="font-mono text-[9px] tracking-[0.6px] text-ink-faint">
          {shortDate(card.updatedAt)}
        </span>
      </footer>
    </article>
  );
}
