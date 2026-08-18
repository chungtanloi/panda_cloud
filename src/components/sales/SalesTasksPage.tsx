"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import type { NormalizedError } from "@/models/common";
import type { ActivitySummary } from "@/models/salesWorkspace";
import type { DealLookupItem } from "@/models/lookup";
import { api, normalizeError } from "@/services/api";
import { lookup } from "@/services/lookup";

function dueLabel(value: string | null): string { if (!value) return "No follow-up date"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }

export function SalesTasksPage() {
  const [tasks, setTasks] = useState<ActivitySummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [dealQuery, setDealQuery] = useState("");
  const [dealMatches, setDealMatches] = useState<readonly DealLookupItem[]>([]);
  const [selectedDeal, setSelectedDeal] = useState<DealLookupItem | null>(null);

  const load = useCallback(async (nextCursor?: string, append = false) => {
    append ? setLoadingMore(true) : setLoading(true); setError(null);
    try {
      const page = await api.salesWorkspace.listTasks({ limit: 50, cursor: nextCursor, ...(selectedDeal ? { dealId: selectedDeal.dealId } : {}) });
      setTasks((current) => append ? [...current, ...page.tasks] : page.tasks);
      setCursor(page.continueCursor ?? null); setIsDone(page.isDone);
    } catch (cause) { setError(normalizeError(cause)); } finally { append ? setLoadingMore(false) : setLoading(false); }
  }, [selectedDeal]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (dealQuery.trim().length < 2) { setDealMatches([]); return; }
    let active = true;
    lookup.deals({ q: dealQuery.trim(), limit: 10 })
      .then((page) => active && setDealMatches(page.items))
      .catch(() => active && setDealMatches([]));
    return () => { active = false; };
  }, [dealQuery]);

  const complete = async (task: ActivitySummary) => {
    setUpdating(task.activityId); setError(null);
    try {
      const result = await api.salesWorkspace.updateTask(task.activityId, { status: "completed" });
      setTasks((current) => current.map((item) => item.activityId === result.activityId ? { ...item, status: "completed", updatedAt: result.updatedAt } : item));
    } catch (cause) { setError(normalizeError(cause)); } finally { setUpdating(null); }
  };

  return <WorkspacePage eyebrow="Sales / Tasks" title="Tasks & follow-ups" description="Activity-backed tasks from the Sales API. Completing a task writes the backend activity record."><div className="mb-5 max-w-md"><label className="text-sm text-ink-dim" htmlFor="task-deal-search">Filter by deal</label><input id="task-deal-search" value={dealQuery} onChange={(event) => setDealQuery(event.target.value)} placeholder="Search a deal title" className="mt-2 w-full rounded-lg border border-white/15 bg-surface px-3 py-2 text-sm text-ink" />{selectedDeal ? <p className="mt-2 text-xs text-ink-dim">Filtering {selectedDeal.title} <button type="button" className="text-accent underline" onClick={() => setSelectedDeal(null)}>Clear</button></p> : null}{dealMatches.length ? <div className="mt-2 overflow-hidden rounded-lg border border-white/10">{dealMatches.map((deal) => <button type="button" className="block w-full border-b border-white/5 px-3 py-2 text-left text-sm text-ink hover:bg-white/[0.03]" key={deal.dealId} onClick={() => { setSelectedDeal(deal); setDealQuery(""); setDealMatches([]); }}>{deal.title}<span className="ml-2 text-xs text-ink-dim">{deal.organizationName}</span></button>)}</div> : null}</div>{loading ? <p className="text-ink-dim">Loading tasks…</p> : error ? <p role="alert" className="text-red-300">{error.message}{error.correlationId ? ` Support id: ${error.correlationId}` : ""}</p> : <><div className="surface-card divide-y divide-white/10">{tasks.length ? tasks.map((task) => <div className="flex flex-wrap items-center justify-between gap-3 p-4" key={task.activityId}><div><p className="text-ink">{task.subject ?? "Untitled task"}</p><p className="text-xs text-ink-dim">Due {dueLabel(task.nextFollowUpAt)} · {task.status}</p></div>{task.status === "planned" ? <button type="button" onClick={() => void complete(task)} disabled={updating === task.activityId} className="rounded-full border border-accent/50 px-3 py-1 text-xs text-accent disabled:opacity-50">{updating === task.activityId ? "Saving…" : "Mark completed"}</button> : <span className="rounded-full border border-white/15 px-2 py-1 text-xs text-ink-dim">{task.status}</span>}</div>) : <p className="p-8 text-center text-ink-dim">No tasks found.</p>}</div>{!isDone && cursor ? <button type="button" disabled={loadingMore} onClick={() => void load(cursor, true)} className="mt-5 rounded-full border border-accent/50 px-4 py-2 text-sm text-accent disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button> : null}</>}</WorkspacePage>;
}
