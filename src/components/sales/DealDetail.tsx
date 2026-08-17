"use client";

import { useState } from "react";
import { PRIORITY_LABELS, STATUS_LABELS, VERTICAL_LABELS, VERTICAL_STYLES } from "@/config/sales";
import type { SalesCard, SalesCardUpdateRequest } from "@/models/sales";
import { formatMinorUnits } from "@/models/common";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";

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

      {/* Deal value — read-only */}
      <div className="rounded-panel border border-accent/30 bg-accent-soft p-[14px]">
        <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-dim">Deal value</p>
        <p className="pt-[4px] font-sans text-[24px] font-bold leading-[32px] text-accent">
          {formatMinorUnits(card.estimatedValueMinor, card.currency)}
        </p>
      </div>

      {/* Record — read-only */}
      <section className="flex flex-col gap-[8px] rounded-panel border border-line-soft bg-surface p-[14px]">
        <h3 className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">Record</h3>
        <Row label="Priority" value={PRIORITY_LABELS[card.priority]} />
        <Row label="Owner" value={card.ownerId} mono />
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
