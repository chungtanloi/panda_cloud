export function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <article className="rounded-[24px] border border-line bg-surface p-5 backdrop-blur-card"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-dim">{label}</p><p className="mt-4 text-3xl font-semibold tracking-tight text-ink">{value}</p>{detail ? <p className="mt-2 text-xs text-accent">{detail}</p> : null}</article>;
}
