"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { useAsync } from "@/controllers/useAsync";
import { api } from "@/services/api";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { AdminOrganizationSummary, OrgStatus, OrgType } from "@/models/admin";
import { useAuth } from "@/controllers/AuthContext";
import { isAdmin } from "@/models/auth";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blocked", value: "blocked" },
  { label: "Prospect", value: "prospect" },
];

const TYPE_OPTIONS: { label: string; value: string }[] = [
  { label: "All types", value: "" },
  { label: "Cloud Panda", value: "cloud_panda" },
  { label: "Customer", value: "customer" },
  { label: "Partner", value: "partner" },
  { label: "Vendor", value: "vendor" },
  { label: "Investor", value: "investor" },
  { label: "Other", value: "other" },
];

export default function OrganizationsPage() {
  const { profile } = useAuth();
  const admin = isAdmin(profile);
  const [status, setStatus] = useState("");
  const [orgType, setOrgType] = useState("");
  const [search, setSearch] = useState("");

  const fetchOrgs = useCallback(() =>
    api.admin.organizations({
      ...(status ? { status: status as OrgStatus } : {}),
      ...(orgType ? { organizationType: orgType as OrgType } : {}),
      ...(search ? { q: search } : {}),
      limit: 50,
    }), [status, orgType, search]);

  const { state, run } = useAsync(fetchOrgs, { immediate: [] });

  const items = state.status === "success" ? (state.data as { items: AdminOrganizationSummary[] }).items ?? [] : [];

  return (
    <WorkspacePage
      eyebrow="Admin / Organizations"
      title="Organizations"
      description="Manage and review all organizations."
    >
      <div className="mb-6">
        {admin && <Link href="/admin/organizations/new"><Button>Create Organization</Button></Link>}
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input label="Search" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
        <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Select label="Type" options={TYPE_OPTIONS} value={orgType} onChange={(e) => setOrgType(e.target.value)} />
        <Button variant="secondary" onClick={() => void run()}>Refresh</Button>
      </div>

      {state.status === "idle" || state.status === "loading" ? <LoadingState label="Loading organizations" /> : null}
      {state.status === "error" ? <ErrorState error={state.error} onRetry={() => void run()} /> : null}

      {state.status === "success" && (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-dim">
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {items.map((org) => (
                <tr key={org.organizationId} className="border-b border-line/60">
                  <td className="p-4">
                    <Link href={`/admin/organizations/${encodeURIComponent(org.organizationId)}`} className="font-medium text-accent hover:underline">
                      {org.displayName || org.legalName}
                    </Link>
                    {org.displayName && org.legalName && org.displayName !== org.legalName && (
                      <div className="text-xs text-ink-dim">{org.legalName}</div>
                    )}
                  </td>
                  <td className="p-4"><StatusBadge status={org.organizationType} /></td>
                  <td className="p-4"><StatusBadge status={org.status} /></td>
                  <td className="p-4">{new Date(org.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <p className="p-8 text-center text-sm text-ink-dim">No organizations found.</p>}
        </div>
      )}
    </WorkspacePage>
  );
}
