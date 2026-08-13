export interface QuotesService { list(): Promise<unknown[]>; get(id: string): Promise<unknown>; }
export const quoteService: QuotesService | null = null;
