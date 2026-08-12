import { SOURCE_LABELS, SOURCE_STYLES, type DealSource } from "@/config/sales";
import type { DealCard } from "@/models/sales";
import { cn } from "@/lib/cn";

/**
 * Card renderer passed to the board via `cardRender`.
 *
 * The whole card is the drag handle, so nothing interactive goes inside — a
 * button here would either swallow the drag or start one accidentally. Links
 * live in the detail panel instead.
 */
export function DealCardView({ card }: { card: DealCard }) {
  const source = card.source as DealSource;

  return (
    // data-deal-source drives the CSS source filter — see .kanban-scope in
    // globals.css. Filtering this way keeps cards mounted, so drag state and
    // scroll position survive.
    <article data-deal-source={source} className="flex flex-col gap-[10px]">
      <header className="flex items-start justify-between gap-[8px]">
        <span
          className={cn(
            "rounded-field border px-[7px] py-[3px] font-mono text-[9px] uppercase tracking-[1px]",
            SOURCE_STYLES[source],
          )}
        >
          {SOURCE_LABELS[source]}
        </span>

        <span className="font-mono text-[9px] tracking-[0.6px] text-ink-faint">
          {card.reference}
        </span>
      </header>

      <h3 className="font-sans text-[13px] font-medium leading-[19px] text-white">{card.title}</h3>

      <p className="font-sans text-[11px] leading-[16px] text-ink-dim">
        {card.contactName}
        {card.companyName ? ` · ${card.companyName}` : ""}
      </p>

      {card.highlights?.length ? (
        <ul className="flex flex-wrap gap-[5px]">
          {card.highlights.slice(0, 3).map((highlight) => (
            <li
              key={highlight.label}
              className="rounded-field border border-line-soft bg-white/[0.03] px-[6px] py-[3px] font-mono text-[9px] text-ink-dim"
            >
              {highlight.label}: <span className="text-ink">{highlight.value}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {card.dealValueUsd !== undefined || card.probability !== undefined ? (
        <footer className="flex items-center justify-between gap-[8px] border-t border-line-soft pt-[8px]">
          {card.dealValueUsd !== undefined ? (
            <span className="font-sans text-[12px] font-semibold leading-[18px] text-accent">
              {formatUsd(card.dealValueUsd)}
            </span>
          ) : (
            <span />
          )}

          {card.probability !== undefined ? (
            <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-dim">
              {card.probability}%
            </span>
          ) : null}
        </footer>
      ) : null}
    </article>
  );
}

/** Compact currency so a $252,500,000 deal does not blow the card width. */
export function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toLocaleString("en-US")}`;
}
