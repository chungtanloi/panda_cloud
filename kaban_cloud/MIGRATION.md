# Migrating to v1.0

v1.0 is additive: every new prop, hook, and adapter option has a backward-compatible
default, so an existing `v0.1.0` integration keeps working unchanged after the
upgrade. That said, two behavior changes are worth reviewing before you deploy.

## 1. Adapters now retry transient failures by default

`createFetchApiAdapter` and `createSupabaseAdapter` wrap every call in
`retryAsync` (3 retries, 1s → 2s → 4s backoff) unless you opt out. In practice
this means:

- A request that used to fail instantly on a flaky connection now takes up to
  ~7s longer before the failure surfaces (3 retries: 1s + 2s + 4s ≈ 7s).
- Genuine 4xx errors (bad request, validation) are classified as
  `ValidationError` and still fail immediately — only network drops, 408, 429,
  and 5xx responses are retried.

If your app already has its own retry/timeout layer, disable the adapter's:

```ts
const adapter = createFetchApiAdapter({
  baseUrl: 'https://api.example.com',
  retry: false, // or { maxRetries: 1 } to tune it down
});
```

## 2. `<Kanban />` renders a search bar and offline banner by default

Once a board has cards, `<Kanban />` now shows a search bar above the columns
and (when the browser goes offline) a banner below it. If your layout doesn't
have room for the extra ~40px, either:

```tsx
<Kanban columns={columns} adapter={adapter} hideSearch />
```

or wrap `<Kanban />` in your own fixed-height container — the board fills its
parent, so the extra chrome doesn't change the total space it occupies, just
what's inside it.

## New capabilities (opt-in, zero migration required)

These are new props/hooks you can adopt incrementally — nothing about your
existing adapter or board breaks if you ignore them:

| Feature | How to adopt |
|---|---|
| Permissions | Pass `user`, `canEditCard`, `canMoveCard`, `canDeleteCard`, `canCreateCard` to `<Kanban />`. Omit any of them to keep that action unrestricted. |
| Offline support | Wrap your existing adapter: `createOfflineAdapter(createSupabaseAdapter(...))`. |
| Real-time sync | Call `useRealtimeSync(supabaseClient, 'cards', (event) => { ... })` alongside `useKanban`, wiring `mergeRemoteCard`/`removeRemoteCard`. |
| Custom error handling | Mount `<ErrorToastContainer />` (done for you inside `<Kanban />`) or call `useErrorNotification()` / `notifyError()` yourself for custom UI. |
| Lazy card detail | Add `fetchCardDetail(id)` to your `DataAdapter` — the DetailPanel picks it up automatically and shows a loading state. |

## TypeScript

If you extend `KanbanConfig`/`KanbanProps` directly (rather than just
rendering `<Kanban<TCard> />`), note it's now `KanbanConfig<TCard, TUser =
KanbanUser>` — a second, defaulted type parameter. Existing single-argument
usage compiles unchanged.
