/** Backend contract pending. Keep user management behind this typed port. */
export interface UsersService { list(): Promise<unknown[]>; update(id: string, patch: unknown): Promise<unknown>; }
export const usersService: UsersService | null = null;
