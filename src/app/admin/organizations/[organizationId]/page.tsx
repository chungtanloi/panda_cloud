"use client";

import React, { use, useState, useCallback } from "react";
import { useAsync } from "@/controllers/useAsync";
import { useAuth } from "@/controllers/AuthContext";
import { api } from "@/services/api";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import Link from "next/link";
import type { AdminOrganizationDetail, AdminMembership } from "@/models/admin";
import type { MembershipRole } from "@/models/auth";
import { isSuperAdmin, isAdmin } from "@/models/auth";

const ALL_ROLES: MembershipRole[] = ["sales", "compliance", "legal", "technical", "manager", "admin", "super_admin"];
const PRIVILEGED_ROLES: MembershipRole[] = ["admin", "super_admin"];

function isPrivilegedRole(role: MembershipRole): boolean {
  return PRIVILEGED_ROLES.includes(role);
}

export default function OrganizationDetailPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = use(params);
  const { profile } = useAuth();
  const superAdmin = isSuperAdmin(profile);
  const admin = isAdmin(profile);
  const allowedRoles = superAdmin ? ALL_ROLES : ALL_ROLES.filter((r) => !isPrivilegedRole(r));

  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<MembershipRole>("sales");
  const [addReason, setAddReason] = useState("");

  const [editing, setEditing] = useState<AdminMembership | null>(null);
  const [editMode, setEditMode] = useState<"role" | "status" | null>(null);
  const [editRole, setEditRole] = useState<MembershipRole>("sales");
  const [editStatus, setEditStatus] = useState("");
  const [editReason, setEditReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchOrg = useCallback(() => api.admin.organization(organizationId), [organizationId]);
  const fetchMembers = useCallback(() => api.admin.memberships(organizationId, { limit: 100 }), [organizationId]);

  const orgAsync = useAsync(fetchOrg, { immediate: [] });
  const membersAsync = useAsync(fetchMembers, { immediate: [] });

  const refreshAll = useCallback(() => {
    void orgAsync.run();
    void membersAsync.run();
  }, [orgAsync, membersAsync]);

  const handleConflict = useCallback((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "CONFLICT") {
      refreshAll();
    }
  }, [refreshAll]);

  const addAsync = useAsync(
    useCallback(
      (userId: string, role: MembershipRole, reason: string) =>
        api.admin.createMembership(organizationId, { userId, role, reason }).then((result) => {
          refreshAll();
          setAddUserId("");
          setAddRole("sales");
          setAddReason("");
          return result;
        }),
      [organizationId, refreshAll],
    ),
  );

  const updateAsync = useAsync(
    useCallback(
      (membershipId: string, body: { role?: MembershipRole; status?: string; reason: string; expectedRevision: number }) =>
        api.admin.updateMembership(organizationId, membershipId, body).then((result) => {
          refreshAll();
          closeEdit();
          return result;
        }).catch((error) => {
          handleConflict(error);
          throw error;
        }),
      [organizationId, refreshAll, handleConflict],
    ),
  );

  const org = orgAsync.data as AdminOrganizationDetail | undefined;
  const members = (membersAsync.data as { items?: AdminMembership[] } | undefined)?.items ?? [];

  function closeEdit() {
    setEditing(null);
    setEditMode(null);
    setEditReason("");
    setConfirmOpen(false);
  }

  function openRoleEdit(m: AdminMembership) {
    setEditing(m);
    setEditMode("role");
    setEditRole(m.role);
    setEditReason("");
  }

  function openStatusEdit(m: AdminMembership, targetStatus: string) {
    setEditing(m);
    setEditMode("status");
    setEditStatus(targetStatus);
    setEditReason("");
  }

  function submitRoleChange() {
    if (!editing || !editReason) return;
    void updateAsync.run(editing.membershipId, {
      role: editRole,
      reason: editReason,
      expectedRevision: editing.revision,
    });
  }

  function submitStatusChange() {
    if (!editing || !editReason) return;
    setConfirmOpen(true);
  }

  function confirmStatusChange() {
    if (!editing || !editReason) return;
    void updateAsync.run(editing.membershipId, {
      status: editStatus,
      reason: editReason,
      expectedRevision: editing.revision,
    });
  }

  function submitAdd() {
    if (!addUserId || !addReason) return;
    void addAsync.run(addUserId, addRole, addReason);
  }

  const statusLabel = editStatus === "removed" ? "Remove" : editStatus === "active" ? "Reactivate" : "Suspend";

  return (
    <WorkspacePage
      eyebrow="Admin / Organizations"
      title={org?.displayName ?? org?.legalName ?? "Organization"}
      description="Organization detail and membership management."
    >
      {orgAsync.isLoading || (membersAsync.isLoading && !org) ? (
        <LoadingState label="Loading organization" />
      ) : orgAsync.error && !org ? (
        <ErrorState error={orgAsync.error} onRetry={refreshAll} />
      ) : org ? (
        <>
          <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ink">{org.displayName}</h2>
                {org.displayName !== org.legalName && (
                  <p className="mt-1 text-sm text-ink-dim">{org.legalName}</p>
                )}
              </div>
              <Link href="/admin/organizations">
                <Button variant="ghost" size="md">Back to list</Button>
              </Link>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Organization Type" value={org.organizationType} />
              <Detail label="Status" value={org.status} />
              <Detail label="Registration Number" value={org.registrationNumber ?? "—"} />
              <Detail label="Country Code" value={org.countryCode ?? "—"} />
              <Detail label="Website" value={org.websiteUrl ?? "—"} />
              <Detail label="Memberships" value={String(org.membershipCount)} />
              <Detail label="Archived At" value={org.archivedAt ? new Date(org.archivedAt).toLocaleString() : "—"} />
              <Detail label="Revision" value={String(org.revision)} />
              <Detail label="Updated" value={new Date(org.updatedAt).toLocaleString()} />
            </dl>
          </div>

          {admin && (
          <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
            <h3 className="text-lg font-semibold text-ink">Add Membership</h3>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Input label="User ID" value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className="w-60" />
              <Select label="Role" options={allowedRoles.map((r) => ({ label: r, value: r }))} value={addRole} onChange={(e) => setAddRole(e.target.value as MembershipRole)} />
              <Input label="Reason" value={addReason} onChange={(e) => setAddReason(e.target.value)} className="w-60" />
              <Button onClick={submitAdd} loading={addAsync.isLoading} disabled={!addUserId || !addReason}>Add</Button>
            </div>
            {addAsync.error && <p className="mt-2 text-xs text-red-400">{addAsync.error.message}</p>}
          </div>
          )}

          <div className="rounded-2xl border border-line">
            <div className="border-b border-line p-4">
              <h3 className="text-lg font-semibold text-ink">Memberships ({members.length})</h3>
            </div>
            {membersAsync.isLoading ? (
              <LoadingState label="Loading memberships" />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-ink-dim">
                      <th className="p-4">User</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Updated</th>
                      <th className="p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.membershipId} className="border-b border-line/60">
                        <td className="p-4">
                          <div className="font-medium text-ink">{m.user.fullName || m.user.email}</div>
                          {m.user.fullName && <div className="text-xs text-ink-dim">{m.user.email}</div>}
                        </td>
                        <td className="p-4"><StatusBadge status={m.role} /></td>
                        <td className="p-4"><StatusBadge status={m.status} /></td>
                        <td className="p-4">{new Date(m.updatedAt).toLocaleDateString()}</td>
                        <td className="p-4">
                          {admin && (superAdmin || !isPrivilegedRole(m.role)) ? (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="md" onClick={() => openRoleEdit(m)}>Change Role</Button>
                              {m.status === "active" && (
                                <>
                                  <Button variant="ghost" size="md" onClick={() => openStatusEdit(m, "suspended")}>Suspend</Button>
                                  <Button variant="ghost" size="md" onClick={() => openStatusEdit(m, "removed")}>Remove</Button>
                                </>
                              )}
                              {m.status === "suspended" && (
                                <>
                                  <Button variant="ghost" size="md" onClick={() => openStatusEdit(m, "active")}>Reactivate</Button>
                                  <Button variant="ghost" size="md" onClick={() => openStatusEdit(m, "removed")}>Remove</Button>
                                </>
                              )}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-sm text-ink-dim">No memberships.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}

      {editing && editMode === "role" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" role="presentation" onMouseDown={closeEdit}>
          <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-ink">Change Role</h2>
            <p className="mt-2 text-sm text-ink-dim">{editing.user.fullName || editing.user.email}</p>
            <div className="mt-4">
              <Select label="New Role" options={allowedRoles.map((r) => ({ label: r, value: r }))} value={editRole} onChange={(e) => setEditRole(e.target.value as MembershipRole)} />
              <Input label="Reason" value={editReason} onChange={(e) => setEditReason(e.target.value)} className="mt-3" />
            </div>
            {updateAsync.error && <p className="mt-2 text-xs text-red-400">{updateAsync.error.message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeEdit} disabled={updateAsync.isLoading} className="rounded-full border border-line-strong px-4 py-2 text-xs text-ink-dim disabled:opacity-50">Cancel</button>
              <button type="button" onClick={submitRoleChange} disabled={updateAsync.isLoading || !editReason} className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-fg disabled:opacity-50">{updateAsync.isLoading ? "Working…" : "Save"}</button>
            </div>
          </section>
        </div>
      )}

      {editing && editMode === "status" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" role="presentation" onMouseDown={closeEdit}>
          <section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-ink">{statusLabel} Member</h2>
            <p className="mt-2 text-sm text-ink-dim">{editing.user.fullName || editing.user.email}</p>
            <div className="mt-4">
              <Input label="Reason" value={editReason} onChange={(e) => setEditReason(e.target.value)} />
            </div>
            {updateAsync.error && <p className="mt-2 text-xs text-red-400">{updateAsync.error.message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeEdit} disabled={updateAsync.isLoading} className="rounded-full border border-line-strong px-4 py-2 text-xs text-ink-dim disabled:opacity-50">Cancel</button>
              <button type="button" onClick={submitStatusChange} disabled={updateAsync.isLoading || !editReason} className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-fg disabled:opacity-50">{statusLabel}</button>
            </div>
          </section>
        </div>
      )}

      {confirmOpen && editing && (
        <ConfirmDialog
          title={`Confirm ${statusLabel}`}
          message={`Are you sure you want to ${statusLabel.toLowerCase()} ${editing.user.fullName || editing.user.email}?`}
          confirmLabel={statusLabel}
          busy={updateAsync.isLoading}
          onConfirm={confirmStatusChange}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </WorkspacePage>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-dim">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
