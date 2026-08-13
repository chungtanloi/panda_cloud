import { useSyncExternalStore } from 'react';

export interface ErrorToast {
  id: string;
  message: string;
  /** Present when the failed action can be retried; the toast renders a "Retry" button that calls this. */
  retry?: () => void | Promise<void>;
  createdAt: number;
  /** 'error' (default) renders a warning-styled toast; 'info' is used for non-error notices like realtime collaboration updates. */
  type: 'error' | 'info';
}

export interface ErrorLogEntry {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
}

const AUTO_DISMISS_MS = 5000;
const MAX_LOG_ENTRIES = 200;
const LOG_STORAGE_KEY = 'kanban:error-log';

let toasts: ErrorToast[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ErrorToast[] {
  return toasts;
}

function getServerSnapshot(): ErrorToast[] {
  return [];
}

function readStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    // localStorage can throw in locked-down environments (private browsing, SSR polyfills).
    return null;
  }
}

function appendToLog(entry: ErrorLogEntry): void {
  const storage = readStorage();
  if (!storage) return;
  try {
    const raw = storage.getItem(LOG_STORAGE_KEY);
    const existing: ErrorLogEntry[] = raw ? JSON.parse(raw) : [];
    const next = [...existing, entry].slice(-MAX_LOG_ENTRIES);
    storage.setItem(LOG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort persistence; never let logging failures break the app.
  }
}

/** Reads the persisted error log for debugging (e.g. a support/bug-report panel). */
export function getErrorLog(): ErrorLogEntry[] {
  const storage = readStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LOG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ErrorLogEntry[]) : [];
  } catch {
    return [];
  }
}

export function clearErrorLog(): void {
  readStorage()?.removeItem(LOG_STORAGE_KEY);
}

function makeId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface NotifyOptions {
  retry?: () => void | Promise<void>;
  error?: unknown;
}

function pushToast(message: string, type: ErrorToast['type'], options: NotifyOptions = {}): string {
  const id = makeId();
  toasts = [...toasts, { id, message, retry: options.retry, createdAt: Date.now(), type }];
  emit();

  const timer = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
  timers.set(id, timer);

  const err = options.error;
  appendToLog({
    id,
    message,
    stack: err instanceof Error ? err.stack : undefined,
    timestamp: Date.now(),
  });

  return id;
}

/**
 * Pushes an error toast notification and appends to the persisted error
 * log. Safe to call from anywhere (hooks, adapters, event handlers) — not
 * just inside a React component — so `useKanban` can call it directly on a
 * failed move.
 */
export function notifyError(message: string, options: NotifyOptions = {}): string {
  return pushToast(message, 'error', options);
}

/** Same as `notifyError` but styled as a neutral notice — used for realtime collaboration updates ("Jane updated this card"). */
export function notifyInfo(message: string, options: NotifyOptions = {}): string {
  return pushToast(message, 'info', options);
}

export function dismissToast(id: string): void {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  if (!toasts.some((t) => t.id === id)) return;
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function clearAllToasts(): void {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  toasts = [];
  emit();
}

export interface UseErrorNotificationResult {
  toasts: ErrorToast[];
  notify: typeof notifyError;
  dismiss: typeof dismissToast;
  retry: (id: string) => void;
}

/**
 * Subscribes a component to the shared toast list. Render a
 * `<ErrorToastContainer />` (or your own UI driven by `toasts`) once near
 * the root; any code anywhere can push a toast via the standalone
 * `notifyError` export without needing this hook or a provider.
 */
export function useErrorNotification(): UseErrorNotificationResult {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    toasts: list,
    notify: notifyError,
    dismiss: dismissToast,
    retry: (id: string) => {
      const toast = toasts.find((t) => t.id === id);
      dismissToast(id);
      void toast?.retry?.();
    },
  };
}
