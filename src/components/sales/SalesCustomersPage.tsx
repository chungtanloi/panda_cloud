"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { formatMinorUnits, type NormalizedError } from "@/models/common";
import type { CustomerSummary } from "@/models/salesWorkspace";
import { api, normalizeError } from "@/services/api";

export function SalesCustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);
  const load = useCallback(async (nextCursor?: string, append = false) => { append ? setLoadingMore(true) : setLoading(true); setError(null); try { const page = await api.salesWorkspace.listCustomers({ limit: 50, cursor: nextCursor }); setCustomers((current) => append ? [...current, ...page.customers] : page.customers); setCursor(page.continueCursor ?? null); setIsDone(page.isDone); } catch (cause) { setError(normalizeError(cause)); } finally { append ? setLoadingMore(false) : setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <WorkspacePage eyebrow="Sales / Customers" title="Customers" description="Account / Customer 360 projections derived from organizations, contacts, leads, deals, and activities.">{loading ? <p className="text-ink-dim">Loading customers…</p> : error ? <p role="alert" className="text-red-300">{error.code === "FORBIDDEN" ? "Your membership cannot view customer accounts." : error.message}{error.correlationId ? ` Support id: ${error.correlationId}` : ""}</p> : <><div className="surface-card divide-y divide-white/10">{customers.length ? customers.map((customer) => <Link href={`/sales/customers/${customer.organizationId}`} className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-white/[0.03]" key={customer.organizationId}><div><p className="text-ink">{customer.displayName}</p><p className="text-xs text-ink-dim">{customer.organizationType} · {customer.status} · {customer.openDealCount} open / {customer.wonDealCount} won</p></div><div className="text-right text-xs text-ink-dim">{customer.pipelineValueByCurrency.length ? customer.pipelineValueByCurrency.map((bucket) => <p key={bucket.currency}>{formatMinorUnits(bucket.amountMinor, bucket.currency)}</p>) : <p>—</p>}</div></Link>) : <p className="p-8 text-center text-ink-dim">No customer accounts found.</p>}</div>{!isDone && cursor ? <button type="button" disabled={loadingMore} onClick={() => void load(cursor, true)} className="mt-5 rounded-full border border-accent/50 px-4 py-2 text-sm text-accent disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button> : null}</>}</WorkspacePage>;
}
