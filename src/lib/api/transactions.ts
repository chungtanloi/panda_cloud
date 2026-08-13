export interface TransactionsService { list(): Promise<unknown[]>; get(id: string): Promise<unknown>; }
export const transactionService: TransactionsService | null = null;
