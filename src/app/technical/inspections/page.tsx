"use client";

import React from "react";
import Link from "next/link";
import { useTechnicalQueue } from "@/controllers/useTechnicalQueue";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";
import { InspectionStatusPill } from "@/components/inspection/InspectionStatusPill";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { Card } from "@/components/ui/Card";
import type { InspectionStatus } from "@/models";

export default function TechnicalQueuePage() {
  const {
    loading,
    error,
    items,
    statusFilter,
    setStatusFilter,
    slaFilter,
    setSlaFilter,
  } = useTechnicalQueue();

  const activeReviews = items.filter((i) => i.status === "in_review" || i.status === "submitted").length;
  const criticalCount = items.reduce((acc, i) => acc + (i.criticalIssuesCount > 0 ? 1 : 0), 0);
  const slaBreached = items.filter((i) => i.isSlaBreached).length;

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      <SimulationDisclosure />

      <WorkspacePage
        eyebrow="TECHNICAL WORKSPACE / SITE INSPECTION"
        title="Site Inspection Review Queue"
        description="Authorized Senior PE Workbench for validating AI provisional evaluations and issuing final readiness reports within the 1-business-day turnaround SLA."
        stats={[
          { label: "Active in Queue", value: String(activeReviews), detail: "Pending engineer audit" },
          { label: "Critical Blockers", value: String(criticalCount), detail: "Requires immediate attention" },
          { label: "SLA Breached", value: String(slaBreached), detail: "Past 24h target" },
          { label: "Reviewed Total", value: String(items.length), detail: "Across all US campuses" },
        ]}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[14px] text-ink-dim">Filter Queue:</span>
          </div>

          <Link
            href="/admin/inspection-profiles"
            className="px-4 py-2 rounded-field bg-surface hover:bg-card border border-line-card text-xs font-sans text-accent transition"
          >
            Manage Standards Profiles &rarr;
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-field bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-sans">
            {error}
          </div>
        )}

        {/* Filter Bar */}
        <Card className="mb-6 p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
          <div className="flex items-center gap-3">
            <label htmlFor="queue-status-filter" className="font-mono text-ink-dim uppercase text-[11px]">
              Status:
            </label>
            <select
              id="queue-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InspectionStatus | "all")}
              className="px-3 py-1.5 rounded-field bg-deep border border-line-strong text-ink font-mono focus:outline-none focus:border-accent"
            >
              <option value="all">All Statuses</option>
              <option value="in_review">In Review</option>
              <option value="submitted">Submitted</option>
              <option value="final">Final</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="queue-sla-filter" className="font-mono text-ink-dim uppercase text-[11px]">
              SLA Priority:
            </label>
            <select
              id="queue-sla-filter"
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value as "all" | "approaching" | "breached")}
              className="px-3 py-1.5 rounded-field bg-deep border border-line-strong text-ink font-mono focus:outline-none focus:border-accent"
            >
              <option value="all">All Records</option>
              <option value="breached">SLA Breached Only</option>
            </select>
          </div>
        </Card>

        {/* Queue Table */}
        <div className="rounded-card border border-line-card bg-surface overflow-hidden shadow-xl backdrop-blur-card">
          {loading ? (
            <div className="p-12 text-center text-xs text-ink-dim font-mono animate-pulse">
              Loading queue items...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs text-ink-dim">
              No inspections matching selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-line bg-card/60 font-mono text-ink-dim uppercase text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Facility / Organization</th>
                    <th className="py-3.5 px-4 font-semibold">Provisional Score</th>
                    <th className="py-3.5 px-4 font-semibold">Risks</th>
                    <th className="py-3.5 px-4 font-semibold">SLA Target</th>
                    <th className="py-3.5 px-4 font-semibold">Assigned Reviewer</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-card/40 transition">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-ink text-sm block">{item.siteName}</span>
                        <span className="text-[11px] text-ink-dim font-mono">{item.organizationName}</span>
                      </td>

                      <td className="py-4 px-4">
                        <InspectionStatusPill status={item.provisionalVerdict} size="sm" />
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px]">
                        {item.criticalIssuesCount > 0 ? (
                          <span className="text-rose-400 font-semibold">{item.criticalIssuesCount} Critical Fail</span>
                        ) : item.notVerifiedCount > 0 ? (
                          <span className="text-amber-400">{item.notVerifiedCount} Not Verified</span>
                        ) : (
                          <span className="text-emerald-400">0 Blockers</span>
                        )}
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px]">
                        <span className={item.isSlaBreached ? "text-rose-400 font-bold" : "text-ink-dim"}>
                          {item.isSlaBreached ? "BREACHED" : "On Track"}
                        </span>
                        <span className="block text-[10px] text-ink-dim">
                          Target: {new Date(item.slaTargetAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px] text-ink-dim">
                        {item.assignedReviewerName ? (
                          <span className="text-accent font-medium">{item.assignedReviewerName}</span>
                        ) : (
                          <span className="text-ink-dim italic">Unclaimed</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/technical/inspections/${item.id}`}
                          className="px-3.5 py-1.5 rounded-field bg-accent text-accent-fg font-semibold hover:opacity-90 transition text-[11px] font-mono uppercase tracking-wider"
                        >
                          Review &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </WorkspacePage>
    </div>
  );
}
