import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BaseCard, Column, DataAdapter, KanbanStatus } from '../types';
import { notifyError } from './useErrorNotification';

export interface UseKanbanResult<TCard extends BaseCard> {
  columns: Column[];
  cards: TCard[];
  /** Cards grouped by columnId and sorted by `order`, ready to render. */
  cardsByColumn: Map<string, TCard[]>;
  status: KanbanStatus;
  error: Error | null;
  /** Card ids with an optimistic move/update currently in flight — drag/edit UI should treat these as busy. */
  pendingCardIds: Set<string>;
  refresh: () => Promise<void>;
  /** Optimistically moves a card to a new column/position, persists via the adapter, rolls back + toasts on failure. */
  moveCard: (cardId: string, newColumnId: string, newOrder?: number) => Promise<void>;
  /** Optimistically patches a card, persists via the adapter, rolls back + toasts on failure. */
  updateCard: (cardId: string, patch: Partial<TCard>) => Promise<void>;
  createCard: (data: Partial<TCard>) => Promise<TCard | undefined>;
  deleteCard: (cardId: string) => Promise<void>;
  /** Merges a card from an external source (e.g. realtime) into local state; last-write-wins by `updatedAt`. */
  mergeRemoteCard: (card: TCard) => void;
  /** Removes a card from local state in response to an external delete event. */
  removeRemoteCard: (cardId: string) => void;
}

function groupByColumn<TCard extends BaseCard>(cards: TCard[]): Map<string, TCard[]> {
  const map = new Map<string, TCard[]>();
  for (const card of cards) {
    const bucket = map.get(card.columnId) ?? [];
    bucket.push(card);
    map.set(card.columnId, bucket);
  }
  for (const bucket of map.values()) {
    bucket.sort((a, b) => a.order - b.order);
  }
  return map;
}

/**
 * Owns board state (columns + cards) and every mutation, sourcing data from
 * whatever DataAdapter is passed in. This is the hook <Kanban /> is built
 * on top of; consumers building a fully custom UI can use it directly.
 *
 * Retries live in the adapter layer (see `retryAsync` in `core/utils/retry`
 * and the built-in adapters, which retry transient failures automatically).
 * This hook's job is the optimistic-update contract on top of that: apply
 * the change instantly, roll back and surface a toast (with a "Retry"
 * button that re-runs the same action) if the adapter call still fails
 * after its own retries.
 */
export function useKanban<TCard extends BaseCard = BaseCard>(
  adapter: DataAdapter<TCard>,
  initialColumns?: Column[],
): UseKanbanResult<TCard> {
  const [columns, setColumns] = useState<Column[]>(initialColumns ?? []);
  const [cards, setCards] = useState<TCard[]>([]);
  const [status, setStatus] = useState<KanbanStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [pendingCardIds, setPendingCardIds] = useState<Set<string>>(new Set());
  const cardsRef = useRef<TCard[]>([]);
  cardsRef.current = cards;
  const pendingRef = useRef<Set<string>>(new Set());

  const setPending = (cardId: string, isPending: boolean) => {
    const next = new Set(pendingRef.current);
    if (isPending) next.add(cardId);
    else next.delete(cardId);
    pendingRef.current = next;
    setPendingCardIds(next);
  };

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const [fetchedColumns, fetchedCards] = await Promise.all([adapter.fetchColumns(), adapter.fetchCards()]);
      setColumns(fetchedColumns);
      setCards(fetchedCards);
      setStatus('ready');
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err));
      setError(normalized);
      setStatus('error');
      notifyError(`Failed to load board: ${normalized.message}`, { error: normalized, retry: () => void refresh() });
    }
  }, [adapter]);

  useEffect(() => {
    void refresh();
    // Re-fetch whenever a new adapter instance is supplied (e.g. project swaps backend/config).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter]);

  const moveCard = useCallback(
    async (cardId: string, newColumnId: string, newOrder?: number) => {
      // A move for this card is already syncing — drop this one rather than
      // racing two in-flight adapter calls (e.g. a fast double-drag).
      if (pendingRef.current.has(cardId)) return;

      const previous = cardsRef.current;
      const target = previous.find((c) => c.id === cardId);
      if (!target) return;

      const order = newOrder ?? previous.filter((c) => c.columnId === newColumnId).length;
      const optimistic = previous.map((c) => (c.id === cardId ? { ...c, columnId: newColumnId, order } : c));
      setCards(optimistic);
      setPending(cardId, true);

      try {
        const updated = await adapter.moveCard(cardId, newColumnId, order);
        setCards((current) => current.map((c) => (c.id === cardId ? updated : c)));
      } catch (err) {
        setCards(previous);
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        notifyError(`Failed to move "${target.title}"`, {
          error: normalized,
          retry: () => void moveCard(cardId, newColumnId, newOrder),
        });
      } finally {
        setPending(cardId, false);
      }
    },
    [adapter],
  );

  const updateCard = useCallback(
    async (cardId: string, patch: Partial<TCard>) => {
      if (pendingRef.current.has(cardId)) return;

      const previous = cardsRef.current;
      const target = previous.find((c) => c.id === cardId);
      const optimistic = previous.map((c) => (c.id === cardId ? { ...c, ...patch } : c));
      setCards(optimistic);
      setPending(cardId, true);

      try {
        const updated = await adapter.updateCard(cardId, patch);
        setCards((current) => current.map((c) => (c.id === cardId ? updated : c)));
      } catch (err) {
        setCards(previous);
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        notifyError(`Failed to save changes to "${target?.title ?? cardId}"`, {
          error: normalized,
          retry: () => void updateCard(cardId, patch),
        });
      } finally {
        setPending(cardId, false);
      }
    },
    [adapter],
  );

  const createCard = useCallback(
    async (data: Partial<TCard>) => {
      if (!adapter.createCard) {
        throw new Error('DataAdapter.createCard is not implemented');
      }
      try {
        const created = await adapter.createCard(data);
        setCards((current) => [...current, created]);
        return created;
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        notifyError(`Failed to create card: ${normalized.message}`, {
          error: normalized,
          retry: () => void createCard(data),
        });
        return undefined;
      }
    },
    [adapter],
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      if (!adapter.deleteCard) {
        throw new Error('DataAdapter.deleteCard is not implemented');
      }
      if (pendingRef.current.has(cardId)) return;

      const previous = cardsRef.current;
      setCards(previous.filter((c) => c.id !== cardId));
      setPending(cardId, true);
      try {
        await adapter.deleteCard(cardId);
      } catch (err) {
        setCards(previous);
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        notifyError(`Failed to delete card: ${normalized.message}`, {
          error: normalized,
          retry: () => void deleteCard(cardId),
        });
      } finally {
        setPending(cardId, false);
      }
    },
    [adapter],
  );

  /**
   * Merges a card that arrived from outside the normal fetch/mutate cycle —
   * e.g. a Supabase Realtime event — into local state. Last-write-wins: the
   * incoming card is applied unless a pending local mutation for the same
   * card is still in flight (that optimistic update will resolve on its
   * own and shouldn't be clobbered mid-flight) or a locally-known
   * `updatedAt` is already newer.
   */
  const mergeRemoteCard = useCallback((card: TCard) => {
    if (pendingRef.current.has(card.id)) return;
    setCards((current) => {
      const existing = current.find((c) => c.id === card.id);
      if (!existing) return [...current, card];
      if (existing.updatedAt && card.updatedAt && existing.updatedAt > card.updatedAt) return current;
      return current.map((c) => (c.id === card.id ? card : c));
    });
  }, []);

  /** Removes a card from local state in response to an external delete event (e.g. Realtime). */
  const removeRemoteCard = useCallback((cardId: string) => {
    if (pendingRef.current.has(cardId)) return;
    setCards((current) => current.filter((c) => c.id !== cardId));
  }, []);

  const cardsByColumn = useMemo(() => groupByColumn(cards), [cards]);
  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);

  return {
    columns: sortedColumns,
    cards,
    cardsByColumn,
    status,
    error,
    pendingCardIds,
    refresh,
    moveCard,
    updateCard,
    createCard,
    mergeRemoteCard,
    removeRemoteCard,
    deleteCard,
  };
}
