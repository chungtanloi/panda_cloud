import { describe, expect, it } from 'vitest';
import { MAX_QUEUE_SIZE, openKanbanDB } from './indexeddb';
import type { BaseCard } from '../types';

interface TestCard extends BaseCard {}

const now = '2026-01-01T00:00:00.000Z';

function makeCard(id: string): TestCard {
  return { id, title: `Card ${id}`, columnId: 'todo', order: 0, createdAt: now, updatedAt: now };
}

describe('openKanbanDB', () => {
  it('round-trips cards and columns', async () => {
    const db = openKanbanDB<TestCard>(`test-db-${Math.random()}`);
    await db.ready;

    await db.setCards([makeCard('1'), makeCard('2')]);
    const cards = await db.getCards();
    expect(cards.map((c) => c.id).sort()).toEqual(['1', '2']);

    await db.setColumns([{ id: 'todo', title: 'Todo', order: 0 }]);
    const columns = await db.getColumns();
    expect(columns).toEqual([{ id: 'todo', title: 'Todo', order: 0 }]);
  });

  it('setCards replaces the previous contents entirely', async () => {
    const db = openKanbanDB<TestCard>(`test-db-${Math.random()}`);
    await db.setCards([makeCard('1'), makeCard('2')]);
    await db.setCards([makeCard('3')]);
    const cards = await db.getCards();
    expect(cards.map((c) => c.id)).toEqual(['3']);
  });

  it('enqueues and dequeues sync items in order', async () => {
    const db = openKanbanDB<TestCard>(`test-db-${Math.random()}`);
    const a = await db.enqueue({ op: 'move', cardId: '1', columnId: 'done' });
    await db.enqueue({ op: 'update', cardId: '2', patch: { title: 'x' } });

    let queue = await db.getQueue();
    expect(queue).toHaveLength(2);
    expect(queue[0].op).toBe('move');

    await db.dequeue(a.id);
    queue = await db.getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].op).toBe('update');
  });

  it('caps the queue at MAX_QUEUE_SIZE, dropping the oldest entries (FIFO)', async () => {
    const db = openKanbanDB<TestCard>(`test-db-${Math.random()}`);
    for (let i = 0; i < MAX_QUEUE_SIZE + 10; i++) {
      await db.enqueue({ op: 'update', cardId: String(i), patch: { title: String(i) } });
    }
    const queue = await db.getQueue();
    expect(queue).toHaveLength(MAX_QUEUE_SIZE);
    // The oldest 10 (cardId '0'..'9') should have been dropped; the newest should remain.
    expect(queue[0].cardId).toBe('10');
    expect(queue[queue.length - 1].cardId).toBe(String(MAX_QUEUE_SIZE + 9));
  });

  it('clearQueue empties the queue', async () => {
    const db = openKanbanDB<TestCard>(`test-db-${Math.random()}`);
    await db.enqueue({ op: 'delete', cardId: '1' });
    await db.clearQueue();
    expect(await db.getQueue()).toHaveLength(0);
  });
});
