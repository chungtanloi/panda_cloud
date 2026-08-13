import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useKanban } from './useKanban';
import { clearAllToasts, getErrorLog, clearErrorLog } from './useErrorNotification';
import type { BaseCard, DataAdapter } from '../types';

interface TestCard extends BaseCard {}

function makeCard(overrides: Partial<TestCard> = {}): TestCard {
  return {
    id: 'card-1',
    title: 'Card 1',
    columnId: 'todo',
    order: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeAdapter(overrides: Partial<DataAdapter<TestCard>> = {}): DataAdapter<TestCard> {
  return {
    fetchColumns: vi.fn().mockResolvedValue([{ id: 'todo', title: 'Todo', order: 0 }]),
    fetchCards: vi.fn().mockResolvedValue([makeCard()]),
    updateCard: vi.fn().mockImplementation(async (id, patch) => ({ ...makeCard(), ...patch, id })),
    moveCard: vi.fn().mockImplementation(async (id, columnId, order) => ({ ...makeCard(), id, columnId, order })),
    ...overrides,
  };
}

beforeEach(() => {
  clearAllToasts();
  clearErrorLog();
});

describe('useKanban - moveCard', () => {
  it('applies the move optimistically, then reconciles with the adapter result', async () => {
    const adapter = makeAdapter();
    const { result } = renderHook(() => useKanban<TestCard>(adapter));

    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.moveCard('card-1', 'done', 2);
    });

    expect(adapter.moveCard).toHaveBeenCalledWith('card-1', 'done', 2);
    expect(result.current.cards[0].columnId).toBe('done');
    expect(result.current.cards[0].order).toBe(2);
  });

  it('rolls back to the previous state and notifies on failure', async () => {
    const adapter = makeAdapter({
      moveCard: vi.fn().mockRejectedValue(new Error('network down')),
    });
    const { result } = renderHook(() => useKanban<TestCard>(adapter));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    const originalColumnId = result.current.cards[0].columnId;

    await act(async () => {
      await result.current.moveCard('card-1', 'done');
    });

    expect(result.current.cards[0].columnId).toBe(originalColumnId);
    expect(result.current.error?.message).toBe('network down');

    const log = getErrorLog();
    expect(log.some((entry) => entry.message.includes('Failed to move'))).toBe(true);
  });

  it('drops a second move for the same card while the first is still pending', async () => {
    let resolveMove: (value: TestCard) => void = () => {};
    const movePromise = new Promise<TestCard>((resolve) => {
      resolveMove = resolve;
    });
    const moveCard = vi.fn().mockReturnValue(movePromise);
    const adapter = makeAdapter({ moveCard });
    const { result } = renderHook(() => useKanban<TestCard>(adapter));

    await waitFor(() => expect(result.current.status).toBe('ready'));

    let firstCall!: Promise<void>;
    act(() => {
      firstCall = result.current.moveCard('card-1', 'doing');
    });
    expect(result.current.pendingCardIds.has('card-1')).toBe(true);

    // Second call while the first is still in flight should be a no-op.
    await act(async () => {
      await result.current.moveCard('card-1', 'done');
    });
    expect(moveCard).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveMove({ ...makeCard(), id: 'card-1', columnId: 'doing', order: 0 });
      await firstCall;
    });

    expect(result.current.cards[0].columnId).toBe('doing');
    expect(result.current.pendingCardIds.has('card-1')).toBe(false);
  });
});

describe('useKanban - mergeRemoteCard / removeRemoteCard', () => {
  it('merges a newer remote card and ignores a stale one', async () => {
    const adapter = makeAdapter();
    const { result } = renderHook(() => useKanban<TestCard>(adapter));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => {
      result.current.mergeRemoteCard({ ...makeCard(), title: 'Newer title', updatedAt: '2026-06-01T00:00:00.000Z' });
    });
    expect(result.current.cards[0].title).toBe('Newer title');

    act(() => {
      result.current.mergeRemoteCard({ ...makeCard(), title: 'Stale title', updatedAt: '2020-01-01T00:00:00.000Z' });
    });
    // Stale write (older updatedAt) must not clobber the newer local value.
    expect(result.current.cards[0].title).toBe('Newer title');
  });

  it('removes a card on a remote delete event', async () => {
    const adapter = makeAdapter();
    const { result } = renderHook(() => useKanban<TestCard>(adapter));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => {
      result.current.removeRemoteCard('card-1');
    });
    expect(result.current.cards).toHaveLength(0);
  });
});
