import type { BaseCard, Column, DataAdapter } from '../core/types';
import { NetworkError, retryAsync, type RetryOptions } from '../core/utils/retry';

/**
 * Structural subset of `@supabase/supabase-js`'s `SupabaseClient` that this
 * adapter needs. Defined locally (instead of importing the package) so the
 * core library has no hard dependency on supabase-js — any object shaped
 * like this, including the real client, satisfies it.
 */
export interface SupabaseClientLike {
  from(table: string): SupabaseQueryBuilderLike;
}

export interface SupabaseQueryBuilderLike {
  select(columns?: string): SupabaseListResultLike;
  insert(values: Record<string, unknown>): SupabaseSingleResultLike;
  update(values: Record<string, unknown>): SupabaseFilterableLike;
}

export interface SupabaseListResultLike
  extends PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> {
  order(column: string, opts?: { ascending?: boolean }): SupabaseListResultLike;
}

export interface SupabaseFilterableLike {
  eq(column: string, value: unknown): SupabaseSingleResultLike;
}

export interface SupabaseSingleResultLike {
  select(columns?: string): SupabaseSingleResultLike;
  single(): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

export interface SupabaseAdapterOptions<TCard extends BaseCard> {
  client: SupabaseClientLike;
  /** Table holding columns, e.g. `board_columns`. */
  columnsTable: string;
  /** Table holding cards, e.g. `board_cards`. */
  cardsTable: string;
  /** Maps a raw Supabase row to a typed card; defaults to a passthrough cast. */
  mapRow?: (row: unknown) => TCard;
  /**
   * Retry policy applied to every query via retryAsync. Set to `false` to
   * disable. Defaults to 3 retries with a 1s base delay.
   */
  retry?: RetryOptions | false;
}

function assertNoError(error: { message: string } | null, context: string): void {
  // Postgrest doesn't distinguish transient vs permanent failures in a
  // machine-readable way here, so we classify as retryable (NetworkError):
  // a genuinely bad request will still fail after retries and surface the
  // same message, just slightly slower.
  if (error) throw new NetworkError(`[SupabaseAdapter] ${context}: ${error.message}`);
}

/**
 * DataAdapter backed by Supabase Postgres tables. Assumes `cardsTable` has
 * at least the BaseCard columns (id, title, column_id/columnId, order,
 * created_at/createdAt, updated_at/updatedAt) — adjust `mapRow` if your
 * schema uses different names.
 */
export function createSupabaseAdapter<TCard extends BaseCard = BaseCard>({
  client,
  columnsTable,
  cardsTable,
  mapRow,
  retry,
}: SupabaseAdapterOptions<TCard>): DataAdapter<TCard> {
  const toCard = mapRow ?? ((row: unknown) => row as TCard);
  const retryOptions = retry === false ? null : retry ?? {};
  const withRetry = <T>(fn: () => Promise<T>) => (retryOptions ? retryAsync(fn, retryOptions) : fn());

  return {
    fetchColumns: () =>
      withRetry(async () => {
        const { data, error } = await client.from(columnsTable).select('*').order('order');
        assertNoError(error, 'fetchColumns');
        return (data ?? []) as Column[];
      }),

    fetchCards: () =>
      withRetry(async () => {
        const { data, error } = await client.from(cardsTable).select('*').order('order');
        assertNoError(error, 'fetchCards');
        return ((data ?? []) as unknown[]).map(toCard);
      }),

    createCard: (patch) =>
      withRetry(async () => {
        const { data, error } = await client.from(cardsTable).insert(patch as Record<string, unknown>).select().single();
        assertNoError(error, 'createCard');
        return toCard(data);
      }),

    updateCard: (id, patch) =>
      withRetry(async () => {
        const { data, error } = await client
          .from(cardsTable)
          .update(patch as Record<string, unknown>)
          .eq('id', id)
          .select()
          .single();
        assertNoError(error, 'updateCard');
        return toCard(data);
      }),

    moveCard: (cardId, newColumnId, newOrder) =>
      withRetry(async () => {
        const { data, error } = await client
          .from(cardsTable)
          .update({ columnId: newColumnId, order: newOrder })
          .eq('id', cardId)
          .select()
          .single();
        assertNoError(error, 'moveCard');
        return toCard(data);
      }),
  };
}
