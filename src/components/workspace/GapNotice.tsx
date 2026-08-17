/**
 * A visible, honest statement that a surface is blocked on the backend.
 *
 * These workspaces are built against route tables and domain documents whose
 * operations do not exist yet. The alternative to a notice like this is a page
 * that silently shows nothing, which reads as "no data" when the truth is "no
 * endpoint" — and sends whoever opens it hunting for a bug that isn't there.
 *
 * `tone`:
 *   "gap"     the backend has an acknowledged hole here (schema undecided,
 *             operation unwritten). Neutral, informational.
 *   "blocked" this specific screen cannot function until that hole is filled.
 */
export function GapNotice({
  tone = "gap",
  title,
  children,
  source,
}: {
  tone?: "gap" | "blocked";
  title: string;
  children: React.ReactNode;
  /** The document or file that records the gap. Keeps claims checkable. */
  source?: string;
}) {
  const blocked = tone === "blocked";
  return (
    <aside
      className={
        blocked
          ? "rounded-[20px] border border-amber-400/30 bg-amber-400/[0.07] p-5"
          : "rounded-[20px] border border-line bg-surface p-5"
      }
    >
      <p
        className={
          blocked
            ? "text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300"
            : "text-[10px] font-bold uppercase tracking-[0.2em] text-ink-dim"
        }
      >
        {blocked ? "Blocked on backend" : "Known gap"}
      </p>
      <h3 className="mt-2 text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 space-y-2 text-xs leading-5 text-ink-dim">{children}</div>
      {source ? (
        <p className="mt-3 font-mono text-[10px] leading-4 text-ink-faint">Source: {source}</p>
      ) : null}
    </aside>
  );
}
