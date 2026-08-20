"use client";
export function AdminConflictToast({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
      <p className="font-semibold">Conflict detected</p>
      <p className="mt-1 text-ink-dim">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-200 hover:bg-amber-400/20">
          Reload data
        </button>
      )}
    </div>
  );
}
