import { PRIORITY_LABELS, PRIORITY_STYLES, STATUS_LABELS, VERTICAL_LABELS, VERTICAL_STYLES } from "@/config/sales";
import { contactChannels, type SalesCard } from "@/models/sales";
import { formatMinorUnitsCompact } from "@/models/common";
import { cn } from "@/lib/cn";

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * One-tap call / email affordance.
 *
 * The whole card is the board's drag handle, so an anchor inside it normally
 * either swallows the drag or starts one by accident. `stopPropagation` on
 * pointer-down keeps the drag layer from claiming the gesture, and
 * `draggable={false}` stops the browser's native link-drag. The trade-off is
 * deliberate and narrow: you cannot begin a drag from these two small targets,
 * but every other pixel of the card still drags.
 *
 * `href === null` means the contact is `do_not_contact` (DEALFLOW § 5.1). The
 * value still renders — a salesperson needs to recognise the record — but as
 * inert text, never one tap from dialling.
 */
function ContactLink({ href, label, title }: { href: string | null; label: string; title: string }) {
  if (!href) {
    return (
      <span
        title={`${title} — marked do not contact`}
        className="truncate font-sans text-[10px] leading-[14px] text-ink-faint line-through decoration-ink-faint/60"
      >
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      title={title}
      draggable={false}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      className="truncate rounded-[4px] font-sans text-[10px] leading-[14px] text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
    >
      {label}
    </a>
  );
}

/**
 * Card renderer passed to the board via `cardRender`.
 *
 * Shows who the customer is and how to reach them, because that is what a
 * salesperson does with a pipeline card (UC-006 — calls and emails are logged
 * against the deal). Company name and contact come denormalized on the wire
 * DTO; the board never resolves an id itself.
 *
 * Apart from the two contact links above, nothing here is interactive: the card
 * is the drag handle.
 */
export function DealCardView({ card }: { card: SalesCard }) {
  const channels = contactChannels(card.primaryContact);
  const phone = channels.find((channel) => channel.kind === "phone");
  const email = channels.find((channel) => channel.kind === "email");

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

      {card.organizationName ? (
        <p className="truncate font-sans text-[11px] font-semibold leading-[15px] text-ink-dim">
          {card.organizationName}
        </p>
      ) : null}

      <h3 className="font-sans text-[13px] font-medium leading-[19px] text-white">{card.title}</h3>

      <p className="font-sans text-[11px] leading-[16px] text-ink-dim">
        {formatMinorUnitsCompact(card.estimatedValueMinor, card.currency)}
        {card.probabilityPercent !== null && card.probabilityPercent !== undefined
          ? ` · ${card.probabilityPercent}%`
          : ""}
        {card.expectedCloseDate ? ` · close ${card.expectedCloseDate}` : ""}
      </p>

      {card.primaryContact ? (
        <div className="flex flex-col gap-[3px] rounded-[8px] bg-white/[0.03] px-[8px] py-[6px]">
          <span className="truncate font-sans text-[10px] leading-[14px] text-ink">
            {card.primaryContact.fullName}
            {card.primaryContact.jobTitle ? (
              <span className="text-ink-faint"> · {card.primaryContact.jobTitle}</span>
            ) : null}
          </span>
          {phone ? <ContactLink href={phone.href} label={phone.label} title="Call" /> : null}
          {email ? <ContactLink href={email.href} label={email.label} title="Email" /> : null}
          {!phone && !email ? (
            <span className="font-sans text-[10px] leading-[14px] text-ink-faint">
              No phone or email on record
            </span>
          ) : null}
        </div>
      ) : (
        <p className="font-sans text-[10px] leading-[14px] text-ink-faint">No contact yet</p>
      )}

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
