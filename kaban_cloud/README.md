# @kanban/library

Reusable, headless-friendly Kanban board for React. Built once, extended per project —
Sales Pipeline, Task Management, Roadmap, HR, or anything else column-and-card shaped.

**v1.0.0** — production-ready: resilient networking, optimistic updates, permissions,
offline support, and real-time collaboration on top of the drag-and-drop core.
See [`CHANGELOG.md`](./CHANGELOG.md) for the full list and [`MIGRATION.md`](./MIGRATION.md)
if you're upgrading from `0.1.0`.

## Why

`<Kanban />` ships drag-and-drop, column layout, search, permissions, and a card detail
panel out of the box, but knows nothing about *your* domain. You extend `BaseCard` with
your own fields, implement a `DataAdapter` (or use one of the built-in ones), and
optionally override card/detail rendering — the drag-and-drop and state logic stay
untouched.

## Install

```bash
npm install @kanban/library @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react react react-dom
```

## Quick start

```tsx
import { Kanban, type BaseCard, type DataAdapter } from '@kanban/library';
import '@kanban/library/styles.css';

interface TaskCard extends BaseCard {
  assignee: string;
  priority: 'low' | 'medium' | 'high';
}

const columns = [
  { id: 'todo', title: 'To Do', order: 0 },
  { id: 'doing', title: 'In Progress', order: 1 },
  { id: 'done', title: 'Done', order: 2 },
];

const adapter: DataAdapter<TaskCard> = {
  fetchColumns: async () => columns,
  fetchCards: async () => myApi.listTasks(),
  updateCard: (id, patch) => myApi.updateTask(id, patch),
  moveCard: (id, columnId, order) => myApi.moveTask(id, columnId, order),
};

export function TaskBoard() {
  return <Kanban<TaskCard> columns={columns} adapter={adapter} />;
}
```

See `src/examples/sales-pipeline/` for a full reference implementation: a domain type
(`SalesCard`), an in-memory adapter, custom card/detail rendering, and a live demo of
the permissions system (toggle "Sales rep" vs "Admin").

## Project structure

```
src/
├── core/
│   ├── components/    # Kanban, Column, Card, DetailPanel, ErrorBoundary,
│   │                  # ErrorToastContainer, SkeletonCard/Column, SearchBar
│   ├── hooks/         # useKanban, useDragDrop, useDataSync, useSearch,
│   │                  # usePermissions, useErrorNotification, useOnline,
│   │                  # useRealtimeSync, useDelayedFlag
│   ├── db/            # openKanbanDB — IndexedDB cache + offline sync queue
│   ├── utils/         # retryAsync + error classification
│   └── types/         # BaseCard, Column, DataAdapter, KanbanConfig, KanbanUser
├── adapters/
│   ├── fetch-api.ts          # Generic REST adapter (retries by default)
│   ├── supabase.ts           # Supabase Postgres adapter (retries by default)
│   ├── offline.ts            # createOfflineAdapter — wraps any adapter with IndexedDB + sync queue
│   └── supabase-realtime.ts  # subscribeToCardChanges — Supabase Realtime subscription
├── examples/
│   └── sales-pipeline/    # Reference implementation extending the core types
└── index.ts                # Public package export
```

## Extending

1. **Extend `BaseCard`** with your domain fields.
2. **Implement `DataAdapter<YourCard>`**, or wrap `createFetchApiAdapter` /
   `createSupabaseAdapter` if your backend fits their conventions.
3. **Customize rendering** via `cardRender`, `columnHeaderRender`, and
   `detailPanelRender` on `<Kanban />` — no need to fork components.
4. Need fully custom UI (not just `<Kanban />`)? Build on `useKanban` +
   `useDragDrop` directly; they hold all the state/drag logic independent of
   the default components.

## v1.0 features

### Error handling & resilience

Every adapter call retries transient failures automatically with exponential
backoff (1s → 2s → 4s), and every board mutation is optimistic with automatic
rollback + a toast (with a "Retry" button) on failure:

```ts
import { retryAsync, NetworkError, ValidationError } from '@kanban/library';

await retryAsync(() => myApi.call(), { maxRetries: 3, baseDelay: 1000 });
// NetworkError (network drop, 5xx, 408/429) -> retried
// ValidationError (4xx)                     -> thrown immediately, no retry
```

Wrap the board (or your own tree) once with `<ErrorBoundary>` — `<Kanban />`
already does this for you — and mount `<ErrorToastContainer />` (also automatic
inside `<Kanban />`) to surface failures instead of failing silently:

```tsx
import { ErrorBoundary, ErrorToastContainer, useErrorNotification, getErrorLog } from '@kanban/library';

function App() {
  return (
    <ErrorBoundary fallback={(error, reset) => <CustomErrorPage error={error} onRetry={reset} />}>
      <MyCustomBoard />
      <ErrorToastContainer />
    </ErrorBoundary>
  );
}

// Anywhere: getErrorLog() returns the last 200 notifications for a bug report / support panel.
```

### Loading & feedback

`<Kanban />` shows `<SkeletonColumn />` (3–5 `<SkeletonCard />` each) during the
initial fetch, and the DetailPanel shows a spinner only if a fetch/save takes
more than 2 seconds — most operations resolve instantly and never flash a
spinner. Add a lazy detail fetch for heavier records:

```ts
const adapter: DataAdapter<TaskCard> = {
  // ...
  fetchCardDetail: (id) => myApi.getFullTask(id), // DetailPanel shows "Loading…" while this resolves
};
```

### Search & filtering

Built into `<Kanban />` automatically once cards are loaded (pass `hideSearch`
to opt out), or use the hook directly for a custom layout:

```tsx
import { useSearch, SearchBar } from '@kanban/library';

const search = useSearch(cards, { searchFields: ['description', 'assignee'] });
search.setColumnId('doing');
search.setFilter((card) => card.priority === 'high');

<SearchBar {...search} onQueryChange={search.setQuery} onClear={search.clear} />;
// "12 of 48 results found"
```

### Permissions

```tsx
<Kanban<TaskCard, AppUser>
  columns={columns}
  adapter={adapter}
  user={currentUser}
  canMoveCard={(card, toColumnId, user) => user.role === 'admin' || card.assignee === user.id}
  canEditCard={(card, user) => user.role === 'admin' || card.assignee === user.id}
  canDeleteCard={(card, user) => user.role === 'admin'}
/>
```

Disallowed cards can't be dragged; a drop that turns out disallowed (checked
again against the actual target column) is rejected with a toast instead of
persisting. The DetailPanel shows a "Read-only" badge and disables its form
when `canEditCard` is false.

### Offline support

```ts
import { createOfflineAdapter, createSupabaseAdapter } from '@kanban/library';

const adapter = createOfflineAdapter(
  createSupabaseAdapter({ client: supabase, columnsTable: 'columns', cardsTable: 'cards' }),
);
// Online:  fetchCards() -> Supabase -> cached to IndexedDB -> returned
// Offline: fetchCards() -> Supabase fails -> served from IndexedDB
// moveCard() offline -> IndexedDB updated immediately + queued (max 100 changes, FIFO)
// Back online -> queue replays automatically (last-write-wins)
```

`<Kanban />` shows an "Offline mode" banner automatically via `useOnline()`.

### Real-time collaboration

```tsx
import { useKanban, useRealtimeSync } from '@kanban/library';

function LiveBoard({ adapter, supabase }: Props) {
  const kanban = useKanban<TaskCard>(adapter, columns);

  useRealtimeSync(supabase, 'cards', (event) => {
    if (event.type === 'DELETE') kanban.removeRemoteCard(event.card.id);
    else kanban.mergeRemoteCard(event.card);
  }, {
    getActorName: (card) => card.lastEditedBy, // -> "Jane updated this card" toast
  });

  // ...render using kanban.cardsByColumn
}
```

Unsubscribes automatically on unmount. Concurrent edits resolve last-write-wins
by `updatedAt`; a card with a local optimistic update in flight ignores
incoming remote events for that same card until the local write settles.

## Scripts

```bash
npm run dev        # Preview the Sales Pipeline example
npm run build      # Typecheck + build the library (dist/, with .d.ts)
npm run typecheck
npm run lint
npm test           # Run the unit test suite (vitest)
npm run test:watch
```

## Theming

Card/column colors read from CSS variables (`--kanban-bg`, `--kanban-surface`,
`--kanban-border`, `--kanban-accent`) defined in `src/styles.css`, with a `.dark`
override. Redefine them in your app to reskin the board without touching component code.
