"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  transitionRequiresEffectiveDate,
  transitionRequiresReason,
  type NcndaQueueItem,
} from "@/models/legalQueue";
import { NCNDA_STATUS_LABELS, type NcndaStatus } from "@/models/ncnda";
import { legalQueue } from "@/services/legalQueue";
import { normalizeError } from "@/services/api";

/**
 * Lifecycle controls for one NCNDA agreement.
 *
 * ⚠ THE STATE MACHINE IS NOT IN THIS FILE, AND MUST NOT BE.
 *
 * The component renders exactly one button per entry in
 * `item.allowedTransitions`, which the backend computes for that agreement in
 * its current status (CR-004 § 4). If the owners change the transition graph,
 * or add a guard, or make `expired` terminal, nothing here changes.
 *
 * The two `transitionRequires*` helpers are the one deliberate exception. They
 * mirror the backend's evidence rules so the form can ask for an effective date
 * or a reason **before** the round trip instead of surfacing a 400 afterwards.
 * They are convenience, not the control: the backend rejects a transition
 * missing either regardless of what this form did.
 *
<<<<<<< Updated upstream
 * The HTTP adapter maps this request to the released BFF NCNDA update route;
 * the mock adapter uses the same transition payload and revision rules.
=======
 * The HTTP adapter maps this action to the released BFF NCNDA update route;
 * the backend remains the authority for the transition graph and revision.
>>>>>>> Stashed changes
 */
export function LifecycleActions({
  item,
  onDone,
}: {
  item: NcndaQueueItem;
  onDone: () => void;
}) {
  const [pending, setPending] = useState<NcndaStatus | null>(null);
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDestructive, setConfirmDestructive] = useState(false);

  if (item.allowedTransitions.length === 0) {
    return (
      <p className="mt-4 text-xs leading-5 text-ink-faint">
        {NCNDA_STATUS_LABELS[item.status]} is a terminal status — no further transition is offered.
      </p>
    );
  }

  const needsDate = pending ? transitionRequiresEffectiveDate(pending) : false;
  const needsReason = pending ? transitionRequiresReason(pending) : false;
  const canSubmit =
    pending !== null && (!needsDate || Boolean(effectiveDate)) && (!needsReason || Boolean(reason.trim()));

  function choose(status: NcndaStatus) {
    setError(null);
    setEffectiveDate("");
    setReason("");
    setPending((current) => (current === status ? null : status));
  }

  async function performSubmit() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      await legalQueue.transition(item.agreementId, {
        dealId: item.dealId,
        counterpartyOrganizationId: item.counterpartyOrganizationId,
        ownerId: item.ownerId,
        toStatus: pending,
        expectedRevision: item.revision,
        // A fresh key per submit: retrying a failed submit must not be
        // deduplicated into silence, and a double submit must not record two.
        idempotencyKey: crypto.randomUUID(),
        ...(needsDate ? { effectiveDate } : {}),
        ...(needsReason ? { reason: reason.trim() } : {}),
      });
      setPending(null);
      onDone();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(
        normalized.status === 409
          ? "This agreement changed on the server. Reload the queue before retrying."
          : normalized.status === 404
            ? "The lifecycle operation is unavailable right now. Nothing was changed."
            : normalized.correlationId
              ? `${normalized.message} (correlation ${normalized.correlationId})`
              : normalized.message,
      );
      if (normalized.status === 409) onDone();
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!pending) return;
    if ((pending === "rejected" || pending === "cancelled") && !confirmDestructive) {
      setConfirmDestructive(true);
      return;
    }
    await performSubmit();
  }

  return (
    <div className="mt-4 rounded-[16px] border border-line bg-white/[0.02] p-4">
      <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">
        Move this agreement to
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.allowedTransitions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => choose(status)}
            aria-pressed={pending === status}
            className={`rounded-full border px-[13px] py-[6px] text-[12px] transition-colors ${
              pending === status
                ? "border-accent bg-accent-soft text-accent"
                : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40"
            }`}
          >
            {NCNDA_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {pending ? (
        <form onSubmit={submit} className="mt-4 grid gap-3">
          {needsDate ? (
            <Input
              label="Effective date"
              type="date"
              value={effectiveDate}
              onChange={(event) => setEffectiveDate(event.target.value)}
              hint="The backend requires an effective date before an agreement may become active."
            />
          ) : null}

          {needsReason ? (
            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-dim">
                Reason
              </span>
              <textarea
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="rounded-field border border-line-strong bg-deep px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none"
              />
              <span className="text-xs text-ink-faint">
                A terminal status with no recorded reason is not reviewable six months later.
              </span>
            </label>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy || !canSubmit}
              className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-40"
            >
              {busy ? "Recording…" : `Move to ${NCNDA_STATUS_LABELS[pending]}`}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="text-xs font-bold uppercase tracking-wider text-ink-dim hover:text-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {confirmDestructive ? <ConfirmDialog title={`Move agreement to ${NCNDA_STATUS_LABELS[pending!] }?`} message="This lifecycle transition is destructive and will be recorded in the legal audit trail." confirmLabel="Confirm transition" busy={busy} onCancel={() => setConfirmDestructive(false)} onConfirm={() => { setConfirmDestructive(false); void performSubmit(); }} /> : null}
      {error ? (
        <p role="alert" className="mt-3 text-xs leading-5 text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
