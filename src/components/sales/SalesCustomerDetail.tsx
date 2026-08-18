"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { formatMinorUnits, type NormalizedError } from "@/models/common";
import type { CustomerDetail } from "@/models/salesWorkspace";
import { api, normalizeError } from "@/services/api";

export function SalesCustomerDetail({ id }: { id: string }) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState<NormalizedError | null>(null);
  useEffect(() => { let active = true; api.salesWorkspace.getCustomer(id).then((result) => active && setCustomer(result)).catch((cause) => active && setError(normalizeError(cause))); return () => { active = false; }; }, [id]);
  if (error) return <WorkspacePage eyebrow="Sales / Customers" title="Customer detail" description="The backend customer projection could not be loaded."><p role="alert" className="text-red-300">{error.code === "NOT_FOUND" ? "This customer account is unavailable or outside your scope." : error.message}{error.correlationId ? ` Support id: ${error.correlationId}` : ""}</p></WorkspacePage>;
  if (!customer) return <WorkspacePage eyebrow="Sales / Customers" title="Customer detail" description="Loading customer account…" />;
  return <WorkspacePage eyebrow="Sales / Customers" title={customer.displayName} description={`${customer.organizationType} · ${customer.status}`}><Link href="/sales/customers" className="text-xs font-bold uppercase tracking-wider text-accent hover:underline">← All customers</Link><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="surface-card p-6"><h2 className="font-semibold text-ink">Pipeline</h2><p className="mt-2 text-sm text-ink-dim">{customer.openDealCount} open deals · {customer.wonDealCount} won deals · {customer.totalDealCount} total deals</p><div className="mt-4 space-y-2">{customer.pipelineValueByCurrency.map((bucket) => <p key={bucket.currency} className="text-sm text-ink">{formatMinorUnits(bucket.amountMinor, bucket.currency)}</p>)}</div></section><section className="surface-card p-6"><h2 className="font-semibold text-ink">Contacts</h2><div className="mt-3 space-y-2">{customer.contacts.length ? customer.contacts.map((contact) => <p className="text-sm text-ink" key={String(contact.contactId ?? contact.fullName)}>{String(contact.fullName ?? "Unnamed contact")}</p>) : <p className="text-sm text-ink-dim">No contacts returned.</p>}</div></section><section className="surface-card p-6"><h2 className="font-semibold text-ink">Deals</h2><div className="mt-3 space-y-2">{customer.deals.length ? customer.deals.map((deal) => <p className="text-sm text-ink" key={String(deal.dealId ?? deal.title)}>{String(deal.title ?? "Untitled deal")} · {String(deal.status ?? "—")}</p>) : <p className="text-sm text-ink-dim">No deals returned.</p>}</div></section><section className="surface-card p-6"><h2 className="font-semibold text-ink">Recent activity</h2><div className="mt-3 space-y-2">{customer.recentActivities.length ? customer.recentActivities.map((activity) => <p className="text-sm text-ink" key={String(activity.activityId ?? activity.subject)}>{String(activity.subject ?? activity.activityType ?? "Activity")}</p>) : <p className="text-sm text-ink-dim">No recent activities returned.</p>}</div></section></div></WorkspacePage>;
}
