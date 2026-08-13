import { useCallback, useMemo, useState } from 'react';
import type { BaseCard } from '../types';

export interface UseSearchOptions<TCard extends BaseCard> {
  /** Extra card fields (beyond `title`) to text-match against, e.g. ['description', 'company']. */
  searchFields?: (keyof TCard)[];
}

export interface UseSearchResult<TCard extends BaseCard> {
  query: string;
  setQuery: (query: string) => void;
  /** Restrict results to one column; null = all columns. */
  columnId: string | null;
  setColumnId: (columnId: string | null) => void;
  /**
   * Domain-specific predicate (status, priority, assignee, ...) — the core
   * library doesn't know your card's extra fields, so pass whatever
   * `(card) => boolean` check makes sense for it, e.g.
   * `setFilter((c) => c.priority === 'high')`.
   */
  setFilter: (predicate: ((card: TCard) => boolean) | null) => void;
  results: TCard[];
  resultCount: number;
  totalCount: number;
  /** True when a query, column filter, or custom filter is active. */
  isFiltering: boolean;
  clear: () => void;
}

function matchesQuery<TCard extends BaseCard>(card: TCard, query: string, fields: (keyof TCard)[]): boolean {
  if (!query) return true;
  const needle = query.toLowerCase();
  const haystacks: unknown[] = [card.title, ...fields.map((field) => card[field])];
  return haystacks.some((value) => {
    if (value == null) return false;
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return text.toLowerCase().includes(needle);
  });
}

/**
 * Real-time (no debounce — fine for the <500 card boards this library
 * targets) search + filter over a card list. Text search covers title plus
 * whatever `searchFields` you name; column and custom-predicate filters
 * compose with it via AND.
 */
export function useSearch<TCard extends BaseCard>(
  cards: TCard[],
  options: UseSearchOptions<TCard> = {},
): UseSearchResult<TCard> {
  const [query, setQuery] = useState('');
  const [columnId, setColumnId] = useState<string | null>(null);
  const [filter, setFilterState] = useState<((card: TCard) => boolean) | null>(null);
  const fields = options.searchFields ?? [];

  const setFilter = useCallback((predicate: ((card: TCard) => boolean) | null) => {
    // Store as a function-producing updater — React would otherwise treat a
    // plain function value as a lazy setState updater and call it.
    setFilterState(() => predicate);
  }, []);

  const results = useMemo(
    () =>
      cards.filter(
        (card) =>
          matchesQuery(card, query.trim(), fields) &&
          (columnId == null || card.columnId === columnId) &&
          (filter == null || filter(card)),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cards, query, columnId, filter],
  );

  const clear = useCallback(() => {
    setQuery('');
    setColumnId(null);
    setFilterState(null);
  }, []);

  return {
    query,
    setQuery,
    columnId,
    setColumnId,
    setFilter,
    results,
    resultCount: results.length,
    totalCount: cards.length,
    isFiltering: query.trim().length > 0 || columnId != null || filter != null,
    clear,
  };
}
