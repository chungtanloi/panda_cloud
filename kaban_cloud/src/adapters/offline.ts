import type { BaseCard, DataAdapter } from '../core/types';
import { openKanbanDB, type SyncQueueItem } from '../core/db/indexeddb';

export interface OfflineAdapterOptions {
  /** IndexedDB database name; namespace per board if an app renders more than one. */
  dbName?: string;
}

export interface OfflineDataAdapter<TCard extends BaseCard> extends DataAdapter<TCard> {
  /** Flushes the local sync queue against the wrapped adapter, in FIFO order. Runs automatically on the browser 'online' event. */
  sync: () => Promise<void>;
  /** Number of local changes waiting to sync. */
  getQueueSize: () => Promise<number>;
  isOnline: () => boolean;
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

/**
 * Wraps any DataAdapter with IndexedDB persistence + an offline write
 * queue:
 *
 *   Online:  fetchCards() -> adapter -> cache to IndexedDB -> return
 *   Offline: fetchCards() -> adapter fails/skipped -> return from IndexedDB
 *   moveCard() offline -> update IndexedDB immediately + queue for sync
 *   Back online -> queued changes replay against the adapter in order
 *
 * Conflict handling is last-write-wins: a queued local change simply
 * overwrites whatever the adapter currently has for that card when it
 * replays. Reads always reflect IndexedDB, which is kept as the local
 * source of truth while offline.
 */
export function createOfflineAdapter<TCard extends BaseCard = BaseCard>(
  inner: DataAdapter<TCard>,
  options: OfflineAdapterOptions = {},
): OfflineDataAdapter<TCard> {
  const db = openKanbanDB<TCard>(options.dbName ?? 'kanban-library');
  let syncing = false;

  async function applyToInner(item: SyncQueueItem<TCard>): Promise<void> {
    switch (item.op) {
      case 'create':
        if (inner.createCard) await inner.createCard(item.patch ?? {});
        return;
      case 'update':
        await inner.updateCard(item.cardId, item.patch ?? {});
        return;
      case 'move':
        await inner.moveCard(item.cardId, item.columnId ?? '', item.order);
        return;
      case 'delete':
        if (inner.deleteCard) await inner.deleteCard(item.cardId);
        return;
    }
  }

  async function sync(): Promise<void> {
    if (syncing || !isOnline()) return;
    syncing = true;
    try {
      const queue = await db.getQueue();
      for (const item of queue) {
        try {
          await applyToInner(item);
          await db.dequeue(item.id);
        } catch {
          // Preserve order: stop at the first failure, the rest retry on the next sync pass.
          break;
        }
      }
    } finally {
      syncing = false;
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => void sync());
  }

  return {
    async fetchColumns() {
      try {
        const columns = await inner.fetchColumns();
        await db.setColumns(columns);
        return columns;
      } catch (err) {
        const cached = await db.getColumns();
        if (cached.length > 0) return cached;
        throw err;
      }
    },

    async fetchCards() {
      try {
        const cards = await inner.fetchCards();
        await db.setCards(cards);
        return cards;
      } catch (err) {
        const cached = await db.getCards();
        if (cached.length > 0) return cached;
        throw err;
      }
    },

    async createCard(data) {
      if (isOnline() && inner.createCard) {
        try {
          const created = await inner.createCard(data);
          await db.setCards([...(await db.getCards()), created]);
          return created;
        } catch {
          // Fall through to the offline path below.
        }
      }

      const now = new Date().toISOString();
      const localCard = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: 'Untitled',
        columnId: '',
        order: 0,
        createdAt: now,
        updatedAt: now,
        ...data,
      } as TCard;

      await db.setCards([...(await db.getCards()), localCard]);
      await db.enqueue({ op: 'create', cardId: localCard.id, patch: data });
      return localCard;
    },

    async updateCard(id, patch) {
      const cards = await db.getCards();
      const localResult = cards.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));

      if (isOnline()) {
        try {
          const updated = await inner.updateCard(id, patch);
          await db.setCards(cards.map((c) => (c.id === id ? updated : c)));
          return updated;
        } catch {
          // Fall through to the offline path below.
        }
      }

      await db.setCards(localResult);
      await db.enqueue({ op: 'update', cardId: id, patch });
      const result = localResult.find((c) => c.id === id);
      if (!result) throw new Error(`Card ${id} not found in offline cache`);
      return result;
    },

    async moveCard(cardId, newColumnId, newOrder) {
      const cards = await db.getCards();
      const localResult = cards.map((c) =>
        c.id === cardId
          ? { ...c, columnId: newColumnId, order: newOrder ?? c.order, updatedAt: new Date().toISOString() }
          : c,
      );

      if (isOnline()) {
        try {
          const updated = await inner.moveCard(cardId, newColumnId, newOrder);
          await db.setCards(cards.map((c) => (c.id === cardId ? updated : c)));
          return updated;
        } catch {
          // Fall through to the offline path below.
        }
      }

      await db.setCards(localResult);
      await db.enqueue({ op: 'move', cardId, columnId: newColumnId, order: newOrder });
      const result = localResult.find((c) => c.id === cardId);
      if (!result) throw new Error(`Card ${cardId} not found in offline cache`);
      return result;
    },

    async deleteCard(id) {
      const cards = await db.getCards();
      if (isOnline() && inner.deleteCard) {
        try {
          await inner.deleteCard(id);
          await db.setCards(cards.filter((c) => c.id !== id));
          return;
        } catch {
          // Fall through to the offline path below.
        }
      }
      await db.setCards(cards.filter((c) => c.id !== id));
      await db.enqueue({ op: 'delete', cardId: id });
    },

    reorderColumns: inner.reorderColumns,

    sync,
    getQueueSize: async () => (await db.getQueue()).length,
    isOnline,
  };
}
