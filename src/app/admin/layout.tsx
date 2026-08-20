"use client";

import { usePathname } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { useAuth } from "@/controllers/AuthContext";
import { hasRole } from "@/models/auth";

/**
 * Manager read-scope for the Admin workspace (Phase 1B contract):
 *
 * ALLOW:
 *   /admin/users
 *   /admin/users/[userId]
 *   /admin/organizations
 *   /admin/organizations/[userId]
 *
 * Everything else is privileged and blocked for Manager.
 * admin and super_admin pass through unconditionally.
 */
const MANAGER_ALLOWED_PREFIXES = [
  "/admin/users",
  "/admin/organizations",
];
const MANAGER_BLOCKED_EXACT = [
  "/admin/organizations/new",
];

function isManagerAllowedRoute(pathname: string): boolean {
  if (MANAGER_BLOCKED_EXACT.includes(pathname)) return false;
  return MANAGER_ALLOWED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + "/"),
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const pathname = usePathname();

  const isManager = hasRole(profile, "manager") && !hasRole(profile, "admin") && !hasRole(profile, "super_admin");

  if (isManager && !isManagerAllowedRoute(pathname)) {
    return (
      <WorkspaceShell workspace="admin">
        <div className="grid min-h-[50vh] place-items-center p-6">
          <div className="max-w-lg rounded-2xl border border-line bg-surface p-10 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">403 · Restricted</p>
            <h1 className="mt-3 text-xl font-semibold text-ink">Access restricted</h1>
            <p className="mt-2 text-sm text-ink-dim">
              Your role does not have access to this admin page.
              Contact an administrator if you need additional access.
            </p>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return <WorkspaceShell workspace="admin">{children}</WorkspaceShell>;
}
