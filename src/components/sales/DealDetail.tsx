"use client";

import Link from "next/link";
import { useState } from "react";
import { SOURCE_LABELS, SOURCE_ROUTES, SOURCE_STYLES, type DealSource } from "@/config/sales";
import type { DealCard } from "@/models/sales";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";
import { formatUsd } from "./DealCardView";

/**
 * Detail panel body, passed to the board via `detailPanelRender`.
 *
 * Sales can edit probability, close date and notes here. Everything the
 * customer submitted is read-only — this board is a working surface, not a
 * place to rewrite what someone told us.
 */
export function DealDetail({
  card,
  close,
  onSaved,
  canEdit,
}: {
  card: DealCard;
  close: () => void;
  onSaved: (updated: DealCard) => void;
  canEdit: boolean;
}) {
  const source = card.source as DealSource;
  const submissionRoute = card.submissionId ? SOURCE_ROUTES[source]?.(card.submissionId) : null;

  const [probability, setProbability] = useState(card.probability ?? 0);
  const [closeDate, setCloseDate] = useState(card.closeDate ?? "");
  const [notes, setNotes] = useState(card.notes ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    probability !== (card.probability ?? 0) ||
    closeDate !== (card.closeDate ?? "") ||
    notes !== (card.notes ?? "");

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.sales.updateCard(card.id, {
        probability,
        closeDate: closeDate || undefined,
        notes: notes || undefined,
      });
      onSaved(updated);
      setSaved(true);
    } catch (cause) {
      setError(normalizeError(cause).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-[20px] overflow-y-auto p-[24px]">
      <header className="flex flex-col gap-[10px]">
        <div className="flex items-start justify-between gap-[12px]">
          <span
            className={cn(
              "rounded-field border px-[8px] py-[4px] font-mono text-[9px] uppercase tracking-[1px]",
              SOURCE_STYLES[source],
            )}
          >
            {SOURCE_LABELS[source]}
          </span>

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

        <p className="font-mono text-[11px] tracking-[0.6px] text-accent">{card.reference}</p>
      </header>

      {/* Contact — read-only */}
      <section className="flex flex-col gap-[8px] rounded-panel border border-line-soft bg-surface p-[14px]">
        <h3 className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">Contact</h3>

        <Row label="Name" value={card.contactName} />
        {card.companyName ? <Row label="Company" value={card.companyName} /> : null}
        <Row label="Email" value={card.email} href={`mailto:${card.email}`} />
        {card.phone ? <Row label="Phone" value={card.phone} href={`tel:${card.phone}`} /> : null}
      </section>

      {/* Submission highlights — read-only */}
      {card.highlights?.length ? (
        <section className="flex flex-col gap-[8px] rounded-panel border border-line-soft bg-surface p-[14px]">
          <h3 className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
            From the submission
          </h3>

          {card.highlights.map((highlight) => (
            <Row key={highlight.label} label={highlight.label} value={highlight.value} />
          ))}

          {submissionRoute ? (
            <Link
              href={submissionRoute}
              className="pt-[4px] font-sans text-[12px] text-accent hover:underline"
            >
              Open full submission →
            </Link>
          ) : null}
        </section>
      ) : null}

      {/* Sales-owned fields */}
      <section className="flex flex-col gap-[14px]">
        <h3 className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
          Pipeline
          {!canEdit ? <span className="pl-[8px] text-ink-faint">· read-only</span> : null}
        </h3>

        {card.dealValueUsd !== undefined ? (
          <div className="rounded-panel border border-accent/30 bg-accent-soft p-[14px]">
            <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
              Deal value
            </p>
            <p className="pt-[4px] font-sans text-[24px] font-bold leading-[32px] text-accent">
              {formatUsd(card.dealValueUsd)}
            </p>
          </div>
        ) : null}

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
            value={closeDate}
            disabled={!canEdit}
            onChange={(event) => setCloseDate(event.target.value)}
            className="w-full rounded-field border border-line-strong bg-deep px-[14px] py-[10px] font-sans text-[13px] text-ink focus:border-accent focus:outline-none disabled:opacity-40"
          />
        </label>

        <label className="flex flex-col gap-[8px]">
          <span className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">
            Notes
          </span>
          <textarea
            rows={4}
            value={notes}
            disabled={!canEdit}
            placeholder="Call summary, next action, blockers…"
            onChange={(event) => setNotes(event.target.value)}
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

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-[12px]">
      <span className="shrink-0 font-sans text-[11px] leading-[17px] text-ink-dim">{label}</span>
      {href ? (
        <a
          href={href}
          className="min-w-0 truncate font-sans text-[12px] leading-[18px] text-accent hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="min-w-0 truncate text-right font-sans text-[12px] leading-[18px] text-ink">
          {value}
        </span>
      )}
    </div>
  );
}
