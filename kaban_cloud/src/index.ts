// Public entry point of @kanban/library.
//
// Consuming projects import everything they need from here:
//
//   import { Kanban, useKanban, createFetchApiAdapter } from '@kanban/library';
//   import '@kanban/library/styles.css';
//
// and extend BaseCard / DataAdapter with their own domain types
// (see src/examples/sales-pipeline for a full reference implementation).

// --- Core: components, hooks, generic types -------------------------------
export {
  Kanban,
  Column,
  Card,
  DetailPanel,
  ErrorBoundary,
  ErrorToastContainer,
  SkeletonCard,
  SkeletonColumn,
  SearchBar,
  useKanban,
  useDragDrop,
  useDataSync,
  useErrorNotification,
  notifyError,
  notifyInfo,
  dismissToast,
  clearAllToasts,
  getErrorLog,
  clearErrorLog,
  useSearch,
  usePermissions,
  useOnline,
  useDelayedFlag,
  useRealtimeSync,
  retryAsync,
  classifyError,
  NetworkError,
  ValidationError,
  openKanbanDB,
  MAX_QUEUE_SIZE,
} from './core';
export type {
  KanbanProps,
  ColumnProps,
  CardProps,
  DetailPanelProps,
  ErrorBoundaryProps,
  ErrorToastContainerProps,
  SkeletonCardProps,
  SkeletonColumnProps,
  SearchBarProps,
  UseKanbanResult,
  UseDragDropOptions,
  UseDragDropResult,
  UseDataSyncOptions,
  UseDataSyncResult,
  ErrorToast,
  ErrorLogEntry,
  NotifyOptions,
  UseErrorNotificationResult,
  UseSearchOptions,
  UseSearchResult,
  PermissionCallbacks,
  UsePermissionsResult,
  UseRealtimeSyncOptions,
  RetryOptions,
  KanbanIndexedDB,
  SyncQueueItem,
  SyncQueueOp,
  BaseCard,
  ColumnType,
  DataAdapter,
  KanbanConfig,
  KanbanState,
  KanbanStatus,
  KanbanUser,
} from './core';

// --- Adapters: ready-made DataAdapter implementations ----------------------
export { createFetchApiAdapter } from './adapters/fetch-api';
export type { FetchApiAdapterOptions } from './adapters/fetch-api';
export { createSupabaseAdapter } from './adapters/supabase';
export type { SupabaseAdapterOptions, SupabaseClientLike } from './adapters/supabase';
export type { FieldMapping } from './adapters/types';
export { createOfflineAdapter } from './adapters/offline';
export type { OfflineAdapterOptions, OfflineDataAdapter } from './adapters/offline';
export { subscribeToCardChanges } from './adapters/supabase-realtime';
export type {
  RealtimeChannelLike,
  RealtimeClientLike,
  RealtimePayload,
  RealtimeEventType,
  CardChangeEvent,
  SubscribeToCardChangesOptions,
} from './adapters/supabase-realtime';
