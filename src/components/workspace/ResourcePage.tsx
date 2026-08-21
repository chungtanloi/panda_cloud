"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DataTable, type TableColumn } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { useAsync } from "@/controllers/useAsync";
import { apiConfig } from "@/services/config";
import { api } from "@/services/api";
import type { ResourceColumn, ResourceRow, WorkspaceResourceKind } from "@/models/workspace";
import { WorkspacePage } from "./WorkspacePage";

/**
 * Generic list screen for the workspace resources.
 *
 * Both the rows **and the column definitions** come from
 * `api.workspace.getResource(kind)` — see models/workspace.ts for why the table
 * is server-driven. Nothing about a resource is hard-coded here, so adding a
 * column is a backend change.
 */

const META: Record<WorkspaceResourceKind, { eyebrow: string; title: string; description: string }> = {
  projects: { eyebrow: "Customer / Projects", title: "Projects", description: "Track every Panda Cloud request from draft through delivery." },
  clusters: { eyebrow: "Customer / Compute", title: "GPU Clusters", description: "Capacity, utilization, deployment status and backend-provided costs." },
  transactions: { eyebrow: "Customer / Finance", title: "Transactions", description: "Search and review wallet, token and infrastructure activity." },
  leads: { eyebrow: "Sales / CRM", title: "Leads", description: "Qualify inbound demand, assign ownership and keep follow-ups moving." },
  quotes: { eyebrow: "Sales / Commercial", title: "Quotes", description: "Manage proposal lifecycle without calculating commercial terms in the browser." },
  tasks: { eyebrow: "Sales / Follow-up", title: "Tasks", description: "Today, upcoming and overdue commitments across the pipeline." },
  customers: { eyebrow: "Sales / Accounts", title: "Customers", description: "Every account with an open or completed request." },
  team: { eyebrow: "Manager / People", title: "Team Performance", description: "Compare workload, pipeline and conversion across the sales team." },
  approvals: { eyebrow: "Manager / Governance", title: "Approvals", description: "Review actions exposed by backend permission and policy responses." },
  users: { eyebrow: "Admin / Identity", title: "User Management", description: "Manage account lifecycle while backend authorization remains authoritative." },
  audit: { eyebrow: "Admin / Governance", title: "Audit Logs", description: "Immutable system activity supplied by the backend audit service." },
};

export function ResourcePage({ kind }: { kind: WorkspaceResourceKind }) {
  const meta = META[kind];
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<string[]>([]);

  const fetchResource = useCallback((query: { search?: string; cursor?: string }) => api.workspace.getResource(kind, query), [kind]);
  const { state, run } = useAsync(fetchResource);
  useEffect(() => { void run({ ...(search ? { search } : {}), ...(cursor ? { cursor } : {}) }); }, [cursor, run, search]);

  function resetSearch(value: string) {
    setSearch(value);
    setCursor(undefined);
    setHistory([]);
  }

  function nextPage() {
    if (state.status !== "success" || !state.data.continueCursor) return;
    setHistory((current) => [...current, cursor ?? ""]);
    setCursor(state.data.continueCursor);
  }

  function previousPage() {
    const previous = history[history.length - 1];
    if (previous === undefined) return;
    setHistory((current) => current.slice(0, -1));
    setCursor(previous || undefined);
  }

  return (
    <WorkspacePage {...meta}>
      {/* Only claim the data is illustrative when it actually is. Once the
          adapter is `http`, this badge must not appear — a real table labelled
          "mock" would be worse than no label at all. */}
      {apiConfig.adapter === "mock" ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            Sample data
          </span>
          <span className="text-xs text-ink-dim">
            Served by the mock adapter — set NEXT_PUBLIC_API_ADAPTER=http for live records.
          </span>
        </div>
      ) : null}

      {state.status === "error" ? (
        <ErrorState error={state.error} onRetry={() => void run({ ...(search ? { search } : {}), ...(cursor ? { cursor } : {}) })} />
      ) : state.status === "success" ? (
        state.data.rows.length === 0 ? (
          <EmptyTable title={meta.title} />
        ) : (
          <DataTable
            rows={state.data.rows}
            columns={state.data.columns.map(toTableColumn)}
            getRowKey={(row) => row.id}
            serverSide
            search={search}
            onSearch={resetSearch}
            total={state.data.total}
            hasPreviousPage={history.length > 0}
            hasNextPage={state.data.isDone === false || Boolean(state.data.continueCursor)}
            onPreviousPage={previousPage}
            onNextPage={nextPage}
          />
        )
      ) : (
        <TableSkeleton />
      )}
    </WorkspacePage>
  );
}

/** Maps a server column definition onto the table's render contract. */
function toTableColumn(column: ResourceColumn): TableColumn<ResourceRow> {
  return {
    key: column.key,
    label: column.label,
    render: (row) => {
      const value = row[column.key];
      if (value === undefined || value === "") return <span className="text-ink-faint">—</span>;

      if (column.type === "status") return <StatusBadge status={String(value)} />;

      if (column.type === "link" && column.href) {
        return (
          <Link
            href={column.href.replace("{id}", encodeURIComponent(row.id))}
            className="text-accent hover:underline"
          >
            {String(value)}
          </Link>
        );
      }

      return String(value);
    },
  };
}

function EmptyTable({ title }: { title: string }) {
  return (
    <div className="rounded-card border border-line-hair bg-card p-10 text-center">
      <p className="font-sans text-[16px] font-medium text-white">Nothing here yet</p>
      <p className="pt-2 font-sans text-[13px] text-ink-dim">
        {title} will appear as soon as there are records to show.
      </p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <>
      <span className="sr-only">
        <LoadingState label="Loading records" />
      </span>
      <div className="flex flex-col gap-2" aria-hidden>
        <Skeleton className="h-[42px] w-full" />
        <Skeleton className="h-[52px] w-full" />
        <Skeleton className="h-[52px] w-full" />
        <Skeleton className="h-[52px] w-full" />
      </div>
    </>
  );
}
