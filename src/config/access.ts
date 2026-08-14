import type { AuthProfile, MembershipRole } from "@/models/auth";
import { effectiveRoles, WORKSPACE_ROLE_PRECEDENCE } from "@/models/auth";

/**
 * Central access configuration.
 *
 * ROLE_PERMISSION_MATRIX § 13: "Không nên hard-code permission trực tiếp trong
 * từng component. Nên duy trì một access configuration trung tâm… src/config/access.ts".
 *
 * ⚠ These grants gate **UI affordances only**. Every protected operation must
 * be authorized again by the backend (ROLE_PERMISSION_MATRIX § 14,
 * KANBAN_INTEGRATION § Access control). Hiding a button is not access control.
 */

export type Permission =
  | "workspace:user:view" | "project:view" | "gpu:view" | "portfolio:view"
  | "wallet:view" | "transaction:view" | "lead:view" | "lead:update"
  | "lead:assign" | "quote:view" | "quote:create" | "task:view"
  | "report:view" | "team:view" | "team:manage" | "operation:view"
  | "approval:view" | "approval:decide" | "user:manage" | "role:manage"
  | "system:view" | "system:manage" | "audit:view"
  // ROLE_PERMISSION_MATRIX § 10 "Technical DD" — the only dd:* names the
  // source doc defines. § 5.5: Sales/Legal/Compliance read access on DD
  // responses is mentioned but not specified as a permission grant, so no
  // dd:* permission is granted to those roles here (U-07-adjacent gap).
  | "dd:view" | "dd:respond" | "dd:review" | "dd:evidence:upload";

/**
 * Workspaces that exist in this repository today.
 *
 * `technical` now has a workspace (ROLE_PERMISSION_MATRIX § 5.2 / § 11).
 *
 * ⚠ `legal` and `compliance` still have **no** workspace. Their route trees
 * are described in ROLE_PERMISSION_MATRIX § 11 as "page design được đề
 * xuất… không phải các page đã implement". They are not invented here.
 */
export type WorkspaceId = "customer" | "sales" | "manager" | "admin" | "technical";

export interface NavigationItem { label: string; href: string; permission?: Permission; externalFlow?: boolean; }

/**
 * Grants per membership role.
 *
 * `customer`, `sales`, `manager` and `admin` are carried over verbatim from the
 * previous `USER`/`SALES`/`MANAGER`/`ADMIN` sets — this migration changes the
 * role *identifiers* to the canonical contract values, not the grants.
 *
 * ⚠ NEEDS CLARIFICATION (U-07, partially resolved for `technical`):
 * ROLE_PERMISSION_MATRIX § 10 defines the four `dd:*` names below and § 5
 * documents a Technical workspace, so `technical` is granted them here.
 * `legal` and `compliance` still have only `ncnda:*` / `kyc:*` *names* with
 * no workspace and no frontend surface — they stay empty. Fail-closed, not
 * fail-open.
 *
 * ⚠ NEEDS CLARIFICATION — NOT granted to `technical` here because the source
 * doc does not specify them as grants (left as `// TODO: NEEDS CLARIFICATION`
 * rather than guessed):
 *   - § 5.5 "Read-only cross-role access": Sales/Legal/Compliance read access
 *     to DD responses is mentioned but never turned into a permission name or
 *     a role grant.
 *   - § 5.5 also asks for `canRead`/`canWrite` at the *field* level, not a
 *     single boolean permission — no field-level matrix exists to encode.
 *   - Kanban stage-transition scope ("Limited" for Technical) — § 10 "Các
 *     permission khác" explicitly says Kanban/Deal/Stage grants are not in
 *     the source doc yet.
 */
export const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  customer: ["workspace:user:view", "project:view", "gpu:view", "portfolio:view", "wallet:view", "transaction:view"],
  sales: ["lead:view", "lead:update", "quote:view", "quote:create", "task:view", "report:view"],
  manager: ["lead:view", "lead:update", "lead:assign", "quote:view", "task:view", "report:view", "team:view", "team:manage", "operation:view", "approval:view", "approval:decide"],
  admin: ["workspace:user:view", "project:view", "gpu:view", "portfolio:view", "wallet:view", "transaction:view", "lead:view", "lead:update", "lead:assign", "quote:view", "quote:create", "task:view", "report:view", "team:view", "team:manage", "operation:view", "approval:view", "approval:decide", "user:manage", "role:manage", "system:view", "system:manage", "audit:view"],
  // ROLE_PERMISSION_MATRIX § 10 "Technical DD" — exactly these four names,
  // no more. dd:review is kept separate from dd:respond even though today's
  // UI does not yet distinguish "responder" from "reviewer" identities
  // (§ 5.3 lists both as steps one Technical identity can perform).
  technical: ["dd:view", "dd:respond", "dd:review", "dd:evidence:upload"],
  legal: [],
  compliance: [],
};

export const navigationByWorkspace: Record<WorkspaceId, readonly NavigationItem[]> = {
  customer: [
    { label: "Overview", href: "/dashboard" }, { label: "Projects", href: "/dashboard/projects", permission: "project:view" },
    { label: "GPU Clusters", href: "/dashboard/gpu-clusters", permission: "gpu:view" }, { label: "Portfolio", href: "/dashboard/portfolio", permission: "portfolio:view" },
    { label: "Wallet", href: "/dashboard/wallet", permission: "wallet:view" }, { label: "Transactions", href: "/dashboard/transactions", permission: "transaction:view" },
    { label: "New Instance", href: "/booking", externalFlow: true }, { label: "Profile", href: "/dashboard/profile" }, { label: "Settings", href: "/dashboard/settings" },
  ],
  sales: [
    { label: "Overview", href: "/sales" }, { label: "Leads", href: "/sales/leads", permission: "lead:view" }, { label: "Pipeline", href: "/sales/pipeline", permission: "lead:view" },
    { label: "Quotes", href: "/sales/quotes", permission: "quote:view" }, { label: "Tasks", href: "/sales/tasks", permission: "task:view" },
    { label: "Customers", href: "/sales/customers", permission: "lead:view" }, { label: "Reports", href: "/sales/reports", permission: "report:view" },
  ],
  manager: [
    { label: "Overview", href: "/manager" }, { label: "Sales Performance", href: "/manager/sales", permission: "report:view" }, { label: "Team", href: "/manager/team", permission: "team:view" },
    { label: "Pipeline", href: "/manager/pipeline", permission: "lead:view" }, { label: "Operations", href: "/manager/operations", permission: "operation:view" },
    { label: "Approvals", href: "/manager/approvals", permission: "approval:view" }, { label: "Reports", href: "/manager/reports", permission: "report:view" },
  ],
  admin: [
    { label: "Overview", href: "/admin" }, { label: "Users", href: "/admin/users", permission: "user:manage" }, { label: "Roles", href: "/admin/roles", permission: "role:manage" },
    { label: "Permissions", href: "/admin/permissions", permission: "role:manage" }, { label: "System", href: "/admin/system", permission: "system:view" },
    { label: "Audit Logs", href: "/admin/audit-logs", permission: "audit:view" }, { label: "Settings", href: "/admin/settings", permission: "system:manage" },
  ],
  // ROLE_PERMISSION_MATRIX § 5.2 route table.
  technical: [
    { label: "Overview", href: "/technical" },
    { label: "Assessments", href: "/technical/assessments", permission: "dd:view" },
  ],
};

export const defaultRouteByWorkspace: Record<WorkspaceId, string> = {
  customer: "/dashboard",
  sales: "/sales",
  manager: "/manager",
  admin: "/admin",
  technical: "/technical",
};

/** Workspace a role can open, or `null` when the role has no workspace yet. */
export function workspaceForRole(role: MembershipRole): WorkspaceId | null {
  switch (role) {
    case "customer": return "customer";
    case "sales": return "sales";
    case "manager": return "manager";
    case "admin": return "admin";
    case "technical": return "technical";
    // U-07 — no route tree exists for these roles.
    case "legal":
    case "compliance":
      return null;
  }
}

export function permissionsFor(profile: AuthProfile | null): Set<Permission> {
  const granted = new Set<Permission>();
  for (const role of effectiveRoles(profile)) {
    for (const permission of ROLE_PERMISSIONS[role]) granted.add(permission);
  }
  return granted;
}

export function hasPermission(profile: AuthProfile | null, permission: Permission): boolean {
  return permissionsFor(profile).has(permission);
}

/**
 * ⚠ NEEDS CLARIFICATION (U-05, U-06). This preserves the previous behaviour
 * exactly rather than tightening or loosening it:
 *   - the customer workspace is open to non-staff identities and to `admin`
 *     (previously `role === "USER" || role === "ADMIN"`);
 *   - every other workspace requires the matching role;
 *   - `admin` still does **not** get Sales or Manager
 *     (ROLE_PERMISSION_MATRIX § 12.3 leaves this undecided).
 */
export function canAccessWorkspace(profile: AuthProfile | null, workspace: WorkspaceId): boolean {
  if (!profile) return false;
  const roles = effectiveRoles(profile);
  if (workspace === "customer") return roles.includes("customer") || roles.includes("admin");
  return roles.includes(workspace);
}

/**
 * Landing route after sign-in.
 *
 * Falls back to the public landing page when the identity holds only roles
 * that have no workspace (legal / compliance — U-07), rather than
 * inventing a destination for them.
 */
export function homeForProfile(profile: AuthProfile | null): string {
  const roles = effectiveRoles(profile);
  for (const role of WORKSPACE_ROLE_PRECEDENCE) {
    if (!roles.includes(role)) continue;
    const workspace = workspaceForRole(role);
    if (workspace) return defaultRouteByWorkspace[workspace];
  }
  return "/";
}