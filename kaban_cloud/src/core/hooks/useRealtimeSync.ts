import { useEffect, useRef } from 'react';
import type { BaseCard } from '../types';
import {
  subscribeToCardChanges,
  type CardChangeEvent,
  type RealtimeClientLike,
} from '../../adapters/supabase-realtime';
import { notifyInfo } from './useErrorNotification';

export interface UseRealtimeSyncOptions<TCard extends BaseCard> {
  schema?: string;
  mapRow?: (row: unknown) => TCard;
  channelName?: string;
  /**
   * Card ids currently being edited/moved locally. Changes to these are
   * dropped rather than merged, so an in-flight optimistic update never
   * gets clobbered by the echo of its own write coming back over realtime.
   */
  ignoreCardIds?: Iterable<string>;
  /** Resolve a friendly name for whoever made the change, e.g. `(card) => card.lastEditedBy`. Return null/undefined to skip the toast. */
  getActorName?: (card: TCard) => string | null | undefined;
  /** Set to false to skip subscribing (e.g. board rendered read-only, or no client yet). Defaults to true. */
  enabled?: boolean;
}

/**
 * Subscribes to Postgres change events for `table` via Supabase Realtime
 * and calls `onChange` for every INSERT/UPDATE/DELETE. Unsubscribes
 * automatically on unmount or when `client`/`table` change.
 *
 *   useRealtimeSync(supabase, 'cards', (event) => {
 *     if (event.type === 'DELETE') removeRemoteCard(event.card.id);
 *     else mergeRemoteCard(event.card);
 *   }, { getActorName: (card) => card.lastEditedBy });
 */
export function useRealtimeSync<TCard extends BaseCard = BaseCard>(
  client: RealtimeClientLike | null | undefined,
  table: string,
  onChange: (event: CardChangeEvent<TCard>) => void,
  options: UseRealtimeSyncOptions<TCard> = {},
): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!client || options.enabled === false) return undefined;

    const unsubscribe = subscribeToCardChanges<TCard>(
      { client, table, schema: options.schema, mapRow: options.mapRow, channelName: options.channelName },
      (event) => {
        const ignore = optionsRef.current.ignoreCardIds;
        if (ignore && Array.from(ignore).includes(event.card.id)) return;

        onChangeRef.current(event);

        const actor = optionsRef.current.getActorName?.(event.card);
        if (actor) {
          const verb = event.type === 'INSERT' ? 'created' : event.type === 'DELETE' ? 'deleted' : 'updated';
          notifyInfo(`${actor} ${verb} "${event.card.title}"`);
        }
      },
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, table, options.schema, options.channelName, options.enabled]);
}
