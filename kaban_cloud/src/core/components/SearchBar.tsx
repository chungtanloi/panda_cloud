import { Search, X } from 'lucide-react';
import type { Column } from '../types';

export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
  totalCount: number;
  isFiltering: boolean;
  onClear: () => void;
  /** When provided, renders a column filter dropdown alongside the text input. */
  columns?: Column[];
  columnId?: string | null;
  onColumnChange?: (columnId: string | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Text + column filter bar for a board, driven by `useSearch`. Purely
 * presentational — all filtering logic lives in the hook, so this can be
 * swapped for a fully custom search UI without touching board state.
 */
export function SearchBar({
  query,
  onQueryChange,
  resultCount,
  totalCount,
  isFiltering,
  onClear,
  columns,
  columnId,
  onColumnChange,
  placeholder = 'Search cards…',
  className,
}: SearchBarProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 px-3 py-2 ${className ?? ''}`}>
      <div className="relative flex-1 min-w-[180px]">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-kanban-border py-1.5 pl-8 pr-7 text-sm text-gray-900 placeholder:text-gray-400"
          aria-label="Search cards"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear search text"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {columns && onColumnChange && (
        <select
          value={columnId ?? ''}
          onChange={(e) => onColumnChange(e.target.value || null)}
          className="rounded-md border border-kanban-border py-1.5 px-2 text-sm text-gray-700"
          aria-label="Filter by column"
        >
          <option value="">All columns</option>
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.title}
            </option>
          ))}
        </select>
      )}

      <span className="text-xs text-gray-400 whitespace-nowrap">
        {isFiltering ? `${resultCount} of ${totalCount} results found` : `${totalCount} cards`}
      </span>

      {isFiltering && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-md border border-kanban-border px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      )}
    </div>
  );
}
