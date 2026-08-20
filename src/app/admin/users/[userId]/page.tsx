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
import type { AdminUser, AdminUserUpdateRequest } from "@/models/admin";
import { isAdmin } from "@/models/auth";

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

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
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
                    <tr key={`${m.organizationId}-${m.role}`} className="border-b border-line/60">
                      <td className="p-4 font-medium text-ink">{m.organizationId}</td>
                      <td className="p-4"><StatusBadge status={m.role} /></td>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-ink-dim">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
