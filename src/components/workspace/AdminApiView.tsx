"use client";
import { api } from "@/services/api";
import { useAsync } from "@/controllers/useAsync";
import { WorkspacePage } from "./WorkspacePage";
import { LoadingState, ErrorState } from "@/components/ui/states";

const labels = { overview: ["Admin / Overview", "System Administration"], users: ["Admin / Identity", "User Management"], roles: ["Admin / Governance", "Roles"], system: ["Admin / System", "System Health"], audit: ["Admin / Governance", "Audit Logs"] } as const;
type Kind = keyof typeof labels;
export function AdminApiView({ kind }: { kind: Kind }) {
  const { state, run } = useAsync(() => kind === "overview" ? api.admin.overview() : kind === "users" ? api.admin.users() : kind === "roles" ? api.admin.roles() : kind === "system" ? api.admin.health() : api.admin.auditLogs(), { immediate: [] });
  const [eyebrow, title] = labels[kind];
  if (state.status === "loading" || state.status === "idle") return <WorkspacePage eyebrow={eyebrow} title={title} description="Backend-owned administrative data."><LoadingState label={`Loading ${title}`} /></WorkspacePage>;
  if (state.status === "error") return <WorkspacePage eyebrow={eyebrow} title={title} description="Backend-owned administrative data."><ErrorState error={state.error} onRetry={() => void run()} /></WorkspacePage>;
  const data = state.data as Record<string, unknown>;
  const rows = Array.isArray(data.items) ? data.items : [];
  return <WorkspacePage eyebrow={eyebrow} title={title} description="Backend-owned administrative data."><div className="rounded-2xl border border-line bg-surface p-6"><pre className="overflow-auto text-xs text-ink-dim">{JSON.stringify(rows.length ? rows : data, null, 2)}</pre>{rows.length === 0 ? <p className="mt-4 text-sm text-ink-dim">No records returned by the backend.</p> : null}</div></WorkspacePage>;
}
