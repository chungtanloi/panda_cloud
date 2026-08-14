# Cloud Panda Frontend Handoff

| Item | Value |
|---|---|
| Date | 2026-08-14 (Clerk migration) · 2026-08-13 (original audit) |
| Repository audited | `D:\Project\panda_cloud` |
| Branch | `main` |
| HEAD at original audit | `3c127eb239f33f09d3d48bb5bd68c159166a8c44` |
| Remote state at original audit | `HEAD`, `origin/main`, and `origin/HEAD` pointed to the same commit |

## 0. 2026-08-14 — Clerk authentication migration (CR-003)

Driven by `PandaCloudBackend/docs/collaboration/PHASE_1_FRONTEND_AUTH_HANDOFF.md`
("Required frontend migration") and CR-003 in `docs/CONTRACT_CONFORMANCE.md`.
The full pre-implementation analysis, route protection table, customer/staff
matrix and the 14 open questions are in **`docs/CLERK_AUTH_DESIGN.md`** — read
that before touching auth.

### What changed

- Clerk owns sign-in, sign-up, session, refresh, MFA and sign-out. PandaCloud
  issues, stores and refreshes **no token**.
- `services/tokenStore.ts` is **deleted**; the localStorage access/refresh pair
  and the `POST /auth/refresh` retry-and-replay in `services/http.ts` are gone.
- The bearer is the current Clerk session token from `getToken()` with **no**
  custom JWT template, minted through the new `services/session.ts` bridge.
- `AuthContext` no longer performs authentication. It consumes an injected
  `SessionState` and loads the PandaCloud profile from `GET /api/v1/auth/me`.
- Roles now come from `authorization.memberships[].role` in canonical
  `lower_snake_case` (`sales | compliance | legal | technical | manager | admin
  | customer`). The `USER | SALES | MANAGER | ADMIN` union is gone, and the
  frontend no longer carries a role on the user object at all.
- `config/access.ts` is keyed by membership role and evaluates the whole role
  **set**, not one "primary" role.
- `src/middleware.ts` adds the server-side **authentication** gate that section 5
  previously recorded as missing. It does not authorize — roles are not JWT
  claims.
- `PUT /auth/path` and its `choosePath` call are removed; `/choose-path` now
  routes only (see U-09 in the design doc).
- The login and sign-up screens keep their Figma design and switch to Clerk
  custom flows. Sign-up now includes the email-code step the backend requires
  before it will create a profile (`409 IDENTITY_EMAIL_REQUIRED`).

### Dependency changes — require review

| Package | From | To | Why |
|---|---|---|---|
| `@clerk/nextjs` | — | `^6.33.4` | new dependency for CR-003 |
| `next` | `14.2.5` | `14.2.35` | forced: `@clerk/nextjs@6` peer-requires `next ^14.2.25`. Same minor, patch-level only. It also carries the Next.js middleware-bypass fix, which matters now that a middleware auth gate exists. |
| `eslint-config-next` | `14.2.5` | `14.2.35` | kept in lockstep with `next` |

`npm install` must be re-run on the developer machine. This was **not** a
unilateral upgrade of a major dependency — it is the minimum patch bump the new
peer range accepts — but it is called out here because AGENTS.md forbids
changing an important dependency silently.

### Two manual steps required on the developer machine

1. **Delete the retired file.** File transport into this workspace can write and
   overwrite but cannot delete, so `src/services/tokenStore.ts` is still on disk
   and must be removed by hand:

   ```powershell
   git rm src/services/tokenStore.ts
   ```

   Nothing imports it any more, so the build succeeds either way, but leaving it
   invites someone to wire a PandaCloud token back in.

2. **Regenerate the lockfile.** `package-lock.json` was intentionally not
   delivered: the sandbox that verified this work substituted a stub for
   `@kanban/library`, so its lockfile is not representative. Run `npm install`
   locally after repairing the Kanban dependency (section 12).

### Out-of-scope fix, deliberately included

`src/app/submit-request/page.tsx` passed `redirectTo={(reference) => …}` — a
function — from a Server Component to the `ContactForm` Client Component. React
cannot serialise that, and it aborted `next build` before any page was emitted.
It is unrelated to Clerk and predates this work; the build had simply never been
run (section 13, and `docs/VERIFICATION.md` section 5 warns that `tsc` cannot see
RSC boundary violations). The page is now a Client Component — the smallest fix
that changes no props and no behaviour. Turning `redirectTo` into a serialisable
value would change `ContactForm`'s public API and is an FE-owner decision.

## 1. Scope of this handoff

This document summarizes the implementation currently present after the commit
range from the initial repository (`b1f3c5b`) through `3c127eb`, plus the local
parent and nested-repository state that has not been committed.

The accumulated committed change is large: 186 files, approximately 19,730
insertions and 1,151 deletions relative to the initial commit. The application
currently exposes 66 App Router pages.

The major commits are:

| Commit | Summary |
|---|---|
| `a500e19` | Added motion, PCB/circuit, cursor, scan, HUD, and data-flow effects |
| `23f49d5` | Added the interactive global network globe |
| `5db3fd7` | Added customer flows, marketing pages, models, contexts, services, and mocks |
| `a22e059` | Corrected a projection helper |
| `2b12232` | Added the original static verification report |
| `0c7802c` | Integrated the local Kanban library and Sales dealflow API port |
| `8253273` | Added four-role workspaces, RBAC UI, shared resource pages, manual card creation, and manager deletion |
| `006d177` | Connected public product sections to API services, added images, and tightened API configuration/error handling |
| `b4ff33a` | Added the tracked `AGENTS.md` and documentation context cache |
| `3c127eb` | Corrected the repository path in `AGENTS.md`; also changed only the final newline in the conformance document |

## 2. Current product state

The repository is no longer only a marketing site. It now contains:

- the existing public Cloud Panda marketing experience;
- Customer/User workspace under `/dashboard`;
- Sales workspace under `/sales`;
- Manager workspace under `/manager`;
- Admin workspace under `/admin`;
- Land Assessment, GPU Booking, Investment, Hyperscale, and shared request
  receipt flows;
- a Sales/Manager Kanban pipeline using the separate `kaban_cloud` library;
- an HTTP/mock API abstraction intended to connect to the separate backend.

The public PCB/circuit background and interactive Globe implementation remain in
place. The role work did not replace those visual systems.

## 3. Routes implemented

### Public and authentication

- `/`
- `/gpu-renting`
- `/buy-gpu`
- `/energy-land`
- `/financing`
- `/infrastructure`
- `/login`
- `/signup`
- `/choose-path`
- `/submit-request`
- `/requests/[reference]`

### Land Assessment

- `/assessment`
- `/assessment/land-profile`
- `/assessment/power-capacity`
- `/assessment/energy-source`
- `/assessment/facilities`
- `/assessment/results`

### GPU Booking

- `/booking`
- `/booking/workload`
- `/booking/hardware`
- `/booking/scale`
- `/booking/power-cooling`
- `/booking/review`

### Investment

- `/investment`
- `/investment/intent`
- `/investment/volume`
- `/investment/payment`
- `/investment/kyc`
- `/investment/confirmation`

### Hyperscale

- `/hyperscale`
- `/hyperscale/stage`
- `/hyperscale/capacity`
- `/hyperscale/geography`
- `/hyperscale/rfp`

### Customer/User workspace

- `/dashboard`
- `/dashboard/projects`
- `/dashboard/gpu-clusters`
- `/dashboard/portfolio`
- `/dashboard/wallet`
- `/dashboard/transactions`
- `/dashboard/instances`
- `/dashboard/profile`
- `/dashboard/settings`

`/dashboard/sales` also remains as a legacy pipeline entry route.

### Sales workspace

- `/sales`
- `/sales/leads`
- `/sales/leads/[id]`
- `/sales/pipeline`
- `/sales/quotes`
- `/sales/tasks`
- `/sales/customers`
- `/sales/reports`

### Manager workspace

- `/manager`
- `/manager/sales`
- `/manager/team`
- `/manager/pipeline`
- `/manager/operations`
- `/manager/approvals`
- `/manager/reports`

### Admin workspace

- `/admin`
- `/admin/users`
- `/admin/roles`
- `/admin/permissions`
- `/admin/system`
- `/admin/audit-logs`
- `/admin/settings`

## 4. Architecture introduced

The frontend uses a React MVC-style separation:

- `src/models/`: domain and request/response types;
- `src/services/`: all network, token, endpoint, adapter, and environment access;
- `src/controllers/`: auth, form, async, and multi-step flow state;
- `src/components/` and `src/app/`: view composition;
- `src/config/`: centralized navigation, permissions, static presentation data;
- `src/lib/`: framework-independent helpers and transitional calculations.

`src/services/api.ts` selects either the HTTP adapter or mock adapter. Views are
not supposed to know which adapter is active. `src/services/http.ts` owns the
fetch boundary, auth header, timeout, refresh/replay, response unwrapping, error
normalization, and `X-Correlation-Id` behavior.

Important target boundary: the browser must call the versioned `/api/v1` gateway
only. It must not access Convex, Supabase Postgres, Storage internals, n8n, or a
database directly.

## 5. Authentication and role-based access

**Rewritten 2026-08-14.** See `docs/CLERK_AUTH_DESIGN.md` for the full flow.

Identity chain:

```text
Clerk session -> getToken() (no template) -> Authorization: Bearer <JWT>
  -> /api/v1/auth/me -> users.clerkSubject -> active organizationMemberships
  -> MembershipRole -> UI affordances
```

Canonical roles, from `api-contracts/components.yaml`:

```ts
type MembershipRole =
  | "sales" | "compliance" | "legal" | "technical"
  | "manager" | "admin" | "customer";
```

Implemented behaviour:

- `AppAuthProvider` selects `ClerkSessionProvider` (Clerk configured) or
  `StandaloneSessionProvider` (mock-only development).
- `ClerkSessionProvider` is the only file that touches Clerk client hooks. It
  registers the token provider and hands `AuthProvider` a provider-agnostic
  `SessionState`.
- `AuthProvider` loads `GET /api/v1/auth/me` whenever the session changes and
  exposes `{ profile, user, isAuthenticated, initializing, reload, signOut }`.
- `normalizeMembershipRole()` fails closed: an unrecognised role is dropped and
  grants nothing. Required by PHASE_1_FRONTEND_AUTH_HANDOFF.
- Permissions and navigation live in `src/config/access.ts`, keyed by role and
  evaluated over the identity's whole role set.
- `RoleGuard` distinguishes three outcomes: no session (redirect to `/login`),
  session without a usable profile (403 surface — suspended, disabled or
  unmapped identity), and workspace mismatch (403 surface).
- `PermissionGate` controls action visibility.
- `WorkspaceShell` provides shared navigation and Clerk sign-out.

Frontend guards are UX protection only. Every protected API operation is
authorized again by the gateway and by the Convex authorization helpers.

**Resolved:** the previous "no server middleware or server-component session
gate" limitation. `src/middleware.ts` now gates `/dashboard`, `/sales`,
`/manager`, `/admin` and `/requests` on an authenticated Clerk session. It
deliberately does not authorize: roles are resolved from Convex memberships by
the gateway, not carried as JWT claims, so middleware cannot evaluate them
without inventing a source.

**Still open (NEEDS CLARIFICATION, see the design doc):**

- U-05 — may a staff-only identity open the customer workspace? Current
  behaviour is preserved unchanged: any authenticated identity may, and `admin`
  may; `sales` and `manager` may not.
- U-06 — Admin access to Sales/Manager workspaces is still undecided
  (ROLE_PERMISSION_MATRIX § 12.3) and unchanged.
- U-07 — `technical`, `legal` and `compliance` have no workspace and no
  documented FE permissions. They are recognised, granted nothing, and land on
  `/`. Their route trees are not invented.
- U-03 — precedence among multiple active memberships affects only the landing
  route.

## 6. Shared workspace UI

The role pages reuse shared components rather than copy four dashboard systems:

- `WorkspaceShell`
- `DashboardView`
- `WorkspacePage`
- `ResourcePage`
- `DataTable`
- `StatCard`
- `StatusBadge`
- loading, empty, error, and forbidden states

`ResourcePage` currently consumes a server-driven table payload from the
transitional `/workspace/resources/{kind}` operation. The response supplies
column definitions and rows.

This endpoint and its free-form table schema must be confirmed in the released
backend OpenAPI. It must not become production contract merely because the mock
UI uses it.

Some dashboard/analytics views still contain display samples or hard-coded
values, especially:

- `src/components/workspace/DashboardView.tsx`
- `src/components/workspace/PortfolioPages.tsx`
- `src/app/manager/sales/page.tsx`
- `src/app/manager/operations/page.tsx`
- `src/app/admin/system/page.tsx`

These values must be replaced by contract-derived API data before production.

## 7. Sales and Manager pipeline

The pipeline uses `@kanban/library` from the separate local `kaban_cloud`
repository. `src/components/sales/salesAdapter.ts` is the bridge between the
library `DataAdapter` and `api.sales`; the library does not call the API
directly.

Current behavior:

- Cards and columns load through the Sales service.
- Drag-and-drop moves use the separate move operation.
- Sales-source filters preserve cards instead of unmounting them.
- The layout adds `min-h-0`, `min-w-0`, and overflow boundaries to make the
  pipeline scroll inside the workspace.
- Sales, Manager, and Admin staff can create a manual outbound/offline card.
- Customer flow submissions are expected to create cards automatically on the
  backend; the board must not create a duplicate after form submission.
- Manager/Admin can delete a card from its detail panel after a confirmation
  step.
- Deletion is expected to preserve a backend audit event and never delete the
  underlying customer submission.
- Sales and Manager pipeline routes share the same board implementation and
  vary by permissions, not by forked board code.

Transitional Sales operations in `src/services/endpoints.ts`:

- `GET /sales/columns`
- `GET /sales/cards`
- `GET /sales/cards/{id}`
- `POST /sales/cards`
- `PATCH /sales/cards/{id}`
- `POST /sales/cards/{id}/move`
- `DELETE /sales/cards/{id}`

All paths and payloads remain requirements input until present in a pinned
backend OpenAPI release.

### Pipeline risks

- Manual create/delete currently increments `boardVersion` and remounts the
  board. This refreshes data but also resets the library's internal scroll and
  selection state.
- Scroll styling targets library/Tailwind class structure and can break after a
  library update.
- `docs/KANBAN_INTEGRATION.md` is stale: it still says create/delete are absent,
  while the current source implements both.
- `/dashboard/sales` and `/sales/pipeline` expose two entry points to the same
  feature.
- Backend authorization, card-order reconciliation, WIP-limit rejection, and
  immutable deletion audit are not proven by frontend mocks.

## 8. Dynamic product data and API connection

Implemented dynamic sections:

- GPU Renting calls `api.booking.listGpuModels()` and renders loading, error,
  empty, and success states.
- Buy GPU currently calls the same GPU-model operation for model/spec discovery.
- Energy & Land calls `api.hyperscale.listRegions()` for regional power/cooling
  facts.

Fail-closed sections:

- Financing no longer presents the design's product/rate/calculator samples as
  live data. It renders a backend-connection empty state.
- Infrastructure no longer presents the hard-coded inventory table as live
  inventory. It renders a backend-connection empty state.

Important limitations:

- Buy GPU is reusing the rental/booking GPU catalog and has no approved purchase
  price, purchase configuration, or lead-time operation.
- Energy & Land is reusing Hyperscale region facts, not a dedicated land/site
  inventory operation.
- Dormant hard-coded product arrays remain in configuration files such as
  `buyGpu.ts`, `energyLand.ts`, `financing.ts`, and `infrastructure.ts`, even
  when current pages do not render them.
- The adapter defaults to `mock` unless `NEXT_PUBLIC_API_ADAPTER=http` is set.
- The full mock adapter still contains projection and quote logic that must not
  be treated as production business rules.

Required backend operations are documented in
`docs/PRODUCT_DATA_BACKEND_REQUIREMENTS.md` without inventing authoritative
paths.

## 9. API and contract conformance work

The frontend was tightened to:

- require a non-empty base URL for the HTTP adapter;
- require the gateway URL to end in `/api/v1`;
- expose a pinned `NEXT_PUBLIC_CONTRACT_VERSION` value;
- send and preserve correlation IDs;
- normalize the collaboration workflow's flat error body;
- represent 401 and 403 separately;
- add cursor-page and contract-oriented common types.

The repository is still not fully contract-conformant. Status of CR-001
through CR-008 as of 2026-08-14:

1. CR-001 — success envelope: **open**. `http.ts` still tolerates both shapes.
2. CR-002 — money in minor units plus ISO currency: **open**.
3. CR-003 — Clerk session instead of custom refresh tokens: **DONE**
   (2026-08-14). `tokenStore`, `/auth/refresh`, `/auth/login`, `/auth/signup`,
   `/auth/logout` and `PUT /auth/path` are gone from the frontend.
4. CR-004 — signed upload sessions instead of multipart: **open**. KYC and RFP
   uploads still post multipart.
5. CR-005 — role enum casing: **resolved in the frontend's favour of the
   contract**. The frontend now consumes canonical `lower_snake_case`
   membership roles. The separate `USER` vs `CUSTOMER` *wire value* question is
   moot for this repository, because the frontend no longer sends or receives a
   role on the user object — but it still needs an owner decision anywhere else
   it appears.
6. CR-006 — retire `docs/API_CONTRACT.md`: **partially done**. Its § 2 (Auth) is
   now superseded by the OpenAPI draft and should be deleted from that file once
   the owners confirm; the remaining sections stay as requirements input.
7. CR-007 — generated pinned client: **open**. No release exists to generate
   from.
8. CR-008 — Prism/MSW instead of a parallel mock implementation: **open**.

Additional implementation/documentation drift to resolve:

- Runtime requires a base URL ending in `/api/v1`, while examples in README and
  `docs/API_CONTRACT.md` still show `/v1`. `.env.example` and
  `src/services/api.ts` were corrected on 2026-08-14; README and API_CONTRACT
  were not touched.
- ~~`src/services/http.ts` calls the refresh path as a literal~~ — resolved: the
  refresh path no longer exists.
- Several files under `src/lib/api/` are placeholder exports with `unknown`
  types rather than functioning, contract-derived services.

## 10. Visual work

Committed visual work includes:

- PCB/circuit background, cursor glow, AI scan, infrastructure HUD, and
  data-flow effects;
- reduced-motion-aware reveal, count-up, spotlight, tilt, and backdrop motion;
- the existing interactive Globe and network-location adapter;
- real raster imagery under `public/assets/visuals/`:
  - `energy-land-campus.png`
  - `gpu-cluster-closeup.png`
  - `infrastructure-inventory.png`
  - `liquid-cooled-data-hall.png`
- `AssetPlaceholder` support for a real `src`, `alt`, and priority flag.

The new imagery is used across the landing page, GPU Renting, Buy GPU,
Financing, Infrastructure, Assessment Land Profile, and Booking Review.

`docs/FIGMA_ASSETS.md` still lists many brand icons and design assets as
outstanding. Generated or generic imagery must not be presented as a customer
logo, certification, testimonial, or real partnership.

## 11. Current parent worktree state

Before this handoff was added, the parent repository showed:

```text
 D .env.example
?? .vscode/settings.json
?? kaban_cloud/
```

Notes:

- `.env.example` is tracked at HEAD but deleted locally. It contains the safe
  environment template and should normally be restored or intentionally
  replaced; do not substitute the ignored `.env` file or expose its values.
- `.vscode/settings.json` only disables a Postman dotenv notification and is
  not tracked.
- The active tracked `AGENTS.md` now declares the correct audited repository
  path, `D:\Project\panda_cloud`, after commit `3c127eb`.

Do not discard these local items without confirming ownership and intent.

## 12. Nested `kaban_cloud` repository state

`kaban_cloud/` is a nested Git repository with its own origin:

`https://github.com/chungtanloi/kaban_cloud.git`

Nested state at handoff:

- branch: `main`
- HEAD: `ea9f470` (`fix 1 click`)
- modified: `src/core/types/index.ts`
- modified: `tailwind.config.js`

The local changes:

- make `KanbanConfig.columns` optional so the adapter can supply columns;
- disable Tailwind preflight so loading the library does not reset the host
  application's typography/layout.

Critical integration blocker:

- the parent repository does not track this nested repository as a submodule or
  normal files;
- `package.json` depends on `file:./kaban_cloud`;
- `node_modules/@kanban/library` is currently a junction targeting the obsolete
  `D:\panda_cloud\kaban_cloud` path;
- after the repository was moved to `D:\Project\panda_cloud`, TypeScript can no
  longer resolve `@kanban/library` through that broken junction.

A fresh clone cannot reliably reproduce the current app until the team chooses
one strategy: Git submodule, npm/package registry, monorepo workspace, or
properly vendored source/build output.

## 13. Validation status

### 2026-08-14 (Clerk migration)

Run in an isolated Linux sandbox holding a copy of `src/`, `package.json`,
`tsconfig.json`, `next.config.mjs`, `tailwind.config.ts` and `postcss.config.mjs`,
with dependencies installed from the public registry:

```text
tsc --noEmit ............................. PASS (0 errors)
next build (Clerk configured) ............ PASS (exit 0, 64 routes + middleware)
next build (standalone, no Clerk key) .... PASS (exit 0, 64 routes)
next lint ................................ NOT RUN
```

Two caveats, both material:

1. **`@kanban/library` was replaced with a local type stub for the run.** The
   real library was unavailable (section 12). The stub declares only the members
   `salesAdapter.ts` and `SalesBoard.tsx` consume. So the Sales board compiled
   against a *substitute* type surface: everything else in the repository is
   genuinely verified, the Kanban integration is not. Re-run both commands on a
   machine with the real library before trusting the board.
2. **`next lint` still has no committed ESLint configuration**, so there is no
   deterministic non-interactive lint run. Unchanged from 2026-08-13.

Nothing was executed against a live Clerk instance or a live gateway. Every item
in the runtime checklist below is therefore unverified.

Runtime checklist — **all NOT VERIFIED**, requires a configured Clerk instance
and a deployed gateway:

```text
[ ] Sign up (including the email-code step)     [ ] Backend JWT verification
[ ] Sign in                                     [ ] Webhook signature verification
[ ] Sign out                                    [ ] Webhook deduplication
[ ] Session persistence across reload           [ ] User synchronisation
[ ] User identity resolves via /auth/me         [ ] Membership synchronisation
[ ] Organization / membership context           [ ] Audit rows written
[ ] Role resolution                             [ ] Error handling (401/403/409)
[ ] Protected routes                            [ ] API Bearer JWT reaches gateway
[ ] Unauthorized access is refused
```

### 2026-08-13 (original audit)

```text
Typecheck: FAIL
```

Root cause at the time:

```text
Cannot find module '@kanban/library' or its corresponding type declarations.
```

The missing library type then caused implicit-`any` errors in
`src/components/sales/salesAdapter.ts`. That link is broken because it still
points at the old repository path — a dependency/linking failure, not evidence
about the TypeScript changes.

```text
Lint: NOT RUN
Build: NOT RUN
```

Environment constraints found during that audit:

- `node` and `npm` are not available on the normal PATH in that shell;
- the Visual Studio-bundled Node discovered locally is v16.20.0, below the
  Next.js requirement of Node 18.17 or newer;
- the root has no committed ESLint configuration.

## 14. Recommended next actions

### P0 — make the checkout reproducible

1. Decide how `kaban_cloud` is versioned and consumed.
2. Preserve and review its two local modifications before changing the nested
   repository.
3. repair/reinstall the local dependency using npm after the repository path is
   settled; do not hard-code another absolute junction target.
4. Restore or intentionally replace `.env.example` without exposing `.env`.
5. Run typecheck, lint, and production build.

### P0 — unblock and confirm the Clerk migration

1. Have the FE and BE owners approve CR-003 (ROLE_PERMISSION_MATRIX § 17 Q1
   still records it as unconfirmed).
2. Agree the Clerk instance, the PandaCloud API audience on the session token,
   and the allowed origins; set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and the
   matching backend variables.
3. Subscribe the backend webhook URL to `user.created`, `user.updated` and
   `user.deleted`.
4. Decide the 14 `NEEDS CLARIFICATION` items in `docs/CLERK_AUTH_DESIGN.md`
   section H — particularly U-04 (nothing creates organizations or memberships
   today, so no identity can ever become staff) and U-05.
5. Review the forced `next` 14.2.5 -> 14.2.35 patch bump.

### P0 — establish the backend contract

1. Obtain and pin the backend OpenAPI release and generated client.
2. Verify every transitional auth, workspace, Sales, product, assessment,
   booking, investment, and hyperscale operation.
3. Ensure backend role authorization and Sales deletion audit are implemented.
4. Ensure form submission and pipeline-card creation happen transactionally on
   the backend.

### P1 — remove production placeholders

1. Replace hard-coded workspace KPI/table data with typed operations.
2. Add approved purchase, infrastructure inventory, financing product, and
   financing-calculation operations.
3. Remove dormant hard-coded product records once their API replacements exist.
4. Replace mock business formulas with backend results.

### P1 — reconcile routing, docs, and access

1. Decide whether `/dashboard/sales` remains or redirects to `/sales/pipeline`.
2. Decide the Admin cross-workspace access policy and update both frontend and
   backend permission behavior.
3. Update `docs/KANBAN_INTEGRATION.md` for manual create/delete.
4. Update stale absolute repository paths in README examples, verification, and
   Kanban documentation.
5. Align `/v1` examples with the enforced `/api/v1` gateway base path.
6. Refresh the Figma asset backlog to distinguish the four delivered PNGs from
   assets that are genuinely still missing.
7. Review visible mojibake/encoding artifacts before final UI acceptance.

## 15. Handoff guardrails

- Do not connect the frontend directly to a database.
- Do not invent backend endpoints or fields to make a page appear complete.
- Do not treat frontend permission checks as real authorization.
- Do not present mock product, inventory, finance, portfolio, or monitoring data
  as production data.
- Do not replace the PCB/circuit background, Globe, existing public routes, or
  Kanban library without an explicit product decision.
- Do not reset either the parent repository or nested `kaban_cloud` repository;
  both contain local state that must be reviewed deliberately.
- Use npm and `package-lock.json`; do not switch the repository to pnpm or Yarn.
- Do not reintroduce a PandaCloud token, refresh endpoint or localStorage
  session. Clerk owns session refresh (collaboration workflow § 7.1).
- Do not derive `isStaff` on the client. It is computed by the gateway from
  active memberships in a `cloud_panda` organization and arrives on `/auth/me`.
- Do not add `technical`, `legal` or `compliance` permissions, routes or
  workspaces until the role matrix is confirmed.

## 16. Files produced

### 2026-08-13 handoff

- `HANDOFF.md`, `docs/AGENT_CONTEXT_SUMMARY.md`. No application source file was
  changed.

### 2026-08-14 Clerk migration

New:

```text
docs/CLERK_AUTH_DESIGN.md
.env.example                                   (restored; was tracked at HEAD, deleted locally)
src/middleware.ts
src/services/session.ts
src/components/auth/AppAuthProvider.tsx
src/components/auth/ClerkSessionProvider.tsx
src/components/auth/StandaloneSessionProvider.tsx
src/components/auth/AuthCard.tsx
```

Deleted:

```text
src/services/tokenStore.ts
```

Modified:

```text
package.json
src/app/layout.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/signup/page.tsx
src/app/(auth)/choose-path/page.tsx
src/app/dashboard/layout.tsx
src/app/dashboard/sales/page.tsx
src/app/sales/layout.tsx
src/app/manager/layout.tsx
src/app/admin/layout.tsx
src/app/submit-request/page.tsx                (pre-existing RSC defect, see section 0)
src/config/access.ts
src/controllers/AuthContext.tsx
src/models/auth.ts
src/models/platform.ts
src/components/dashboard/Sidebar.tsx
src/components/sales/SalesBoard.tsx
src/components/shared/PermissionGate.tsx
src/components/workspace/RoleGuard.tsx
src/components/workspace/WorkspaceShell.tsx
src/components/workspace/Forbidden.tsx
src/services/api.ts
src/services/config.ts
src/services/contracts.ts
src/services/endpoints.ts
src/services/http.ts
src/services/http-impl/index.ts
src/services/mock/index.ts
src/services/mock/fixtures.ts
docs/AGENT_CONTEXT_SUMMARY.md
HANDOFF.md
```

No file in `PandaCloudBackend` was modified.
