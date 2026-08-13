import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useSearch } from './useSearch';
import type { BaseCard } from '../types';

interface TaskCard extends BaseCard {
  description: string;
  priority: 'low' | 'high';
}

const now = '2026-01-01T00:00:00.000Z';

const cards: TaskCard[] = [
  { id: '1', title: 'Fix login bug', columnId: 'todo', order: 0, createdAt: now, updatedAt: now, description: 'Auth is broken', priority: 'high' },
  { id: '2', title: 'Write docs', columnId: 'doing', order: 0, createdAt: now, updatedAt: now, description: 'Update README', priority: 'low' },
  { id: '3', title: 'Deploy release', columnId: 'todo', order: 1, createdAt: now, updatedAt: now, description: 'Ship v1.0 login flow', priority: 'high' },
];

describe('useSearch', () => {
  it('matches by title (case-insensitive substring)', () => {
    const { result } = renderHook(() => useSearch(cards));
    act(() => result.current.setQuery('LOGIN'));
    expect(result.current.results.map((c) => c.id)).toEqual(['1']);
    expect(result.current.resultCount).toBe(1);
    expect(result.current.totalCount).toBe(3);
  });

  it('matches extra fields listed in searchFields', () => {
    const { result } = renderHook(() => useSearch(cards, { searchFields: ['description'] }));
    act(() => result.current.setQuery('login'));
    expect(result.current.results.map((c) => c.id).sort()).toEqual(['1', '3']);
  });

  it('filters by column', () => {
    const { result } = renderHook(() => useSearch(cards));
    act(() => result.current.setColumnId('todo'));
    expect(result.current.results.map((c) => c.id).sort()).toEqual(['1', '3']);
  });

  it('applies a custom domain filter (e.g. priority)', () => {
    const { result } = renderHook(() => useSearch(cards));
    act(() => result.current.setFilter((c) => c.priority === 'high'));
    expect(result.current.results.map((c) => c.id).sort()).toEqual(['1', '3']);
  });

  it('composes query + column + custom filter with AND', () => {
    const { result } = renderHook(() => useSearch(cards, { searchFields: ['description'] }));
    act(() => {
      result.current.setQuery('login');
      result.current.setColumnId('todo');
      result.current.setFilter((c) => c.priority === 'high');
    });
    expect(result.current.results.map((c) => c.id).sort()).toEqual(['1', '3']);
  });

  it('reports isFiltering and resets everything on clear()', () => {
    const { result } = renderHook(() => useSearch(cards));
    expect(result.current.isFiltering).toBe(false);

    act(() => result.current.setQuery('login'));
    expect(result.current.isFiltering).toBe(true);

    act(() => result.current.clear());
    expect(result.current.isFiltering).toBe(false);
    expect(result.current.results).toHaveLength(3);
  });
});
