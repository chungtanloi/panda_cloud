export type AdminOverview = Record<string, unknown>;
export type AdminUserPage = { items: Array<Record<string, unknown>>; continueCursor?: string | null; isDone?: boolean };
export type AdminRoles = Record<string, unknown>;
export type AdminHealth = Record<string, unknown>;
export type AdminAuditPage = { items: Array<Record<string, unknown>>; continueCursor?: string | null; isDone?: boolean };
