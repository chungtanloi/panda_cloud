"use client";

import { useState } from "react";
import Link from "next/link";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, type TableColumn } from "@/components/shared/DataTable";
import { apiConfig } from "@/services/config";

/**
 * Technical / Assessments — ROLE_PERMISSION_MATRIX § 5.2:
 * "Xem danh sách DD assessments; tạo assessment cho Won-track deal".
 *
 * ⚠ No `WorkspaceResourceKind` entry / backend endpoint exists for DD
 * assessments (models/workspace.ts's server-driven table is scoped to the ten
 * kinds already listed there, and this task's edit list does not include that
 * file). This screen is therefore a local, statically-labelled placeholder —
 * same "Sample data" convention as `ResourcePage` — rather than a real fetch.
 * Swap `SAMPLE_ROWS` for a real list call once a DD assessments endpoint and
 * `WorkspaceResourceKind` entry exist.
 */

interface AssessmentRow {
  id: string;
  deal: string;
  status: "In Progress" | "Pending Review" | "Completed" | "Cancelled";
  items: string;
  completion: string;
}

const SAMPLE_ROWS: AssessmentRow[] = [
  { id: "dd-1042", deal: "Helios IDC — Phase 2", status: "In Progress", items: "68", completion: "54%" },
  { id: "dd-1039", deal: "Northbridge Dedicated Line", status: "Pending Review", items: "12", completion: "92%" },
  { id: "dd-1031", deal: "Aurora Compute — Won", status: "Completed", items: "68", completion: "100%" },
];

const COLUMNS: TableColumn<AssessmentRow>[] = [
  { key: "id", label: "Assessment", render: (row) => <Link href={`/technical/assessments/${row.id}`} className="text-accent hover:underline">{row.id}</Link> },
  { key: "deal", label: "Deal", render: (row) => row.deal },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
  { key: "items", label: "DD Items", render: (row) => row.items },
  { key: "completion", label: "Completion", render: (row) => row.completion },
];

export default function Page() {
  const [creating, setCreating] = useState(false);
  const [dealRef, setDealRef] = useState("");

  return (
    <WorkspacePage
      eyebrow="Technical / DD"
      title="Assessments"
      description="Every technical due-diligence assessment, from creation on a Won-track deal through review."
    >
      {apiConfig.adapter === "mock" ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            Sample data
          </span>
          <span className="text-xs text-ink-dim">
            Static placeholder — no DD assessments endpoint exists in the backend contract yet.
          </span>
        </div>
      ) : null}

      <div className="mb-4 flex justify-end">
        {/*
          NEEDS CLARIFICATION: the matrix does not say which of the four dd:*
          permissions gates *creating* an assessment (only that dd:view,
          dd:respond, dd:review and dd:evidence:upload exist). Gating on
          dd:respond is a reasonable reading — starting an assessment is the
          entry point into responding to it — but this is an interpretation,
          not a stated grant. Revisit if FE/BE owners define an explicit
          create permission (e.g. a future dd:create).
        */}
        <PermissionGate permission="dd:respond">
          <button
            type="button"
            onClick={() => setCreating((value) => !value)}
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg"
          >
            {creating ? "Cancel" : "New Assessment"}
          </button>
        </PermissionGate>
      </div>

      {creating ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            // TODO: NEEDS CLARIFICATION — no "create DD assessment" endpoint
            // is defined in the backend contract yet. Wire this once it
            // exists; do not fabricate a success path in the meantime.
            setCreating(false);
            setDealRef("");
          }}
          className="mb-6 rounded-[24px] border border-line bg-surface p-6"
        >
          <h2 className="text-sm font-semibold">New DD Assessment</h2>
          <p className="mt-2 text-xs leading-5 text-ink-dim">
            Assessments may only be created for Won-track deals. Deal lookup binds to the
            Sales/Manager pipeline API when available — for now, enter the deal reference directly.
          </p>
          <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-ink-dim">
            Deal reference
            <input
              required
              value={dealRef}
              onChange={(event) => setDealRef(event.target.value)}
              placeholder="e.g. deal-2044"
              className="mt-2 w-full max-w-sm rounded-full border border-line bg-deep px-4 py-2.5 text-sm font-normal normal-case text-ink placeholder:text-ink-search"
            />
          </label>
          <button
            type="submit"
            className="mt-5 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg"
          >
            Create Assessment
          </button>
        </form>
      ) : null}

      <DataTable rows={SAMPLE_ROWS} columns={COLUMNS} getRowKey={(row) => row.id} searchPlaceholder="Search assessments..." />
    </WorkspacePage>
  );
}
