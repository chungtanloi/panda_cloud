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
import type { AdminMembership, AdminOrganizationDetail, AdminUser, AdminUserUpdateRequest } from "@/models/admin";
import { isAdmin, isSuperAdmin, assignableRoles, canEditMembership, type MembershipRole, type AuthProfile } from "@/models/auth";

type Transition = { from: string; to: AdminUserUpdateRequest["status"] };

const TRANSITIONS: Transition[] = [
  { from: "active", to: "suspended" },
  { from: "active", to: "disabled" },
  { from: "suspended", to: "active" },
  { from: "disabled", to: "active" },
  { from: "invited", to: "active" },
];

const STATUS_OPTIONS = [
  { label: "active", value: "active" },
  { label: "suspended", value: "suspended" },
  { label: "disabled", value: "disabled" },
];

type UserDetailParams = Promise<{ userId: string }> | { userId: string };

export default function UserDetailPage({ params }: { params: UserDetailParams }) {
  // Next 15 supplies a Promise, while the current dev runtime can still
  // provide the resolved object. Do not pass a plain object to React use().
  const resolvedParams = isPromiseLike(params) ? use(params) : params;
  const { userId } = resolvedParams;
  const { profile } = useAuth();
  const admin = isAdmin(profile);

  const [targetStatus, setTargetStatus] = useState<AdminUserUpdateRequest["status"]>("active");
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchUser = useCallback(() => api.admin.user(userId), [userId]);

  const userAsync = useAsync(fetchUser, { immediate: [] });

  const updateAsync = useAsync(
    useCallback(
      (status: AdminUserUpdateRequest["status"], reason: string, expectedRevision: number) =>
        api.admin.updateUser(userId, { status, reason, expectedRevision }).then((result) => {
          userAsync.run();
          closeForm();
          return result;
        }).catch((error) => {
          if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "CONFLICT") {
            userAsync.run();
          }
          throw error;
        }),
      [userId, userAsync],
    ),
  );

  const user = userAsync.data as AdminUser | undefined;

  const availableTransitions = TRANSITIONS.filter((t) => t.from === user?.status);

  function closeForm() {
    setReason("");
    setConfirmOpen(false);
  }

  function submitStatusChange() {
    if (!user || !reason) return;
    setConfirmOpen(true);
  }

  function confirmStatusChange() {
    if (!user || !reason) return;
    void updateAsync.run(targetStatus, reason, user.revision);
  }

  return (
    <WorkspacePage
      eyebrow="Admin / Users"
      title={user?.fullName || user?.email || "User"}
      description="User detail and membership management."
    >
      {userAsync.isLoading || (!user && userAsync.state.status === "loading") ? (
        <LoadingState label="Loading user" />
      ) : userAsync.error && !user ? (
        <ErrorState error={userAsync.error} onRetry={() => void userAsync.run()} />
      ) : user ? (
        <>
          <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ink">{user.fullName || user.email}</h2>
                {user.fullName && <p className="mt-1 text-sm text-ink-dim">{user.email}</p>}
              </div>
              <Link href="/admin/users">
                <Button variant="ghost" size="md">Back to list</Button>
              </Link>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Email" value={user.email} />
              <Detail label="Full Name" value={user.fullName || "—"} />
              <Detail label="User Type" value={user.userType} />
              <Detail label="Status" value={user.status} />
              <Detail label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"} />
              <Detail label="Updated" value={new Date(user.updatedAt).toLocaleString()} />
              <Detail label="Revision" value={String(user.revision)} />
            </dl>
          </div>

          {admin && availableTransitions.length > 0 && (
            <div className="mb-8 rounded-2xl border border-line bg-surface p-6">
              <h3 className="text-lg font-semibold text-ink">Change Status</h3>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <Select
                  label="Target Status"
                  options={availableTransitions.map((t) => ({ label: t.to, value: t.to }))}
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as AdminUserUpdateRequest["status"])}
                />
                <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="w-60" />
                <Button onClick={submitStatusChange} loading={updateAsync.isLoading} disabled={!reason || updateAsync.isLoading}>
                  Change Status
                </Button>
              </div>
              {updateAsync.error && <p className="mt-2 text-xs text-red-400">{updateAsync.error.message}</p>}
            </div>
          )}

          <div className="rounded-2xl border border-line">
            <div className="border-b border-line p-4">
              <h3 className="text-lg font-semibold text-ink">Memberships ({user.memberships.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-ink-dim">
                    <th className="p-4">Organization</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {user.memberships.map((m) => (
                    <tr key={`${m.membershipId ?? m.organizationId}-${m.role}`} className="border-b border-line/60">
                      <td className="p-4"><OrganizationLabel organizationId={m.organizationId} /></td>
                      <td className="p-4">{canEditMembership(profile, m) ? <MembershipRoleControl membership={m} profile={profile} /> : <StatusBadge status={m.role} />}</td>
                      <td className="p-4"><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                  {user.memberships.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-sm text-ink-dim">No memberships.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {confirmOpen && user && (
        <ConfirmDialog
          title={`Confirm status change to ${targetStatus}`}
          message={`Are you sure you want to change ${user.fullName || user.email} from ${user.status} to ${targetStatus}?`}
          confirmLabel="Change Status"
          busy={updateAsync.isLoading}
          onConfirm={confirmStatusChange}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </WorkspacePage>
  );
}

function isPromiseLike(value: UserDetailParams): value is Promise<{ userId: string }> {
  return typeof value === "object" && value !== null && "then" in value && typeof value.then === "function";
}

function MembershipRoleControl({ membership, profile }: { membership: AdminMembership; profile: AuthProfile | null }) {
  const [role, setRole] = useState<MembershipRole>(membership.role);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const changed = role !== membership.role;
  const options = assignableRoles(profile, membership.role);

  async function saveRole() {
    if (!changed || reason.trim().length < 3) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.admin.updateMembership(membership.organizationId, membership.membershipId, {
        role,
        reason: reason.trim(),
        expectedRevision: membership.revision,
      });
      setRole(updated.role);
      setReason("");
      setMessage("Role updated.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to update role.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-64">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={`Role for ${membership.organizationId}`}
          value={role}
          onChange={(event) => setRole(event.target.value as MembershipRole)}
          style={{ colorScheme: "dark" }}
          className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <option value={membership.role}>{membership.role}</option>
          {options.map((candidate) => (
            <option key={candidate} value={candidate}>{candidate}</option>
          ))}
        </select>
        {changed ? <button type="button" className="min-h-11 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg disabled:opacity-50" disabled={saving || reason.trim().length < 3} onClick={() => void saveRole()}>{saving ? "Saving…" : "Save"}</button> : null}
      </div>
      {changed ? <input aria-label={`Reason for ${membership.organizationId}`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason required" maxLength={500} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-xs text-ink" /> : null}
      {message ? <p role="status" className="mt-1 text-xs text-ink-dim">{message}</p> : null}
    </div>
  );
}

function OrganizationLabel({ organizationId }: { organizationId: string }) {
  const organizationAsync = useAsync(() => api.admin.organization(organizationId), { immediate: [] });
  const organization = organizationAsync.data as AdminOrganizationDetail | undefined;
  return <div><p className="font-medium text-ink">{organization?.displayName || organization?.legalName || (organizationAsync.error ? "Organization unavailable" : "Loading organization…")}</p><p className="text-[11px] text-ink-dim" title={organizationId}>ID: {organizationId}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-dim">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
