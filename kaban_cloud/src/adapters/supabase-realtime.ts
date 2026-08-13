import type { BaseCard } from '../core/types';

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<TRow = unknown> {
  eventType: RealtimeEventType;
  new: TRow;
  old: Partial<TRow> | null;
}

/**
 * Structural subset of `@supabase/supabase-js`'s realtime channel API this
 * module needs — defined locally so the core library has no hard dependency
 * on supabase-js, matching the pattern used by `adapters/supabase.ts`.
 */
export interface RealtimeChannelLike {
  on(
    event: 'postgres_changes',
    filter: { event: '*' | RealtimeEventType; schema: string; table: string },
    callback: (payload: RealtimePayload) => void,
  ): RealtimeChannelLike;
  subscribe(callback?: (status: string) => void): unknown;
}

export interface RealtimeClientLike {
  channel(name: string): RealtimeChannelLike;
  removeChannel(channel: RealtimeChannelLike): unknown;
}

export interface CardChangeEvent<TCard extends BaseCard> {
  type: RealtimeEventType;
  card: TCard;
  previous: Partial<TCard> | null;
}

export interface SubscribeToCardChangesOptions<TCard extends BaseCard> {
  client: RealtimeClientLike;
  table: string;
  schema?: string;
  /** Maps a raw Postgres row to a typed card; defaults to a passthrough cast. */
  mapRow?: (row: unknown) => TCard;
  /** Unique-ish channel name; defaults to `realtime:<table>`. Use distinct names for multiple boards on the same table. */
  channelName?: string;
}

/**
 * Subscribes to Postgres change events on `table` via Supabase Realtime.
 * Returns an unsubscribe function — always call it on unmount to avoid
 * leaking a websocket subscription.
 */
export function subscribeToCardChanges<TCard extends BaseCard = BaseCard>(
  { client, table, schema = 'public', mapRow, channelName }: SubscribeToCardChangesOptions<TCard>,
  onChange: (event: CardChangeEvent<TCard>) => void,
): () => void {
  const toCard = mapRow ?? ((row: unknown) => row as TCard);

  const channel = client
    .channel(channelName ?? `realtime:${table}`)
    .on('postgres_changes', { event: '*', schema, table }, (payload) => {
      onChange({
        type: payload.eventType,
        card: toCard(payload.new),
        previous: (payload.old as Partial<TCard> | null) ?? null,
      });
    });

  channel.subscribe();

  return () => {
    void client.removeChannel(channel);
  };
}
