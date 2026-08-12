# Cloud Panda — Frontend

Next.js 14 (App Router) + TypeScript + Tailwind CSS, built to the Figma file
`pCxGT1lfFqO2CiDXEmrTk7`.

Runs standalone against a mock adapter, so no backend is required to develop.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000/login. With the default `.env.local` the app uses the
mock adapter — any email plus a password of 8+ characters logs in.

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

## Architecture

The project follows an MVC separation adapted to React:

```
src/
├── models/        MODEL       Domain types + request/response interfaces.
│                              No logic, no imports from components.
├── services/      DATA ACCESS The only place that talks to the network.
│   ├── contracts.ts           The API "port" — interfaces both adapters implement.
│   ├── endpoints.ts           Every backend path, in one file.
│   ├── config.ts              The only reader of environment variables.
│   ├── http.ts                fetch client: auth header, timeout, refresh, errors.
│   ├── tokenStore.ts          Token persistence, swappable for cookies.
│   ├── http-impl/             Real backend adapter.
│   ├── mock/                  Standalone adapter, identical interface.
│   └── api.ts                 Picks an adapter from env. Import this.
├── controllers/   CONTROLLER  Business logic as hooks/context.
│                              useAsync, useForm, useWizard, AuthContext.
├── components/    VIEW        Presentational only. No fetch, no env access.
│   ├── ui/                    Primitives built to Figma measurements.
│   ├── layout/                Nav, footer, ambient background.
│   └── wizard/                Shared multi-step frame.
├── app/           VIEW        Routing. Pages compose controllers + components.
└── lib/                       Framework-free helpers (cn, validation).
```

### The rules that keep it maintainable

1. **No component calls `fetch`.** All I/O goes through `services/api.ts`.
2. **No hard-coded API URL.** Paths live in `services/endpoints.ts`; the host
   comes from `NEXT_PUBLIC_API_BASE_URL`.
3. **`process.env` is read in exactly one file** — `services/config.ts`.
4. **Views never see a thrown error.** Controllers return
   `AsyncState<T>` (`idle | loading | success | error`), so loading, error and
   empty states are handled uniformly.
5. **Anything added to `ApiClient` must be implemented by both adapters**, or the
   mock/real swap stops being transparent. TypeScript enforces this.

## Connecting the real backend

The backend team implements [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). Then:

```dotenv
NEXT_PUBLIC_API_ADAPTER=http
NEXT_PUBLIC_API_BASE_URL=https://api.cloudpanda.example/v1
```

That is the entire migration. No UI or business-logic file changes, because
nothing outside `services/` knows which adapter is active.

If the backend's response shape differs from the contract, adapt it in
`services/http-impl/` — that is the designated translation layer. Do not reshape
data inside components.

## Design tokens

Colours, type scale, radii, spacing and effects are taken verbatim from Figma
and declared once:

- CSS variables — `src/app/globals.css`
- Tailwind aliases — `tailwind.config.ts`

Use the aliases (`bg-surface`, `text-ink-dim`, `rounded-card`) rather than raw
hex. If a value is missing, read it off the Figma node rather than guessing.

Key tokens:

| Token | Value | Use |
|---|---|---|
| `base` | `#111318` | Page background |
| `deep` | `#0c0e12` | Input wells |
| `surface` | `rgba(26,26,26,.8)` | Glass cards |
| `accent` | `#00f2ff` | Primary actions, active states |
| `accent-fg` | `#002022` | Text on accent |
| `ink` / `ink-dim` / `ink-faint` | `#e2e2e8` / `#b9cacb` / `#3a494b` | Text ramp |
| `rounded-card` / `panel` / `field` | 48 / 32 / 16px | Radii |

Fonts: **Geist** for auth and UI chrome; **Tinos** for display type (metric-
compatible with the Liberation Serif used in the Figma file).

## Build status

See [`docs/FIGMA_SCREEN_MAP.md`](docs/FIGMA_SCREEN_MAP.md) for the node-by-node
map of all 35 screens and what has been built so far.
