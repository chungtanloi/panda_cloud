import Link from "next/link";
import { WorkspacePage } from "./WorkspacePage";

const content = {
  SALES: { title: "Sales Command Center", description: "Move demand from lead to qualification, proposal, negotiation and close.", stats: [{ label: "New Leads", value: "18", detail: "+4 this week" }, { label: "Active Leads", value: "64" }, { label: "Pipeline Value", value: "$12.8M" }, { label: "Conversion Rate", value: "28.4%" }], panels: ["Pending Follow-ups", "Deals Closing", "Pipeline Momentum"] },
  MANAGER: { title: "Business Operations", description: "A portfolio-level view of commercial performance, capacity and delivery risk.", stats: [{ label: "Revenue", value: "$8.42M", detail: "+12.8% YoY" }, { label: "Pipeline", value: "$31.6M" }, { label: "GPU Utilization", value: "71%" }, { label: "Open Requests", value: "46" }], panels: ["Revenue Trend", "Lead Funnel", "Regional Demand"] },
  ADMIN: { title: "System Administration", description: "Identity, platform health, audit and configuration in one controlled workspace.", stats: [{ label: "Users", value: "2,481", detail: "+84 this month" }, { label: "GPU Clusters", value: "128" }, { label: "Transactions", value: "14.2K" }, { label: "API Status", value: "ONLINE" }], panels: ["System Health", "Authentication", "Service Status"] },
} as const;

export function DashboardView({ role }: { role: keyof typeof content }) {
  const data = content[role];
  return <WorkspacePage eyebrow={`${role} / Overview`} title={data.title} description={data.description} stats={[...data.stats]}><section className="grid gap-4 lg:grid-cols-3">{data.panels.map((panel, index) => <article key={panel} className="min-h-[220px] rounded-[28px] border border-line bg-surface p-6 backdrop-blur-card"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{panel}</h2><span className="text-[10px] uppercase tracking-wider text-ink-dim">Live contract</span></div><div className="mt-8 flex h-24 items-end gap-2" aria-label={`${panel} sample visualization`}>{[38, 62, 48, 78, 69, 92, 75].map((height, bar) => <span key={bar} className="flex-1 rounded-t bg-accent/20" style={{ height: `${height - index * 3}%` }} />)}</div><p className="mt-5 text-xs leading-5 text-ink-dim">Visualization placeholder. Values will come from the reporting API; no financial or operational calculation is performed client-side.</p></article>)}</section></WorkspacePage>;
}

export function SimpleView({ eyebrow, title, description, sections }: { eyebrow: string; title: string; description: string; sections: string[] }) {
  return <WorkspacePage eyebrow={eyebrow} title={title} description={description}><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{sections.map((section) => <article key={section} className="rounded-[24px] border border-line bg-surface p-6"><h2 className="text-base font-semibold text-ink">{section}</h2><p className="mt-2 text-xs leading-5 text-ink-dim">API-ready section with loading, empty and error handling supplied by shared data components when connected.</p></article>)}</section></WorkspacePage>;
}

export function CustomerOverviewExtras() {
  const shortcuts = [["Rent GPU", "/gpu-renting"], ["Buy GPU", "/buy-gpu"], ["Assessment", "/assessment"], ["Investment", "/investment"], ["Infrastructure", "/infrastructure"], ["Hyperscale", "/hyperscale"]];
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shortcuts.map(([label, href]) => <Link key={href!} href={href!} className="rounded-2xl border border-line bg-surface p-5 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent">{label}<span className="float-right">↗</span></Link>)}</section>;
}
