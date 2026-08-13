# Changelog

All notable changes to `@kanban/library` are documented here.

## [1.0.0] — 2026-08-11

First production-ready release. Adds the 8 critical features needed to take
the board from a 70%-complete core to something safe to launch behind real
users and a real backend.

### Added — Error handling & resilience

- **Retry with exponential backoff** (`src/core/utils/retry.ts`): `retryAsync()`
  retries transient failures (`NetworkError`) with 1s → 2s → 4s backoff (configurable,
  capped by `maxDelay`), and gives up immediately on permanent failures
  (`ValidationError`). Wired into `createFetchApiAdapter` and `createSupabaseAdapter`
  by default (opt out with `{ retry: false }`).
- **Optimistic updates, hardened** (`useKanban`): `moveCard`/`updateCard`/`createCard`/
  `deleteCard` all apply instantly, roll back automatically on failure, and now
  guard against duplicate in-flight moves per card via `pendingCardIds`.
- **Error boundary + toast notifications**: `<ErrorBoundary>` (wraps `<Kanban />`
  automatically) catches render errors without taking down the whole board;
  `useErrorNotification` / `notifyError` / `<ErrorToastContainer />` show every
  failure as a dismissible toast with a "Retry" button, auto-clearing after 5s.
  Every notification is also appended to a persisted error log
  (`getErrorLog()` / `clearErrorLog()`, capped at 200 entries) for debugging.

### Added — Loading & feedback

- **Loading skeletons**: `<SkeletonCard />` / `<SkeletonColumn />` (3–5 pulsing
  cards per column) replace the old "Loading board…" text on first fetch.
- **DetailPanel loading states**: shows a spinner only if a fetch takes
  >2s (`useDelayedFlag`, avoids spinner flicker on fast responses), disables
  the form and Close button while a save is in flight, and supports an
  optional lazy `adapter.fetchCardDetail(id)` for heavier per-card records.

### Added — Search & filtering

- `useSearch()` + `<SearchBar />`: real-time (no debounce) text search over
  `title` plus any `searchFields` you name, a column filter, and a
  domain-specific custom predicate (`setFilter((card) => card.priority === 'high')`).
  Shown automatically inside `<Kanban />` once cards are loaded; pass `hideSearch`
  to opt out.

### Added — Permissions & security

- `usePermissions()` + four new `<Kanban />` props — `canCreateCard`,
  `canEditCard`, `canMoveCard`, `canDeleteCard` — each `(card, user) => boolean`
  (all default to "allow" for backward compatibility). Enforced at both the
  drag layer (disabled cards can't be picked up; an in-flight drop that turns
  out to be disallowed is rejected with a toast) and the DetailPanel (form
  disables + shows a "Read-only" badge when `canEditCard` is false; a Delete
  button appears only when `canDeleteCard` is true).

### Added — Offline support

- `openKanbanDB()` (`src/core/db/indexeddb.ts`): a small promise-based
  IndexedDB wrapper caching cards/columns and holding an offline write queue
  (capped at 100 entries, FIFO eviction).
- `createOfflineAdapter(inner)` (`src/adapters/offline.ts`): wraps any
  `DataAdapter`. Online reads cache to IndexedDB; offline reads fall back to
  the cache. Writes made offline apply to the cache immediately and queue for
  sync; the queue flushes automatically on the browser's `online` event
  (last-write-wins on conflicts).
- `useOnline()`: reactive `navigator.onLine` — `<Kanban />` shows an "Offline
  mode" banner automatically when it flips.

### Added — Real-time collaboration

- `subscribeToCardChanges()` (`src/adapters/supabase-realtime.ts`) and
  `useRealtimeSync()` (`src/core/hooks/useRealtimeSync.ts`): subscribe to
  Supabase Postgres change events on a table, with automatic unsubscribe on
  unmount. `useKanban` gained `mergeRemoteCard()` / `removeRemoteCard()` for
  wiring incoming events into board state (last-write-wins by `updatedAt`,
  and in-flight local optimistic updates are never clobbered mid-flight).
  `getActorName` support surfaces "Jane updated this card"-style toasts via
  `notifyInfo`.

### Changed

- `KanbanConfig`/`<Kanban />` are now generic over an optional `TUser` type
  parameter (`KanbanUser`), defaulting to a minimal `{ id, role?, ... }`
  shape — existing single-generic usage (`Kanban<TCard>`) is unaffected.
- `DataAdapter` gained an optional `fetchCardDetail?(id)` method.
- `createFetchApiAdapter` / `createSupabaseAdapter` retry transient failures
  by default (see Migration notes below).
- Package version bumped to `1.0.0`.

### Migration

See [`MIGRATION.md`](./MIGRATION.md).
