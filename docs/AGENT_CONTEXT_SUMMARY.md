# Agent Documentation Context Summary

## Cache metadata

- `schema_version`: `1`
- `repository`: `panda_cloud`
- `branch_at_refresh`: `main`
- `head_at_refresh`: `3c127eb239f33f09d3d48bb5bd68c159166a8c44` (diagnostic only; the
  working tree carries uncommitted Clerk-migration and Sales-pipeline changes)
- `source_file_count`: `20`
- `source_fingerprint`: `bf6b7651511c44702df0c1d95908e247c83613835c7dab4586b3e30f40216ae8`
- `last_full_read_at_utc`: `2026-08-14T01:20:00Z`
- `last_context_refresh_at_utc`: `2026-08-18T02:45:00Z`

The branch and HEAD values are diagnostic only. The manifest includes dirty and
untracked documentation, and the content fingerprint is the cache-validity
authority.

> 2026-08-15 incremental refresh (09:15): the corpus gained
> `docs/INTEGRATION_DEFECT_AUTH_ME_401.md` (new file, read and incorporated);
> every other manifest digest was unchanged. The Sales pipeline section below
> was rewritten to match the contract-accurate board implementation shipped on
> the same day; the Sales pipeline code is not part of this corpus, so the
> fingerprint does not cover it.

> 2026-08-15 incremental refresh (10:40): the corpus gained
> `docs/SALES_BOARD_CONTRACT_GAP.md` (new file, read and incorporated). The
> Sales pipeline section was corrected again — a create operation now exists,
> which the 09:15 revision stated it did not.

## Product purpose

Cloud Panda is a Next.js frontend for a one-stop AI infrastructure platform. It
covers public discovery, GPU rental and purchase, energy and land assessment,
financing, infrastructure procurement, AI token investment, hyperscale data
center consultation, customer dashboards, and a staff sales pipeline. The
implemented and proposed experiences are derived from Figma file
`pCxGT1lfFqO2CiDXEmrTk7` and related written analysis.

The repository can run without the backend through a mock adapter. Production
is intended to use a separately released backend HTTP contract, not the mock
formulas or the frontend's transitional requirements document.

## Architecture and runtime boundaries

- Stack: Next.js 14 App Router, TypeScript, and Tailwind CSS.
- The React structure adapts MVC: `models/` owns types, `services/` owns all
  network and environment access, `controllers/` owns behavior, and
  `components/` plus `app/` render views.
- `src/services/api.ts` selects either the mock or HTTP adapter. Both implement
  `ApiClient`; components do not call `fetch` and do not read environment
  variables.
- The real adapter uses `NEXT_PUBLIC_API_BASE_URL`, which must end in `/api/v1`,
  a pinned `NEXT_PUBLIC_CONTRACT_VERSION`, and — since the Clerk migration —
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
- The public integration boundary is the backend's versioned Vercel HTTP
  gateway. The frontend must not import Convex schemas/functions or connect to
  the database directly.
- Production product records, prices, stock, capacity, financing inputs, and
  availability belong to backend-owned data sources. Static frontend config may
  contain approved presentation copy and layout metadata only.

## Authentication and authorization

Documented end to end in `docs/CLERK_AUTH_DESIGN.md`, implemented 2026-08-14.

- Clerk owns credentials, session, refresh, MFA and sign-out. PandaCloud issues,
  stores and refreshes no token; `services/tokenStore.ts` and the
  `POST /auth/refresh` retry are deleted (CR-003 closed).
- The bearer is the Clerk session token from `getToken()` with no custom JWT
  template, minted through `services/session.ts` and attached by
  `services/http.ts`.
- `GET /api/v1/auth/me` is the only authenticated operation the backend contract
  defines. It returns the profile plus `authorization.isStaff` and the active
  `memberships[]`.
- Roles are canonical `lower_snake_case` membership roles: `sales`,
  `compliance`, `legal`, `technical`, `manager`, `admin`, `customer`. Unknown
  values fail closed. The frontend never sends or chooses a role.
- `src/middleware.ts` gates workspace routes on an authenticated session only;
  authorization stays in `RoleGuard` after `/auth/me` resolves, and the backend
  remains the only real control.
- `technical`, `legal` and `compliance` are recognised but have no workspace,
  no navigation and no permissions — their route trees are proposed, not built.

## Current documented status

- Marketing pages, authentication, Choose Your Path, the five-step Land Owner
  Assessment, and Dashboard Overview are documented as built. Some marketing
  imagery remains placeholder content.
- The Clerk migration typechecks and builds clean. The 2026-08-14 caveat that
  `@kanban/library` had been substituted with a type stub is resolved: the
  Sales board compiles, builds and is unit-tested against the real library, and
  a deterministic `next lint` now exists (`.eslintrc.json`,
  `next/core-web-vitals`). No runtime behaviour has yet been exercised against a
  live Clerk instance or gateway — protected `/sales/*` routes intercept
  unauthenticated requests via Clerk middleware as designed.
- A pre-existing RSC boundary defect in `src/app/submit-request/page.tsx` was
  fixed because it aborted `next build` before any page was emitted. It was
  unrelated to Clerk; the build had never previously been executed.
- `next` was bumped 14.2.5 -> 14.2.35 because `@clerk/nextjs@6` peer-requires
  `next ^14.2.25`. This needs owner review.
- GPU Cluster Booking, AI Token Investment, and Hyperscale flows are mapped in
  Figma but are marked not started in the screen map. The financing and
  infrastructure pages require text verification from their design sources.
- Known cleanup includes an obsolete wizard controller/shell and several unused
  types. Do not remove them without a task that includes implementation and
  verification.
- The design asset backlog records exported brand, marketing, dashboard, and
  assessment assets. Do not hand-author substitutes for missing Figma glyphs.
- Motion is intentionally subtle and dependency-free: CSS transitions and
  keyframes plus `IntersectionObserver`, with reduced-motion and accessibility
  fallbacks. Figma token values win over motion enhancements.

## Main workflows

### Public and customer journeys

- Visitors discover services and choose Land Owner, GPU Cluster, AI Token, or
  Hyperscale paths. The choice is navigation only — `PUT /auth/path` has no
  approved backend field or endpoint and was removed.
- The Land Owner flow collects land profile, power, energy source, facilities,
  and fiber data, then produces viability/report output. It is anonymous until
  PDF download requests sign-up.
- Proposed requirements also cover GPU configuration and quoting, token
  investment and KYC, hyperscale RFP handoff, dashboard summaries, general
  leads, shared receipts, and workspace resource lists.
- Production catalog and calculator gaps must fail closed with a clear
  unavailable state until approved OpenAPI operations exist.

### Technical, Legal and Compliance workspaces

- Eleven routes exist under `/technical`, `/legal`, `/compliance`, built to
  ROLE_PERMISSION_MATRIX §§ 5.2, 6.2, 7.2, 11. `docs/WORKSPACES_DESIGN.md` is
  the write-up — read it first.
- **None of the three has a backend.** The gateway has ten paths (identity,
  webhooks, sales). `convex/ncnda.ts` and `convex/kyc.ts` hold **mutations
  only, no queries** — listing is a missing backend function, not just a
  missing gateway. Mock adapter only.
- The NCNDA/KYC paths in `endpoints.ts` and the shapes in `models/ncnda.ts` /
  `models/kyc.ts` are **proposals**, not a contract. Do not treat them as
  settled.
- Blocked-by-design screens, each with an on-page `GapNotice`: the Technical
  overview and list (no cross-deal list; Technical cannot enumerate deals),
  the evidence page (out of scope), and the KYC documents page (§ 7.4 explicit
  schema gap — never invent `kycCaseDocuments`).
- `config/lifecycle.ts` maps every status enum to a colour as
  `Record<Status, Tone>`, so a new backend status is a compile error rather
  than a silently grey pill.

### Due Diligence

- `DD API.md` (repo root, `D:\Project`) is the DD contract: **five operations
  over four paths**, nothing else. `docs/DD_API_CONFORMANCE.md` is the frontend
  audit against it — read that first.
- **The backend gateway does not exist yet.** No `ddGateway.ts`, no DD paths, no
  DD routes. Every DD call through the HTTP adapter 404s; use the mock adapter.
  Do not stub around this.
- `updateResponse` is keyed by `templateItemId`, not response id (upsert).
  `expectedRevision: 0` means "unanswered". 409 on a stale revision **or** on a
  completed/cancelled assessment.
- Never add a complete/cancel method — `DD API.md` forbids it explicitly.
- Evidence upload, eligible-deals and the workspace overview have **no
  operation**. They live under a "NOT ON THE WIRE" banner in
  `models/dueDiligence.ts`. The `/technical` overview page has no data source.

### Sales pipeline

- `/sales/pipeline` (and `/dashboard/sales`, the legacy entry point) embeds the
  local `@kanban/library` project from `kaban_cloud/`. The library must be built
  before the host app installs/uses its `dist-lib` output.
- `components/sales/salesAdapter.ts` is the sole bridge between Kanban types and
  `api.sales`, preserving the common mock/HTTP adapter boundary. It maps the
  backend wire DTOs (`SalesColumnDto`, `SalesCardDto`, `SalesCardDetailDto`) to
  the board shapes; `order` is derived from backend order and never sent back.
- The board is written against the backend contract exactly:
  `GET /sales/columns`, `GET /sales/cards` (paginated per column, follows
  `nextCursor`), `GET|PATCH /sales/cards/{dealId}`,
  `POST /sales/cards/{dealId}/move`, and — since 2026-08-15 —
  `POST /sales/cards` for manual outbound/offline entry.
- Manual creation goes through `ManualDealModal`, **not** the Kanban adapter.
  Exposing `createCard` on the adapter would make the library render its own
  inline create form, which cannot supply the organization the deal must be
  filed under and would always produce a 400.
- Organization selection on create is settled (2026-08-17): the request carries
  **exactly one** of `organizationId` or `organizationName`, and the UI always
  sends the name. `deals.resolveOrganization` matches the name
  case-insensitively via the new `organizations.by_normalizedName` index and
  creates a `customer`/`prospect` organization when nothing matches, audited as
  `organization.created`. `ownerId` is optional and defaults to the
  authenticated actor, so a sales member always sees the card they just made.
  `normalizedName` is `v.optional` — pre-existing organization rows are
  invisible to the index until backfilled, so a duplicate can be created for a
  company that already exists.
- Since 2026-08-17 every card also carries `organizationName` and
  `primaryContact` (`contactId`, `fullName`, `jobTitle`, `email`, `phone`,
  `status`), denormalized by `convex/lib/cardParties.ts` per page. The board
  shows the company and one-tap `tel:`/`mailto:` links; `DealDetail` repeats
  them. Never build a contact link by hand — `contactChannels()` in
  `models/sales.ts` is the only sanctioned way, because it is what suppresses
  the link for a `do_not_contact` record (DEALFLOW § 5.1).
- Cards also carry `ownerName`. **Never render `ownerId` in the UI** — it is an
  opaque Convex key. `DealDetail` shows "You" when it matches
  `profile.user.id` (same underlying `users._id`), the resolved name otherwise,
  and hides the row when neither is available.
- The card links sit inside the board's drag handle, so `DealCardView` stops
  pointer-down propagation on them. Dragging cannot start from those two
  targets; that is intentional, not a bug to "fix" by removing the handler.
- Manual create also finds-or-creates the contact: `contactName` plus at least
  one of `contactEmail`/`contactPhone`, matched by normalized email within the
  organization. `primaryContactId` and the typed `contact*` group are mutually
  exclusive. An existing contact's values are never overwritten.
- **There is still no delete operation.** `API_CONTRACT.md` § 9.8 and
  `KANBAN_INTEGRATION.md` disagree on whether one should exist; the backend
  implemented neither and CORS does not permit `DELETE`. A lost deal is moved to
  the `lost` column, preserving the audit trail.
- Customer-flow submissions are still expected to create their card
  transactionally with the submission, but **no intake endpoint exists yet**, so
  manual entry is currently the only way a card can appear.
- A `sales` caller sees only deals they own (`resolveKanbanScope` → `assigned`);
  manager and admin see all. A card created with another owner is invisible to a
  sales user.
- The `deals` collection is empty in a fresh deployment: `convex/seed.ts` seeds
  the 10 `pipelineStages` and the DD template only.
- Every state change carries `expectedRevision`; a 409/CONFLICT surfaces "This
  deal changed on the server. Reloading the latest version." and refreshes the
  board without blind retry. Won/Lost moves are manager/admin-only on the
  backend; a 403 rolls the optimistic drag back and toasts the backend message.
- The detail panel is a custom `detailPanelRender` (`DealDetail.tsx`). Deal
  value and record fields render real backend fields read-only via
  `formatMinorUnits` (minor units + ISO 4217, `—` when absent); probability,
  expected close and description are the editable sales fields.
- Vertical filters (land/GPU/token/hyperscale) hide cards with CSS
  (`data-deal-vertical` + `.kanban-scope[data-vertical-filter=…]`) instead of
  unmounting them, so scroll and drag state survive.
- UI role guards are convenience only. The backend must reject every staff
  operation for a non-staff token. A missing membership means customer.
- The Kanban package may ship a conflicting Tailwind preflight reset; if styles
  drift on the sales page, disable preflight in the library and rebuild it.
  (Current `dist-lib` CSS carries no preflight.)
- Tests run with vitest (`npm test`): 21 tests covering adapter mapping,
  pagination, update/move payloads, the 409 no-blind-retry rule, HTTP error
  normalization (4xx/5xx never mislabeled `NETWORK_ERROR`), and the board
  chrome (filters render, no add/delete affordance). The library's dist types
  do not re-export the `Column` interface, so `salesAdapter.ts` defines a
  structural `BoardColumn` twin.

## Frontend-backend contract

- `docs/API_CONTRACT.md` is structured requirements input consumed by the
  existing UI. It is explicitly not the contract and must shrink as operations
  enter the backend-owned OpenAPI source. Its § 2 (Auth) is now superseded by
  the OpenAPI draft and should be deleted once the owners confirm.
- The backend repository owns the OpenAPI 3.1 source and tagged contract
  releases. The frontend pins and verifies a generated client artifact rather
  than following backend `main` or keeping a copied YAML contract.
- The backend draft is `0.1.0-draft` and defines exactly one operation,
  `GET /api/v1/auth/me`. It is not frozen, tagged or released, so nothing can be
  pinned yet.
- Open decisions remaining: success-envelope policy (CR-001), minor-unit money
  migration (CR-002), signed direct-to-storage uploads (CR-004), removal of the
  second contract (CR-006), generated-client adoption (CR-007), and replacing
  the full mock implementation with contract-derived Prism/MSW behavior
  (CR-008). CR-003 is closed; CR-005 no longer affects this repository.
- File uploads currently proposed as multipart conflict with the canonical
  signed upload-session, direct private-storage PUT, checksum/finalize, and
  malware-gate workflow. Do not preserve multipart as the production design.
- Integration defects must record environment, pinned contract version, and
  correlation ID. Agents cannot invent fields or approve/freeze a contract.

## Constraints and decisions

- Design tokens live in CSS variables and Tailwind aliases; use those tokens
  rather than raw visual values.
- Missing images/icons remain explicit placeholders until exported from Figma.
- Honor `prefers-reduced-motion`; content must remain visible when observers or
  animation support fail.
- Never treat mock ESG, CapEx, quote, ROI, or financing formulas as production
  business rules.
- Financial data must eventually use the backend's approved money convention;
  existing major-unit floats are transitional and conflict with the canonical
  contract workflow.
- Do not reintroduce a PandaCloud token, refresh endpoint or localStorage
  session, and do not compute `isStaff` on the client.

## Gaps and open questions

- Fourteen `NEEDS CLARIFICATION` items for identity and access are enumerated in
  `docs/CLERK_AUTH_DESIGN.md` section H. The most consequential is U-04: nothing
  in the backend currently creates organizations or memberships, so no identity
  can become staff.
- The backend OpenAPI release, generated client, and contract gates described by
  the collaboration workflow are not yet present for the frontend to consume.
- Production operations remain required for GPU purchase inventory, broader
  infrastructure inventory, financing products, and backend-owned financing
  calculations.
- Many Figma assets are unexported, Assessment Step 4 lacks a source design, and
  the Request Received and Hyperscale landing experiences need source/fidelity
  confirmation.
- Canonical CTA destinations, transaction/provider states, formulas, pricing
  sources, and customer-dashboard entities must be confirmed rather than
  inferred from mock screens.
- Contract Change Requests CR-001, CR-002, CR-004, CR-006, CR-007 and CR-008
  require FE and BE owner review.

## Cross-repository dependency

The sibling `../PandaCloudBackend` repository owns business/domain persistence,
the Vercel gateway, OpenAPI source and contract releases. Its Phase 1 identity
slice is implemented: a Next.js gateway, Clerk verification, an HMAC-signed
Convex transport, five Convex collections, and Clerk webhook handling. Validate
that repository's `docs/AGENT_CONTEXT_SUMMARY.md` independently before cross-repo
work — as of 2026-08-14 it was stale and overstated the implementation. A valid
frontend fingerprint does not imply a valid backend fingerprint.

## Source manifest

`incorporated_at_utc` is the time each source was read into this summary.

| Path | SHA-256 | Bytes | Incorporated UTC |
|---|---|---:|---|
| `docs/API_CONTRACT.md` | `2edf5bad1a8b6fda7bd1aaf3ce0c7f245af0133de916a080a44d3ee5ff5746bb` | 26848 | `2026-08-18T02:45:00Z` |
| `docs/CLERK_AUTH_DESIGN.md` | `b95c75d980e37d599a8d4cb70da342a705996f031f47b6ba52fce9cad3c69223` | 21733 | `2026-08-18T02:45:00Z` |
| `docs/CONTRACT_CONFORMANCE.md` | `94f667969ce2b6d86ba40b915610e8bdaedccbef3965325ab5c3c34084ed7d1c` | 9063 | `2026-08-18T02:45:00Z` |
| `docs/DD_API_CONFORMANCE.md` | `7fda6b9f2f8c6435a9a906faf39050113eaca22bc0ead0d6fdd1a7b2838c2a9c` | 1407 | `2026-08-18T02:45:00Z` |
| `docs/DEAL_READINESS_FRONTEND_HANDOFF.md` | `b5b47e52724dbe70ebeec804c279dcbf4bccfac3ce6cdf039268d0d359b8f01d` | 2794 | `2026-08-18T02:45:00Z` |
| `docs/FIGMA_ASSETS.md` | `612a2d81993d15d756802a82fb3449a4e3f0ae15749bd1cabe7a1fd73ba42c48` | 5507 | `2026-08-18T02:45:00Z` |
| `docs/FIGMA_SCREEN_MAP.md` | `66191f2f36aea246e6cfe8ae9daf92b46810bf31e0acbba5951d2255b17951f1` | 5545 | `2026-08-18T02:45:00Z` |
| `docs/INTEGRATION_DEFECT_AUTH_ME_401.md` | `f0757548d88769b5bc34d36d2f1776a867f01b6d4ac74c160ba77a48e71ba3f2` | 18105 | `2026-08-18T02:45:00Z` |
| `docs/KANBAN_INTEGRATION.md` | `108f770d7c38e681a6e0c438eaa5612d4fb2ffaeebced459cb3d1768213821d8` | 5047 | `2026-08-18T02:45:00Z` |
| `docs/KYC_API_CONFORMANCE.md` | `dc1b37c0a0cc5e38c15f526933ee8a3a1886c038e5486383c11d46caed95bcd8` | 1495 | `2026-08-18T02:45:00Z` |
| `docs/LEGAL_COMPLIANCE_BACKEND_REQUIREMENTS.md` | `6d0f275b40f523aa58a497dea33f4a96835bc02f68f410fd7be743c85bb6e8c4` | 3422 | `2026-08-18T02:45:00Z` |
| `docs/MOTION.md` | `663f7dfcf504017172635bb7cfca548a741aa4c6849265401a29eed42b9176a3` | 3165 | `2026-08-18T02:45:00Z` |
| `docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md` | `b1457cf44f3952ccc4afde17a91f6a232a99fab4a7c9b408a143872654b2a4df` | 19055 | `2026-08-18T02:45:00Z` |
| `docs/PRODUCT_DATA_BACKEND_REQUIREMENTS.md` | `f847316fca11265e6e641f2e0f101de421d1e3b42222c7e90686406f17bac26d` | 2141 | `2026-08-18T02:45:00Z` |
| `docs/SALES_BOARD_CONTRACT_GAP.md` | `e3b0b29e636d7e174e104b931e53d47ba676e8ad2138fde3ee5a5fa83a9532c0` | 7764 | `2026-08-18T02:45:00Z` |
| `docs/SALES_WORKSPACE_API_CONFORMANCE.md` | `17adad37712eb66bf7d49183dcdcb1cf3e9256e465da2f48e2fbe56c292b6d12` | 1667 | `2026-08-18T02:45:00Z` |
| `docs/SUBMISSIONS_API_CONFORMANCE.md` | `768902e31f44ebc77d89d658ba57b819bbbba989a63cac7158a85c572d2852ae` | 1203 | `2026-08-18T02:45:00Z` |
| `docs/VERIFICATION.md` | `a0a61499a8710964691472e3f7bd39cce32181467ed5711385e908f0f5244ffb` | 5585 | `2026-08-18T02:45:00Z` |
| `docs/WORKSPACES_DESIGN.md` | `d81c8f893f1ada95c4e65b88f1a42ce9f1d74529840e2f7e05e35f957d70edef` | 8881 | `2026-08-18T02:45:00Z` |
| `README.md` | `f02cd82446bdac2837ea0617f3e2c4e4c2e094e2039d3de410b3e7de868de96f` | 4683 | `2026-08-18T02:45:00Z` |

## 2026-08-17 frontend API migration

The frontend now targets the implemented backend gateways for KYC, submissions,
and technical due diligence. KYC is deal-scoped and includes document links;
submissions support anonymous creation, cursor pagination, and explicit
Sales/Manager/Admin conversion; DD maps the implemented assessment, progress,
and response routes with required optimistic-concurrency revisions. NCNDA was
already aligned to its implemented gateway. See `KYC_API_CONFORMANCE.md`,
`SUBMISSIONS_API_CONFORMANCE.md`, and `DD_API_CONFORMANCE.md` for exact
endpoint and DTO mappings. No browser code calls Convex directly, and backend
authorization remains authoritative.

Validation note: migration code type-checks; the repository-wide check still
reports pre-existing optional `createCard` fixture errors in
`src/components/sales/salesAdapter.test.ts`.

> 2026-08-17 frontend legal/compliance refresh: deal context inputs, NCNDA create/update and document attach/detach, and KYC case document list/attach/detach were implemented against the backend gateway. Backend gaps are recorded in docs/LEGAL_COMPLIANCE_BACKEND_REQUIREMENTS.md; no backend files were changed.

> 2026-08-17 Sales Workspace Phase 2 frontend alignment: Sales overview, CRM leads/qualification, activity-backed tasks, customer read model and conversion/activity/forecast reports now use the implemented /api/v1/sales/* and /api/v1/deals/*/activities gateways. See docs/SALES_WORKSPACE_API_CONFORMANCE.md. Quotes, assignment, notifications, audit query and report formula decisions remain backend gaps.


> 2026-08-18 Deal Readiness frontend update: a staff-only shared route now composes the implemented deal-scoped NCNDA and KYC APIs into parallel readiness lanes. NCNDA is document-first and KYC is evidence-first. The readiness projection is UX-only; backend authorization, OCC and validation remain authoritative. See docs/DEAL_READINESS_FRONTEND_HANDOFF.md.

> 2026-08-18 Pipeline policy update: backend now centrally evaluates adjacent
> stage transitions, minimum data gates, readiness warnings, OCC and audited
> Manager/Admin overrides. Frontend consumes
> `/sales/cards/{dealId}/transition-options`, renders blockers/checklists, and
> records backend-validated Sales milestones. Won/Lost/Archive use Deal change
> requests and cannot be reached by direct drag. See
> `docs/PIPELINE_TRANSITION_POLICY_HANDOFF.md` and root `HANDOFF.md`.
