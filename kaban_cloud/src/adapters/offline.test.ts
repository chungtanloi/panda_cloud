import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createOfflineAdapter } from './offline';
import type { BaseCard, DataAdapter } from '../core/types';

interface TestCard extends BaseCard {}

const now = '2026-01-01T00:00:00.000Z';

function makeCard(overrides: Partial<TestCard> = {}): TestCard {
  return { id: '1', title: 'Card', columnId: 'todo', order: 0, createdAt: now, updatedAt: now, ...overrides };
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

beforeEach(() => setOnline(true));
afterEach(() => setOnline(true));

describe('createOfflineAdapter', () => {
  it('caches fetched cards to IndexedDB, then serves them offline when the inner adapter fails', async () => {
    const inner: DataAdapter<TestCard> = {
      fetchColumns: vi.fn().mockResolvedValue([{ id: 'todo', title: 'Todo', order: 0 }]),
      fetchCards: vi.fn().mockResolvedValueOnce([makeCard()]).mockRejectedValueOnce(new Error('offline')),
      updateCard: vi.fn(),
      moveCard: vi.fn(),
    };
    const adapter = createOfflineAdapter(inner, { dbName: `offline-${Math.random()}` });

    const online = await adapter.fetchCards();
    expect(online).toHaveLength(1);

    setOnline(false);
    const offline = await adapter.fetchCards();
    expect(offline).toHaveLength(1);
    expect(offline[0].id).toBe('1');
  });

  it('queues a moveCard made while offline and applies it locally', async () => {
    const inner: DataAdapter<TestCard> = {
      fetchColumns: vi.fn().mockResolvedValue([]),
      fetchCards: vi.fn().mockResolvedValue([makeCard()]),
      updateCard: vi.fn(),
      moveCard: vi.fn(),
    };
    const adapter = createOfflineAdapter(inner, { dbName: `offline-${Math.random()}` });
    await adapter.fetchCards(); // seed the cache

    setOnline(false);
    const moved = await adapter.moveCard('1', 'done', 0);

    expect(moved.columnId).toBe('done');
    expect(inner.moveCard).not.toHaveBeenCalled();
    expect(await adapter.getQueueSize()).toBe(1);
  });

  it('syncs the queue against the inner adapter once back online', async () => {
    const inner: DataAdapter<TestCard> = {
      fetchColumns: vi.fn().mockResolvedValue([]),
      fetchCards: vi.fn().mockResolvedValue([makeCard()]),
      updateCard: vi.fn(),
      moveCard: vi.fn().mockResolvedValue(makeCard({ columnId: 'done' })),
    };
    const adapter = createOfflineAdapter(inner, { dbName: `offline-${Math.random()}` });
    await adapter.fetchCards();

    setOnline(false);
    await adapter.moveCard('1', 'done', 0);
    expect(await adapter.getQueueSize()).toBe(1);

    setOnline(true);
    await adapter.sync();

    expect(inner.moveCard).toHaveBeenCalledWith('1', 'done', 0);
    expect(await adapter.getQueueSize()).toBe(0);
  });
});
