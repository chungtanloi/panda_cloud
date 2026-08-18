"use client";

import { useState } from "react";
import Link from "next/link";
import { PRIORITY_LABELS, STATUS_LABELS, VERTICAL_LABELS, VERTICAL_STYLES } from "@/config/sales";
import { contactChannels, type SalesCard, type SalesCardUpdateRequest } from "@/models/sales";
import { formatMinorUnits } from "@/models/common";
import { useAuth } from "@/controllers/AuthContext";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";
import { DealHandoffPanel } from "./DealHandoffPanel";
import { DealChangeRequestPanel } from "./DealChangeRequestPanel";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Detail panel body, passed to the board via `detailPanelRender`.
 *
 * Sales can edit probability, expected close date and the description here.
 * Everything else is read-only — this board is a working surface, not a place
 * to rewrite what the customer or the backend recorded.
 *
 * Stage changes belong to the board drag, not this form: the move operation is
 * the only path that changes `columnId`/`status`, so a save here never touches
 * them (and never needs to — PATCH with a stale `expectedRevision` is rejected
 * with 409/CONFLICT by the backend).
 */
export function DealDetail({
  card,
  close,
  onSaved,
  canEdit,
}: {
  card: SalesCard;
  close: () => void;
  onSaved: () => void;
  canEdit: boolean;
}) {
  const { profile } = useAuth();

  /**
   * "You" when the signed-in identity owns the deal, otherwise the resolved
   * name, otherwise nothing at all.
   *
   * `profile.user.id` and `card.ownerId` are the same value — both are
   * `String(users._id)` (`convex/identity.ts` serializes the auth/me user id
   * from the same row `deals.ownerId` points at) — so the comparison is exact,
   * not a heuristic. A `sales` caller only ever sees deals they own, so in
   * practice they always get "You".
   */
  const ownerLabel =
    profile && card.ownerId === profile.user.id ? "You" : (card.ownerName ?? "");

  const [probability, setProbability] = useState(card.probabilityPercent ?? 0);
  const [expectedCloseDate, setExpectedCloseDate] = useState(card.expectedCloseDate ?? "");
  const [description, setDescription] = useState(card.description ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    probability !== (card.probabilityPercent ?? 0) ||
    expectedCloseDate !== (card.expectedCloseDate ?? "") ||
    description !== (card.description ?? "");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // The contract says both omission and explicit null mean "no change" and
      // does not support clearing an optional field, so changed-but-empty
      // values are simply not sent.
      const body: SalesCardUpdateRequest = { expectedRevision: card.revision };
      if (probability !== (card.probabilityPercent ?? 0)) body.probabilityPercent = probability;
      if (expectedCloseDate !== (card.expectedCloseDate ?? "") && expectedCloseDate) {
        body.expectedCloseDate = expectedCloseDate;
      }
      if (description !== (card.description ?? "") && description) body.description = description;

      await api.sales.updateCard(card.id, body);
      setSaved(true);
      // Give the "Saved" state a beat, then refresh the board so the latest
      // revision (and any server-side changes) is reflected.
      onSaved();
    } catch (cause) {
      const normalized = normalizeError(cause);
      if (normalized.code === "CONFLICT") {
        setError("This deal changed on the server. Reloading the latest version.");
        // Do not retry the stale patch. Reload the board so our copy is current.
        setTimeout(onSaved, 1200);
        return;
      }
      setError(normalized.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-[20px] overflow-y-auto p-[24px]">
      <header className="flex flex-col gap-[10px]">
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex flex-wrap gap-[8px]">
            <span
              className={cn(
                "rounded-field border px-[8px] py-[4px] font-mono text-[9px] uppercase tracking-[1px]",
                VERTICAL_STYLES[card.vertical],
              )}
            >
              {VERTICAL_LABELS[card.vertical]}
            </span>
            <span className="rounded-field border border-line-soft bg-white/[0.03] px-[8px] py-[4px] font-mono text-[9px] uppercase tracking-[1px] text-ink-dim">
              {STATUS_LABELS[card.status]}
            </span>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close panel"
            className="text-ink-dim transition-colors hover:text-accent"
          >
            ✕
          </button>
        </div>

        <h2 className="font-sans text-[18px] font-semibold leading-[26px] text-white">
          {card.title}
        </h2>
      </header>

      <DealHandoffPanel card={card} onRefresh={onSaved} />
      <DealChangeRequestPanel card={card} onChanged={onSaved} />

      {/* Deal value — read-only */}
      <div className="rounded-panel border border-accent/30 bg-accent-soft p-[14px]">
        <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">Deal value</p>
        <p className="pt-[4px] font-sans text-[24px] font-bold leading-[32px] text-accent">
          {formatMinorUnits(card.estimatedValueMinor, card.currency)}
        </p>
      </div>

      {/* Customer — read-only. The panel is not a drag surface, so the links
          here need none of the gesture handling `DealCardView` does. */}
      <section className="flex flex-col gap-[8px] rounded-panel border border-line-soft bg-surface p-[14px]">
        <h3 className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">Customer</h3>
        <Row label="Company" value={card.organizationName ?? "—"} />
        {card.primaryContact ? (
          <>
            <Row label="Contact" value={card.primaryContact.fullName} />
            {card.primaryContact.jobTitle ? (
              <Row label="Job title" value={card.primaryContact.jobTitle} />
            ) : null}
            {contactChannels(card.primaryContact).map((channel) => (
              <div key={channel.kind} className="flex items-baseline justify-between gap-[12px]">
                <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
                  {channel.kind === "phone" ? "Phone" : "Email"}
                </span>
                {channel.href ? (
                  <a
                    href={channel.href}
                    className="text-right font-sans text-[12px] leading-[18px] text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                  >
                    {channel.label}
                  </a>
                ) : (
                  <span className="text-right font-sans text-[12px] leading-[18px] text-ink-dim">
                    {channel.label}
                  </span>
                )}
              </div>
            ))}
            {card.primaryContact.status === "do_not_contact" ? (
              <p className="rounded-field border border-red-400/30 bg-red-400/10 px-[8px] py-[6px] text-[11px] leading-[16px] text-red-300">
                Marked <strong>do not contact</strong>. Details are shown for identification
                only — do not call or email this contact.
              </p>
            ) : null}
            {card.primaryContact.status === "inactive" ? (
              <p className="text-[11px] leading-[16px] text-ink-faint">
                This contact is marked inactive; the details may be out of date.
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-[11px] leading-[16px] text-ink-faint">
            No primary contact on this deal yet.
          </p>
        )}
      </section>

      {/* Record — read-only */}
      <section className="flex flex-col gap-[8px] rounded-panel border border-line-soft bg-surface p-[14px]">
        <h3 className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">Record</h3>
        <Row label="Priority" value={PRIORITY_LABELS[card.priority]} />
        {/* Never `card.ownerId` — an opaque Convex key tells the reader
            nothing. The backend resolves the name; when it cannot, the row is
            omitted rather than falling back to the id. */}
        {ownerLabel ? <Row label="Owner" value={ownerLabel} /> : null}
        <Row label="Last contact" value={lastContactLabel(card)} />
        <Row label="Created" value={formatDateTime(card.createdAt)} />
        <Row label="Updated" value={formatDateTime(card.updatedAt)} />
        {card.wonAt ? <Row label="Won at" value={formatDateTime(card.wonAt)} /> : null}
        {card.lostReason ? <Row label="Lost reason" value={card.lostReason} /> : null}
      </section>

      {/* Sales-owned fields */}
      <section className="flex flex-col gap-[14px]">
        <h3 className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
          Working fields
          {!canEdit ? <span className="pl-[8px] text-ink-faint">· read-only</span> : null}
        </h3>

        <label className="flex flex-col gap-[8px]">
          <span className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
            Probability
            <span className="text-accent">{probability}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={probability}
            disabled={!canEdit}
            onChange={(event) => setProbability(Number(event.target.value))}
            className="circuit-range w-full disabled:opacity-40"
            style={{ ["--fill" as string]: `${probability}%` }}
          />
        </label>

        <label className="flex flex-col gap-[8px]">
          <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
            Expected close
          </span>
          <input
            type="date"
            value={expectedCloseDate}
            disabled={!canEdit}
            onChange={(event) => setExpectedCloseDate(event.target.value)}
            className="w-full rounded-field border border-line-strong bg-deep px-[14px] py-[10px] font-sans text-[13px] text-ink focus:border-accent focus:outline-none disabled:opacity-40"
          />
        </label>

        <label className="flex flex-col gap-[8px]">
          <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
            Description
          </span>
          <textarea
            rows={4}
            value={description}
            disabled={!canEdit}
            placeholder="Scope, next actions, blockers…"
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-y rounded-field border border-line-strong bg-deep px-[14px] py-[10px] font-sans text-[13px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none disabled:opacity-40"
          />
        </label>

        {error ? (
          <p role="alert" className="font-sans text-[12px] text-red-400">
            {error}
          </p>
        ) : null}

        {canEdit ? (
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex items-center justify-center gap-[8px] rounded-full bg-accent px-[24px] py-[11px] font-sans text-[12px] font-bold leading-[18px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] disabled:pointer-events-none disabled:opacity-40"
          >
            {saving ? "Saving…" : saved && !dirty ? "Saved" : "Save changes"}
          </button>
        ) : null}
      </section>
    </div>
  );
}

function lastContactLabel(card: SalesCard): string {
  if (!card.lastContactAt && !card.lastContactMethod) return "—";
  const when = formatDateTime(card.lastContactAt);
  return card.lastContactMethod ? `${card.lastContactMethod} · ${when}` : when;
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-[12px]">
      <span className="shrink-0 font-sans text-[11px] leading-[17px] text-ink-dim">{label}</span>
      <span
        className={cn(
          "min-w-0 truncate text-right font-sans text-[12px] leading-[18px] text-ink",
          mono && "font-mono text-[11px] tracking-[0.4px] text-ink-dim",
        )}
      >
        {value}
      </span>
    </div>
  );
}
