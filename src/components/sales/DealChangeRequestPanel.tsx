"use client";

import { useCallback, useEffect, useState } from "react";
import { effectiveRoles } from "@/models/auth";
import type { DealChangeRequest, DealChangeRequestType } from "@/models";
import type { SalesCard } from "@/models/sales";
import { useAuth } from "@/controllers/AuthContext";
import { api, normalizeError } from "@/services/api";

const LABELS: Record<DealChangeRequestType, string> = {
  mark_won: "Mark as Won",
  archive: "Remove from pipeline",
};

export function DealChangeRequestPanel({
  card,
  onChanged,
}: {
  card: SalesCard;
  onChanged: () => void;
}) {
  const { profile } = useAuth();
  const isSales = effectiveRoles(profile).includes("sales");
  const [items, setItems] = useState<DealChangeRequest[]>([]);
  const [type, setType] = useState<DealChangeRequestType>("mark_won");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await api.dealRequests.listForDeal(card.id));
    } catch (cause) {
      setError(normalizeError(cause).message);
    } finally {
      setLoading(false);
    }
  }, [card.id]);

  useEffect(() => {
    void load();
    // Reload when the board replaces the card with a newer revision.
  }, [card.id, card.revision, load]);

  if (!isSales) return null;

  const pending = items.find((item) => item.status === "pending");
  const terminal = card.status === "won" || card.status === "lost" || card.status === "archived";

  async function submit() {
    if (reason.trim().length < 5) {
      setError("Please explain the business reason in at least 5 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.dealRequests.create(card.id, {
        requestType: type,
        reason: reason.trim(),
        expectedDealRevision: card.revision,
        idempotencyKey: crypto.randomUUID(),
      });
      setReason("");
      await load();
      onChanged();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(
        normalized.code === "CONFLICT"
          ? "The deal or request changed. The latest data is being reloaded."
          : normalized.message,
      );
      if (normalized.code === "CONFLICT") {
        await load();
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-[12px] rounded-panel border border-amber-300/25 bg-amber-300/[0.06] p-[14px]">
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-amber-200">
          Manager approval
        </p>
        <h3 className="pt-[3px] text-[14px] font-semibold text-white">Sensitive deal actions</h3>
        <p className="pt-[4px] text-[11px] leading-[17px] text-ink-dim">
          Sales proposes the change. A Manager or Admin reviews it before the backend marks
          this deal Won or archives it.
        </p>
      </div>

      {loading ? <p className="text-[11px] text-ink-dim">Loading requests…</p> : null}

      {pending ? (
        <div className="rounded-field border border-amber-300/30 bg-black/20 p-[10px]">
          <p className="text-[11px] font-semibold text-amber-200">
            Pending · {LABELS[pending.requestType]}
          </p>
          <p className="pt-[3px] text-[11px] leading-[16px] text-ink-dim">{pending.reason}</p>
          <p className="pt-[5px] font-mono text-[9px] uppercase tracking-[0.8px] text-ink-faint">
            Submitted {new Date(pending.createdAt).toLocaleString()}
          </p>
        </div>
      ) : !terminal ? (
        <>
          <div className="grid grid-cols-2 gap-[8px]">
            {(["mark_won", "archive"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`rounded-field border px-[10px] py-[8px] text-[11px] font-semibold transition-colors ${
                  type === value
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line-soft text-ink-dim hover:border-line-strong"
                }`}
              >
                {LABELS[value]}
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-[6px]">
            <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-dim">
              Business reason
            </span>
            <textarea
              rows={3}
              value={reason}
              maxLength={1000}
              onChange={(event) => setReason(event.target.value)}
              placeholder={type === "mark_won" ? "Why is this deal ready to close?" : "Why should this card leave the active pipeline?"}
              className="resize-y rounded-field border border-line-strong bg-deep px-[12px] py-[9px] text-[12px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-full bg-amber-300 px-[16px] py-[9px] text-[11px] font-bold text-black disabled:opacity-50"
          >
            {saving ? "Submitting…" : `Send ${LABELS[type]} request`}
          </button>
        </>
      ) : (
        <p className="text-[11px] text-ink-dim">This deal is already in a terminal state.</p>
      )}

      {items.filter((item) => item.status !== "pending").slice(0, 2).map((item) => (
        <div key={item.requestId} className="border-t border-line-soft pt-[8px] text-[10px] text-ink-dim">
          <span className={item.status === "approved" ? "text-emerald-300" : "text-red-300"}>
            {item.status.toUpperCase()}
          </span>
          {` · ${LABELS[item.requestType]}`}
          {item.decisionComment ? ` · ${item.decisionComment}` : ""}
        </div>
      ))}

      {error ? <p role="alert" className="text-[11px] text-red-300">{error}</p> : null}
    </section>
  );
}
