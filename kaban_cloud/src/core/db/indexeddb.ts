import type { BaseCard, Column } from '../types';

export type SyncQueueOp = 'create' | 'update' | 'move' | 'delete';

export interface SyncQueueItem<TCard extends BaseCard = BaseCard> {
  id: string;
  op: SyncQueueOp;
  cardId: string;
  /** For 'create'/'update': the patch to apply. For 'move': ignored (see columnId/order). */
  patch?: Partial<TCard>;
  /** For 'move' only. */
  columnId?: string;
  order?: number;
  timestamp: number;
}

const CARDS_STORE = 'cards';
const COLUMNS_STORE = 'columns';
const META_STORE = 'meta';
const QUEUE_KEY = 'syncQueue';
export const MAX_QUEUE_SIZE = 100;

function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function openDatabase(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CARDS_STORE)) db.createObjectStore(CARDS_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(COLUMNS_STORE)) db.createObjectStore(COLUMNS_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`Failed to open IndexedDB database "${dbName}"`));
  });
}

export interface KanbanIndexedDB<TCard extends BaseCard> {
  /** Resolves once the underlying database connection is open (or immediately, no-op, if IndexedDB isn't available). */
  ready: Promise<void>;
  readonly isAvailable: boolean;
  getCards(): Promise<TCard[]>;
  setCards(cards: TCard[]): Promise<void>;
  getColumns(): Promise<Column[]>;
  setColumns(columns: Column[]): Promise<void>;
  getQueue(): Promise<SyncQueueItem<TCard>[]>;
  /** Appends a change to the offline sync queue, dropping the oldest entry once MAX_QUEUE_SIZE is exceeded (FIFO). */
  enqueue(item: Omit<SyncQueueItem<TCard>, 'id' | 'timestamp'>): Promise<SyncQueueItem<TCard>>;
  dequeue(id: string): Promise<void>;
  clearQueue(): Promise<void>;
}

/**
 * Thin promise-based wrapper around the native IndexedDB API — no external
 * dependency — used by the offline adapter to cache fetched cards/columns
 * and queue mutations made while offline. Degrades to a no-op store when
 * IndexedDB isn't available (SSR, older browsers, locked-down contexts) so
 * callers don't need to feature-detect themselves.
 */
export function openKanbanDB<TCard extends BaseCard = BaseCard>(dbName = 'kanban-library'): KanbanIndexedDB<TCard> {
  const isAvailable = isIndexedDBAvailable();
  let dbPromise: Promise<IDBDatabase> | null = null;

  const getDb = (): Promise<IDBDatabase> => {
    if (!dbPromise) dbPromise = openDatabase(dbName);
    return dbPromise;
  };

  const ready = isAvailable ? getDb().then(() => undefined) : Promise.resolve();

  async function getAll<T>(store: string): Promise<T[]> {
    if (!isAvailable) return [];
    const db = await getDb();
    const tx = db.transaction(store, 'readonly');
    const result = await promisify<T[]>(tx.objectStore(store).getAll());
    return result;
  }

  async function replaceAll<T extends { id: string }>(store: string, items: T[]): Promise<void> {
    if (!isAvailable) return;
    const db = await getDb();
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    objectStore.clear();
    for (const item of items) objectStore.put(item);
    await txDone(tx);
  }

  async function getMeta<T>(key: string, fallback: T): Promise<T> {
    if (!isAvailable) return fallback;
    const db = await getDb();
    const tx = db.transaction(META_STORE, 'readonly');
    const record = await promisify<{ key: string; value: T } | undefined>(tx.objectStore(META_STORE).get(key));
    return record?.value ?? fallback;
  }

  async function setMeta<T>(key: string, value: T): Promise<void> {
    if (!isAvailable) return;
    const db = await getDb();
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key, value });
    await txDone(tx);
  }

  return {
    ready,
    isAvailable,

    getCards: () => getAll<TCard>(CARDS_STORE),
    setCards: (cards) => replaceAll(CARDS_STORE, cards),
    getColumns: () => getAll<Column>(COLUMNS_STORE),
    setColumns: (columns) => replaceAll(COLUMNS_STORE, columns),

    getQueue: () => getMeta<SyncQueueItem<TCard>[]>(QUEUE_KEY, []),

    async enqueue(item) {
      const queue = await getMeta<SyncQueueItem<TCard>[]>(QUEUE_KEY, []);
      const entry: SyncQueueItem<TCard> = {
        ...item,
        id: `sync_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      };
      const next = [...queue, entry];
      // Cap the queue: drop the oldest entries rather than refusing new
      // writes, so the most recent state is always what eventually syncs.
      const trimmed = next.length > MAX_QUEUE_SIZE ? next.slice(next.length - MAX_QUEUE_SIZE) : next;
      await setMeta(QUEUE_KEY, trimmed);
      return entry;
    },

    async dequeue(id) {
      const queue = await getMeta<SyncQueueItem<TCard>[]>(QUEUE_KEY, []);
      await setMeta(QUEUE_KEY, queue.filter((entry) => entry.id !== id));
    },

    async clearQueue() {
      await setMeta(QUEUE_KEY, []);
    },
  };
}
