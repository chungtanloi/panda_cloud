import { useCallback, useRef, useState } from 'react';

export interface UseDataSyncOptions<T> {
  /** Persists the change; rejecting rolls the optimistic update back. */
  onCommit: (value: T) => Promise<T | void>;
  /** Called when `onCommit` rejects, after the local state has been rolled back. */
  onError?: (error: Error, previous: T) => void;
}

export interface UseDataSyncResult<T> {
  value: T;
  /** Applies `next` immediately (optimistic), then persists it via `onCommit`. */
  mutate: (next: T) => Promise<void>;
  /** Replaces local state without persisting — for syncing in fetched data. */
  set: (next: T) => void;
  isSyncing: boolean;
  error: Error | null;
}

/**
 * Generic optimistic-update helper: update local state instantly, persist in
 * the background, and roll back automatically if persistence fails. Used by
 * useKanban for card moves/edits so the board never feels laggy.
 */
export function useDataSync<T>(initial: T, { onCommit, onError }: UseDataSyncOptions<T>): UseDataSyncResult<T> {
  const [value, setValue] = useState<T>(initial);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousRef = useRef<T>(initial);

  const set = useCallback((next: T) => {
    previousRef.current = next;
    setValue(next);
  }, []);

  const mutate = useCallback(
    async (next: T) => {
      const previous = value;
      previousRef.current = previous;
      setValue(next);
      setIsSyncing(true);
      setError(null);
      try {
        const committed = await onCommit(next);
        if (committed !== undefined) {
          setValue(committed);
        }
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setValue(previous);
        setError(normalized);
        onError?.(normalized, previous);
      } finally {
        setIsSyncing(false);
      }
    },
    [value, onCommit, onError],
  );

  return { value, mutate, set, isSyncing, error };
}
