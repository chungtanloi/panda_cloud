"use client";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" role="presentation" onMouseDown={onCancel}>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id="confirm-title" className="text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink-dim">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-full border border-line-strong px-4 py-2 text-xs text-ink-dim disabled:opacity-50">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy} className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-fg disabled:opacity-50">{busy ? "Working…" : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
