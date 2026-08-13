import type { User, UserRole } from "@/models/auth";

export type Permission =
  | "workspace:user:view" | "project:view" | "gpu:view" | "portfolio:view"
  | "wallet:view" | "transaction:view" | "lead:view" | "lead:update"
  | "lead:assign" | "quote:view" | "quote:create" | "task:view"
  | "report:view" | "team:view" | "team:manage" | "operation:view"
  | "approval:view" | "approval:decide" | "user:manage" | "role:manage"
  | "system:view" | "system:manage" | "audit:view";

export interface NavigationItem { label: string; href: string; permission?: Permission; externalFlow?: boolean; }

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  USER: ["workspace:user:view", "project:view", "gpu:view", "portfolio:view", "wallet:view", "transaction:view"],
  SALES: ["lead:view", "lead:update", "quote:view", "quote:create", "task:view", "report:view"],
  MANAGER: ["lead:view", "lead:update", "lead:assign", "quote:view", "task:view", "report:view", "team:view", "team:manage", "operation:view", "approval:view", "approval:decide"],
  ADMIN: ["workspace:user:view", "project:view", "gpu:view", "portfolio:view", "wallet:view", "transaction:view", "lead:view", "lead:update", "lead:assign", "quote:view", "quote:create", "task:view", "report:view", "team:view", "team:manage", "operation:view", "approval:view", "approval:decide", "user:manage", "role:manage", "system:view", "system:manage", "audit:view"],
};

export const navigationByRole: Record<UserRole, readonly NavigationItem[]> = {
  USER: [
    { label: "Overview", href: "/dashboard" }, { label: "Projects", href: "/dashboard/projects", permission: "project:view" },
    { label: "GPU Clusters", href: "/dashboard/gpu-clusters", permission: "gpu:view" }, { label: "Portfolio", href: "/dashboard/portfolio", permission: "portfolio:view" },
    { label: "Wallet", href: "/dashboard/wallet", permission: "wallet:view" }, { label: "Transactions", href: "/dashboard/transactions", permission: "transaction:view" },
    { label: "New Instance", href: "/booking", externalFlow: true }, { label: "Profile", href: "/dashboard/profile" }, { label: "Settings", href: "/dashboard/settings" },
  ],
  SALES: [
    { label: "Overview", href: "/sales" }, { label: "Leads", href: "/sales/leads", permission: "lead:view" }, { label: "Pipeline", href: "/sales/pipeline", permission: "lead:view" },
    { label: "Quotes", href: "/sales/quotes", permission: "quote:view" }, { label: "Tasks", href: "/sales/tasks", permission: "task:view" },
    { label: "Customers", href: "/sales/customers", permission: "lead:view" }, { label: "Reports", href: "/sales/reports", permission: "report:view" },
  ],
  MANAGER: [
    { label: "Overview", href: "/manager" }, { label: "Sales Performance", href: "/manager/sales", permission: "report:view" }, { label: "Team", href: "/manager/team", permission: "team:view" },
    { label: "Pipeline", href: "/manager/pipeline", permission: "lead:view" }, { label: "Operations", href: "/manager/operations", permission: "operation:view" },
    { label: "Approvals", href: "/manager/approvals", permission: "approval:view" }, { label: "Reports", href: "/manager/reports", permission: "report:view" },
  ],
  ADMIN: [
    { label: "Overview", href: "/admin" }, { label: "Users", href: "/admin/users", permission: "user:manage" }, { label: "Roles", href: "/admin/roles", permission: "role:manage" },
    { label: "Permissions", href: "/admin/permissions", permission: "role:manage" }, { label: "System", href: "/admin/system", permission: "system:view" },
    { label: "Audit Logs", href: "/admin/audit-logs", permission: "audit:view" }, { label: "Settings", href: "/admin/settings", permission: "system:manage" },
  ],
};

export const defaultRouteByRole: Record<UserRole, string> = { USER: "/dashboard", SALES: "/sales", MANAGER: "/manager", ADMIN: "/admin" };
export function getUserRole(user: User | null): UserRole { return user?.role ?? "USER"; }
export function hasPermission(user: User | null, permission: Permission): boolean { return ROLE_PERMISSIONS[getUserRole(user)].includes(permission); }
export function canAccessWorkspace(user: User | null, workspace: UserRole): boolean { const role = getUserRole(user); return role === workspace || (role === "ADMIN" && workspace === "USER"); }
export function homeForUser(user: User): string { return defaultRouteByRole[getUserRole(user)]; }
