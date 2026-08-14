"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { hasPermission } from "@/config/access";
import { useAuth } from "@/controllers/AuthContext";

/**
 * Technical / Assessment detail — ROLE_PERMISSION_MATRIX § 5.3 "Process DD
 * Items": typed response, status, comment, mark reviewed.
 *
 * ⚠ § 5.5 "Read-only cross-role access": Sales/Legal/Compliance are said to
 * have read access to DD responses, and the doc explicitly asks for
 * `canRead`/`canWrite` at the *field* level rather than one boolean
 * permission — but "chi tiết field-level read/write matrix chưa được cung
 * cấp". No field-level matrix is invented here. What this page does instead:
 *   - `dd:view` (granted via workspace access) gates seeing the page at all.
 *   - `dd:respond` gates editing the response/status/comment inputs.
 *   - `dd:review` gates the "Mark Reviewed" action.
 * That is a role-level, not field-level, distinction — see the TODO below.
 */

type ItemStatus = "Not Started" | "In Progress" | "Passed" | "Failed" | "Critical Failure";

interface DdItem {
  id: string;
  category: "IDC" | "Dedicated Line";
  question: string;
  response: string;
  status: ItemStatus;
  comment: string;
  reviewed: boolean;
}

// ROLE_PERMISSION_MATRIX § 5.4: 68 DD items total (56 IDC + 12 Dedicated
// Line). Only a few are shown here as sample placeholders — the full item
// bank has no backend endpoint yet.
const SAMPLE_ITEMS: DdItem[] = [
  { id: "dd-item-004", category: "IDC", question: "Facility has N+1 power redundancy documented?", response: "", status: "In Progress", comment: "", reviewed: false },
  { id: "dd-item-017", category: "IDC", question: "Cooling capacity meets rated GPU density?", response: "", status: "Not Started", comment: "", reviewed: false },
  { id: "dd-item-052", category: "Dedicated Line", question: "Diverse fiber path confirmed by carrier?", response: "", status: "Critical Failure", comment: "", reviewed: false },
];

export default function Page({ params }: { params: { id: string } }) {
  const { profile } = useAuth();
  const canRespond = hasPermission(profile, "dd:respond");
  const canReview = hasPermission(profile, "dd:review");

  const [items, setItems] = useState<DdItem[]>(SAMPLE_ITEMS);

  function updateItem(id: string, patch: Partial<DdItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <WorkspacePage
      eyebrow="Technical / DD"
      title={`Assessment ${params.id}`}
      description="Enter a typed response, status and comment for each DD item, then mark it reviewed."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
          Sample data
        </span>
        <Link
          href={`/technical/assessments/${params.id}/evidence`}
          className="rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink-dim hover:border-accent hover:text-accent"
        >
          Evidence →
        </Link>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-[24px] border border-line bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-dim">{item.category} · {item.id}</p>
                <h2 className="mt-1 text-sm font-semibold">{item.question}</h2>
              </div>
              <StatusBadge status={item.reviewed ? "Reviewed" : item.status} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-dim">
                Response
                <textarea
                  disabled={!canRespond}
                  value={item.response}
                  onChange={(event) => updateItem(item.id, { response: event.target.value })}
                  rows={3}
                  placeholder={canRespond ? "Typed response…" : "No dd:respond permission"}
                  className="mt-2 w-full rounded-2xl border border-line bg-deep px-4 py-3 text-sm font-normal normal-case text-ink placeholder:text-ink-search disabled:opacity-50"
                />
              </label>

              <div className="space-y-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  Status
                  <select
                    disabled={!canRespond}
                    value={item.status}
                    onChange={(event) => updateItem(item.id, { status: event.target.value as ItemStatus })}
                    className="mt-2 w-full rounded-full border border-line bg-deep px-4 py-2.5 text-sm font-normal normal-case text-ink disabled:opacity-50"
                  >
                    {(["Not Started", "In Progress", "Passed", "Failed", "Critical Failure"] as const).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-dim">
                  Comment
                  <input
                    disabled={!canRespond}
                    value={item.comment}
                    onChange={(event) => updateItem(item.id, { comment: event.target.value })}
                    placeholder={canRespond ? "Add a comment…" : "No dd:respond permission"}
                    className="mt-2 w-full rounded-full border border-line bg-deep px-4 py-2.5 text-sm font-normal normal-case text-ink placeholder:text-ink-search disabled:opacity-50"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <PermissionGate permission="dd:review">
                <button
                  type="button"
                  disabled={item.reviewed}
                  onClick={() => updateItem(item.id, { reviewed: true })}
                  className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50"
                >
                  {item.reviewed ? "Reviewed" : "Mark Reviewed"}
                </button>
              </PermissionGate>
            </div>
          </article>
        ))}
      </div>

      {/*
        TODO: NEEDS CLARIFICATION — field-level read/write matrix (§ 5.5).
        This page currently makes response/status/comment editable for any
        identity with dd:respond, uniformly across every item and field. The
        source doc asks for per-field canRead/canWrite instead (e.g. a field
        Sales can read but not write, or a field only visible after review).
        Do not narrow individual fields here until that matrix is confirmed —
        guessing per-field visibility would fail closed on some legitimate
        reads and fail open on others.
      */}
    </WorkspacePage>
  );
}
