# Sales pipeline (Kanban) integration

The board at `/dashboard/sales` is `@kanban/library` — the standalone project
in `kaban_cloud/` — consumed as a local file dependency.

## Setup — required before the app will build

The package's `main` points at `./dist-lib/`, which does not exist in a fresh
checkout. Build the library first:

```powershell
cd D:\panda_cloud\kaban_cloud
npm install
npm run build:lib

cd D:\panda_cloud
npm install
```

`npm install` in the app links `"@kanban/library": "file:./kaban_cloud"`.
Re-run `build:lib` whenever the library source changes — a file dependency
resolves to the built output, not to source.

## How the pieces fit

```
Kanban (library)
   ↑ DataAdapter<DealCard>
components/sales/salesAdapter.ts     ← the only place the two type systems meet
   ↑ api.sales
services/api.ts                      ← mock or http, per NEXT_PUBLIC_API_ADAPTER
```

| File | Role |
|---|---|
| `models/sales.ts` | `DealCard`, `DealColumn`, `DealCardPatch` |
| `services/contracts.ts` | `SalesService` — the port both adapters implement |
| `services/mock/salesFixtures.ts` | Seed deals, one per source |
| `components/sales/salesAdapter.ts` | Bridges `DataAdapter` → `api.sales` |
| `components/sales/SalesBoard.tsx` | Board config, filter, permissions |
| `components/sales/DealCardView.tsx` | `cardRender` |
| `components/sales/DealDetail.tsx` | `detailPanelRender` |
| `app/dashboard/sales/page.tsx` | Route, staff guard, `ssr: false` mount |

### Why not the library's own fetch adapter

`createFetchApiAdapter` would talk to the API directly and therefore bypass our
`services/http.ts` — losing the auth header, the 401 refresh-and-replay, the
timeout and the error normalisation. Routing through `api.sales` keeps one HTTP
path for the whole app, and keeps the mock/real swap working on this board too.

### Why `DealCard` is shaped the way it is

`DealCard` satisfies the library's `BaseCard` exactly (`id`, `title`,
`columnId`, `order`, `createdAt`, `updatedAt`). That is deliberate: the adapter
is a straight pass-through with no field mapping, because a mapping layer is
somewhere the two shapes drift apart without anyone noticing.

## Behaviour decisions

| Decision | Reason |
|---|---|
| No `createCard` in the adapter | Cards are created by the backend alongside the submission. The library hides the create affordance when the method is absent. |
| No `deleteCard` | A real customer's deal belongs in `lost`, not erased. Deleting destroys the audit trail. |
| Filter hides cards with CSS, not unmounting | Scroll position and any in-flight drag survive a filter change. |
| `canEditCard` / `canMoveCard` passed to the library | Gates the affordances. The backend must enforce the same rules independently. |

## Theming

The library styles itself from four CSS variables. They are mapped to our
tokens on `.kanban-scope` in `globals.css`:

| Variable | Token | Value |
|---|---|---|
| `--kanban-bg` | `base` | `17 19 24` |
| `--kanban-surface` | `card` | `30 32 36` |
| `--kanban-border` | `muted` | `51 53 57` |
| `--kanban-accent` | `accent` | `0 242 255` |

Values must be **bare `r g b` triplets** — the library composes them as
`rgb(var(--kanban-bg) / <alpha-value>)`, so hex or `rgb()` resolves to nothing
and the board renders unstyled.

### ⚠ Known risk: Tailwind preflight

`@kanban/library/styles.css` is compiled from the library's own Tailwind build.
If that build includes `@tailwind base`, importing it ships a **second CSS
reset** which will override our typography once the sales route loads.

It is imported inside `SalesBoard.tsx` rather than the root layout, so it only
loads on `/dashboard/sales` — but the effect is still global on that page.

If headings or spacing look wrong there, the fix is one line in
`kaban_cloud/tailwind.config.js`:

```js
corePlugins: { preflight: false },
```

then rebuild the library. A component library should not ship a global reset;
the host application already provides one.

## Access control

`User.role` was added for this: `customer` | `sales` | `admin`. A missing role
is treated as `customer` — an account is never staff by default.

Three layers, and only the third is real:

1. Sidebar hides the link for non-staff — cosmetic
2. `/dashboard/sales` renders an access notice for non-staff — cosmetic
3. **The backend rejects `/sales/*` for non-staff tokens — this is the control**

Layers 1 and 2 stop a customer stumbling into the page. Neither stops anyone
calling the API with a valid customer token, which is why § 9 of the API
contract states the server-side requirement in bold.

## Testing without a backend

With the default `.env.local` (`NEXT_PUBLIC_API_ADAPTER=mock`), the mock assigns
roles by email domain:

- `anything@cloudpanda.example` → `sales`, sees the board
- any other address → `customer`, sees the access notice

Five seed deals cover all five sources, so every badge and filter is exercised.
Drag-and-drop persists for the session (module-scoped array), and resets on
reload.
