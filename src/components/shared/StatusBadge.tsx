import { cn } from "@/lib/cn";
export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const positive = ["active", "running", "completed", "won", "accepted", "online", "healthy", "success", "approved"].some((value) => normalized.includes(value));
  const negative = ["error", "failed", "lost", "offline", "critical", "rejected", "cancelled", "overdue"].some((value) => normalized.includes(value));
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", positive ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : negative ? "border-red-400/30 bg-red-400/10 text-red-300" : "border-amber-400/30 bg-amber-400/10 text-amber-200")}>{status}</span>;
}
