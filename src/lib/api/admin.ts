export interface AdminService { health(): Promise<unknown>; auditLogs(): Promise<unknown[]>; }
export const adminService: AdminService | null = null;
