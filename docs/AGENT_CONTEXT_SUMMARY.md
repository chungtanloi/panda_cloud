# Agent Documentation Context Summary

## Cache metadata

- `schema_version`: `1`
- `repository`: `panda_cloud`
- `branch_at_refresh`: `main`
- `head_at_refresh`: `4880cf7` (diagnostic only)
- `source_file_count`: `37`
- `source_fingerprint`: `aa7d25f49a01858db6c128083ed0f13e3c72a2e0655d8906d91afe98dc1f64a6`
- `last_full_read_at_utc`: `2026-08-14T01:20:00Z`
- `last_context_refresh_at_utc`: `2026-08-20T08:27:52Z`

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

> 2026-08-18 incremental refresh: Sales Integration Candidate v1 is now
> consumed by the Sales workspace through the authenticated `/api/v1` gateway.
> The new handoff supersedes the stale Phase 2 frontend validation counts for
> this slice; it records 34 passing frontend tests and the explicit Quotes
> block. Two changed handoffs were reread alongside the new handoff.

> 2026-08-18 incremental refresh: the Sales integration handoff was reread
> after its final selector evidence update. The frontend now has 35 passing
> tests: Manager/Admin manual-card selectors forward only authorized opaque
> Organization, Contact, and Owner identifiers. Sales callers retain the
> existing free-text find-or-create path and default owner behavior.

> 2026-08-18 incremental refresh: the Sales handoff was reread after the
> frozen-contract compatibility audit. Sales is now prevented from starting a
> direct Won/Lost drag, while Manager/Admin retain that UI path; the proposed
> Deal Change Requests and NCNDA CR-004 contracts remain unconsumed. The suite
> records 36 passing tests.

> 2026-08-18 incremental refresh: the Sales candidate branch was rebased onto
> frontend main `3ebe7ae`. The changed Sales handoff and the three new
> main-line conformance/policy documents were read and incorporated. Main-line
> Deal Readiness, transition preflight/review, Deal Change Requests and
> approvals, shared lookups, documents, and Legal/Compliance work were
> retained; Sales screens use the shared lookup service rather than a parallel
> port. The merged suite records 93 passing tests.

> 2026-08-18 incremental refresh: KYC + NCNDA Phase 1 was audited against
> backend `79160d1`. The new handoff was read and incorporated. Production
> Legal/Compliance routes retain only approved deal-scoped KYC/NCNDA operations;
> CR-004 queue and transition proposals remain isolated and unconsumed. The
> suite records 105 passing tests.

> 2026-08-19 incremental refresh: Manager + Admin Integration Phase 1 was
> completed on frontend main. Manager overview/team/project/report surfaces now
> render typed backend DTOs; Operations shows persisted projects plus explicit
> blocked gaps, and Deal Change Requests remain the only approvals domain.
> Admin overview/users/roles/system/audit/integration-event surfaces now use
> typed read-only views; Permissions and Settings are truthful blocked notices.
> The new handoff records backend `4aa9a6c`, seven focused integration tests,
> one adapter contract test, and a final frontend suite of 113 passing tests.

> 2026-08-19 cross-workspace E2E-readiness audit: frontend `430aab1` was
> audited with backend `4aa9a6c`. Auth, Sales, Deal Change Requests,
> DD/Documents, KYC, deal-scoped NCNDA, Readiness, Projects, Manager and Admin
> route/service continuity were checked against the current HTTP gateway. One
> frontend defect was fixed: Admin audit and integration-event detail endpoints
> now have linked, typed, read-only pages that expose only the backend's safe
> projection and no retry control. The frontend test suite is 115 tests in 16
> files; typecheck, lint, production build and diff check pass. Real E2E is
> **BLOCKED / NOT RUN** because the dev gateway, matching Clerk users and
> memberships, disposable fixtures, storage, and malware-scanner transition
> are unverified without external calls. See the new cross-workspace runbook
> and integration-status documents.

> 2026-08-19 E2E execution: the owner-resolved clean checkpoint was verified
> for frontend `8fdf2ba` and backend `4aa9a6c`. The documented local gateway
> and frontend started on ports 3001 and 3000. A real unauthenticated
> `/api/v1/auth/me` request returned `401 UNAUTHENTICATED`, echoed CORS and
> correlation ID `e2e-unauth-001`. No Clerk role sessions, memberships,
> disposable fixtures, or trusted scanner-clean document were available, so
> authenticated workflows were not attempted. Final classification:
> **REAL_E2E_BLOCKED**. See `CROSS_WORKSPACE_E2E_EXECUTION_PHASE_1.md`.

> 2026-08-19 E2E environment preparation: frontend main advanced to
> `4880cf7`, and the backend remained `4aa9a6c`. An ignored `.e2e.local.json`
> placeholder manifest and `E2E_ENVIRONMENT_BOOTSTRAP_CHECKLIST.md` were
> added. Source inspection found no approved Clerk identity or PandaCloud
> membership provisioning automation; owner action is required for test-only
> identities, active `organizationMemberships`, disposable fixtures, and
> non-production storage confirmation. Frontend local `CLERK_SECRET_KEY` and
> `SUPABASE_STORAGE_SERVICE_ROLE_KEY` names remain an owner cleanup action;
> values were not read or copied. Validation remains 115 tests / 16 files,
> typecheck, lint and 76-route production build green.

> 2026-08-19 incremental refresh (09:56 UTC): twelve new or revised handoff,
> audit, E2E, and proposal documents were read and incorporated. The real
> authenticated cross-workspace E2E run remains blocked on approved Clerk test
> identities, memberships, disposable fixtures, private storage, and a trusted
> scanner-clean transition. The corpus also gained two proposed GPU Rental UX
> specifications and `AI_ASSISTED_SITE_INSPECTION_SPEC.md`. These three product
> specifications are requirements input only: their routes, persistence,
> provider configuration, and HTTP operations are not implemented or frozen.

> 2026-08-20 incremental refresh: the AI-Assisted Site Inspection proposal was
> expanded into a complete eight-document suite. The canonical master now has
> 46 stable requirements and a persisted `inspectionCaptureTasks` entity; new
> documents define customer/reviewer/admin UX, proposed backend/API/data,
> AI/standards/evaluation, security/privacy/operations, QA traceability, a
> backend-free full-journey mock/demo, and delivery/handoff. This remains
> requirements input only. No inspection route, service, OpenAPI operation,
> provider call, profile, or mock UI was implemented by this documentation
> change.

> 2026-08-20 repository-ownership refresh: the Site Inspection suite was
> split by authority across both repositories. Frontend now retains only the
> UX/frontend specification, mock/demo specification, and a repository-local
> documentation map. The backend owns the canonical product baseline, API/data,
> AI/standards, security/operations, cross-system QA, and delivery governance.
> No runtime feature or released HTTP contract was added.

> 2026-08-20 Site Inspection development-workflow refresh: added the
> frontend executable guide with nine deterministic demo tasks (FE-D01-D09)
> and six released-contract HTTP integration tasks (FE-H01-H06). The guide
> preserves the model/service/controller/view boundary, identical mock/HTTP
> ports, pinned-client rule, local-file restrictions, and no production mock
> fallback. The backend repository owns the shared workflow and BE backlog.

## Product purpose

Cloud Panda is a Next.js frontend for a one-stop AI infrastructure platform. It
covers public discovery, GPU rental and purchase, energy and land assessment,
financing, infrastructure procurement, AI token investment, hyperscale data
center consultation, customer dashboards, a staff sales pipeline, and a
proposed AI-assisted data-center/electrical site-inspection service. The
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
- GPU Rental customer/staff portals and AI-Assisted Site Inspection are
  documented proposals only. Site Inspection now has a modular implementation
  suite and full mock/demo specification, but its route maps, APIs, data models,
  AI provider settings, reviewer operations, profile administration, and
  reports are not implemented or approved backend contracts.
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
- The proposed US AI-assisted inspection pilot uses a checklist-first capture
  journey with inline evidence preflight, provisional AI findings, and a
  one-business-day Technical review target. It is readiness advisory only and
  must not be represented as AHJ, licensed-electrical, professional-engineer,
  standards-body, or third-party certification.

### Technical, Legal and Compliance workspaces

- Technical, Legal and Compliance routes retain their workspace-specific
  navigation and UI guards; the API gateway remains authoritative.
- Technical DD now has an implemented assessment and secure-evidence flow.
  Legal and Compliance use approved deal-scoped NCNDA/KYC paths with shared
  secure upload, attach/detach and signed download. Their global queues are
  blocked: Legal must not consume CR-004 draft paths, and Compliance must not
  use Sales enumeration to fabricate discovery.
- The Technical global overview remains intentionally blocked: assessment reads
  are deal-scoped and Technical cannot enumerate a canonical global deal scope.
- `config/lifecycle.ts` maps every status enum to a colour as
  `Record<Status, Tone>`, so a new backend status is a compile error rather
  than a silently grey pill.

### Due Diligence

- `docs/TECHNICAL_DD_SECURE_DOCUMENTS_INTEGRATION_HANDOFF.md` records the
  current frontend gateway integration: assessment list/create/detail/progress,
  OCC response updates, item-scoped evidence list/attach/detach, and secure
  document upload/finalize/download sessions.
- The backend creates a response row for every template item. Client updates
  use the returned positive response revision and reload after 409; they never
  retry a stale write blindly.
- Browser file bytes use a server-issued private signed URL. The frontend never
  sends/receives a bucket, object path, storage credential, or durable signed
  URL. A failed finalize retries only the finalize operation for the same
  document id.
- Attachment remains blocked until backend malware status is `clean`; the
  current malware-provider/state-transition design is still open. DD global
  discovery, lifecycle completion/cancellation and unlinked-document discovery
  are also open and must not be invented.

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
- Backend Integration Candidate v1 at `c546d69` exposes 67 public routes and
  80 operations with route/OpenAPI parity. It is authoritative for the current
  Sales integration but is still not an owner-approved release or tag.
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
- AI-assisted inspection still requires approved self-service organization and
  membership onboarding, a licensed/versioned standards baseline, backend data
  and retention controls, private clean-evidence gating, Technical reviewer
  staffing/SLA policy, golden evaluation ownership, and released OpenAPI
  operations before implementation.

## Cross-repository dependency

The sibling `../PandaCloudBackend` repository owns business/domain persistence,
the Vercel gateway, OpenAPI source and contract releases. Its Phase 1 identity
slice is implemented: a Next.js gateway, Clerk verification, an HMAC-signed
Convex transport, five Convex collections, and Clerk webhook handling. Validate that repository's `docs/AGENT_CONTEXT_SUMMARY.md` independently before cross-repository work. The backend now owns the canonical Site Inspection product and production-governance documents; a valid frontend fingerprint still does not imply a valid backend fingerprint.

## Source manifest

`incorporated_at_utc` is the time each source was read into this summary.

| Path | SHA-256 | Bytes | Incorporated UTC |
|---|---|---:|---|
| `README.md` | `c4d8d108e5406fee2ccbaf982a51daa1de9c9000d73701f00f83e6d4c731f492` | 6476 | `2026-08-20T08:27:52Z` |
| `docs/API_CONTRACT.md` | `0c5fe8d7f0dee25f2648543f180bbdc8c84c5e4ee63aba70a3c21bad9eb3445e` | 27648 | `2026-08-19T09:56:29Z` |
| `docs/CLERK_AUTH_DESIGN.md` | `ee704b756f4264a5c7c39f38b2db59ab9e387bb0b2ddf4df50dd4994edf8a2c2` | 22156 | `2026-08-19T09:56:29Z` |
| `docs/CONTRACT_CONFORMANCE.md` | `8624dffefc62de03ec47b9a814d293627f87ef0430e8b12069bdf1df987cfe5c` | 9245 | `2026-08-19T09:56:29Z` |
| `docs/CROSS_WORKSPACE_E2E_EXECUTION_PHASE_1.md` | `52c5fc1c1efe56a49004204350aac97775898b52316a6434305e7e4ce865dac8` | 4500 | `2026-08-19T09:56:29Z` |
| `docs/CROSS_WORKSPACE_E2E_RUNBOOK.md` | `3e87ed75ef3a8033b07af8cdd6b4842c51c34c8e93f6070e6e57cff3f36488d3` | 8634 | `2026-08-19T09:56:29Z` |
| `docs/CROSS_WORKSPACE_INTEGRATION_STATUS.md` | `2bde741a3989a2955633814065802d126a778b7c3dd052b6221694cc6787f0b1` | 5982 | `2026-08-19T09:56:29Z` |
| `docs/DD_API_CONFORMANCE.md` | `202ecee10923e37d04011418a3746486d8b681821ea0b90b9243d7fffd79dafc` | 1422 | `2026-08-19T09:56:29Z` |
| `docs/DEAL_CHANGE_REQUESTS_API_CONFORMANCE.md` | `68e043bff31ace2bff8ef2aa92650c9022bdd957d274c6243735bd2601cf7746` | 2699 | `2026-08-19T09:56:29Z` |
| `docs/DEAL_READINESS_FRONTEND_HANDOFF.md` | `ad73e0c8a787a95b3d7535d8ca13af969c850e44a7268fb34881bb79591f977b` | 2852 | `2026-08-19T09:56:29Z` |
| `docs/E2E_ENVIRONMENT_BOOTSTRAP_CHECKLIST.md` | `0dc4283268059dda808c8b3865f891ef826c739f8405fab88892b4217dd23478` | 5922 | `2026-08-19T09:56:29Z` |
| `docs/FIGMA_ASSETS.md` | `5130a3fd9db00d07610a1cf0567cabede1d97da5e4a0b3c49c8be2784d9b9857` | 5582 | `2026-08-19T09:56:29Z` |
| `docs/FIGMA_SCREEN_MAP.md` | `6114b2ab2b4f0c01a3f6d0c933380ed7e4b71b7db3674513c44fbc79a4ba5a4e` | 5664 | `2026-08-19T09:56:29Z` |
| `docs/FRONTEND_CHECKLIST_AUDIT.md` | `98b868b783aaad262e54789801faaf5a44fa505410905effb975b49fc879e9f3` | 4112 | `2026-08-19T09:56:29Z` |
| `docs/GPU_RENTAL_CUSTOMER_PORTAL_UX_SPEC.md` | `0e9827a79ef837e6fb5a7d8c6ec219ac5d90cf1d184415338929ea6e8ea1dc47` | 5970 | `2026-08-20T07:43:26Z` |
| `docs/GPU_RENTAL_STAFF_OPERATIONS_UX_SPEC.md` | `7a3a5ea7a1450fa9a4df328e7b4a1a0a93073c8c2cb8f53090388309b58bd707` | 4748 | `2026-08-20T07:43:26Z` |
| `docs/INTEGRATION_DEFECT_AUTH_ME_401.md` | `54eec846dcb056bbd85f858877c970ee92fc4240a7c413c693fdc5e9be05b66c` | 18521 | `2026-08-19T09:56:29Z` |
| `docs/KANBAN_INTEGRATION.md` | `bb9616032bb68609c96185c50fd14127c4d50759a2a91b7a7753b40af5905515` | 5175 | `2026-08-19T09:56:29Z` |
| `docs/KYC_API_CONFORMANCE.md` | `e199fe0c695f8e42200b027201bc2f7ab68215bcaf630d2fd9c6113bdfe592c9` | 1515 | `2026-08-19T09:56:29Z` |
| `docs/KYC_NCNDA_INTEGRATION_PHASE_1_HANDOFF.md` | `2fbeac4b342964c7e76a5a8206c040ec2d1d98882dc67af170894f784bb5e679` | 4986 | `2026-08-19T09:56:29Z` |
| `docs/LEGAL_COMPLIANCE_BACKEND_REQUIREMENTS.md` | `18cb4c97b53fde4d5ad9d0dccbc0d189d93d7b1df3b30d36aa37b6720f583c3d` | 3469 | `2026-08-19T09:56:29Z` |
| `docs/MANAGER_ADMIN_INTEGRATION_PHASE_1_HANDOFF.md` | `38c50fdcd0a68143b8b97ffbb38ba679c76ca6217a2939540f1a2f5802485855` | 3922 | `2026-08-19T09:56:29Z` |
| `docs/MOTION.md` | `9eb1b8f6b1f9fea64af705092362c1f7759767c9ff3df3388b5f29e7178127e7` | 3229 | `2026-08-19T09:56:29Z` |
| `docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md` | `576204a850a1d2a8e515cf80389fe4158f5699ac203a8914923fec8cec1c4a29` | 19974 | `2026-08-19T09:56:29Z` |
| `docs/PIPELINE_TRANSITION_POLICY_HANDOFF.md` | `f4c629f6cd0550a6352fd87684f622577131cf13feac2d7d40c70a555dfa8c35` | 3430 | `2026-08-19T09:56:29Z` |
| `docs/PRODUCT_DATA_BACKEND_REQUIREMENTS.md` | `a72fa7d714d9a4ac75c6e3734bedd492151d8f8d96a80b4d6ca97c3f66ebf9ce` | 2188 | `2026-08-19T09:56:29Z` |
| `docs/SALES_BOARD_CONTRACT_GAP.md` | `a8080655eb3523e9f677bf10aa730ec80de40b5112cdf85b0f42af652a706dc9` | 7952 | `2026-08-19T09:56:29Z` |
| `docs/SALES_INTEGRATION_CANDIDATE_V1_HANDOFF.md` | `60f618c4e065e59d3c71fb1e8691b802c142a9afbf3abe9d11eebaf22c0288c3` | 7388 | `2026-08-19T09:56:29Z` |
| `docs/SALES_WORKSPACE_API_CONFORMANCE.md` | `17d6e625d80ba101f2efd12c596791b46604014edd0eb1fef284109eb766caec` | 1691 | `2026-08-19T09:56:29Z` |
| `docs/SITE_INSPECTION_DOCUMENTATION_MAP.md` | `5fdc3ccfb0b4d856125ab28c43d22167c2c9d9525937cd83b002602532279cbb` | 4076 | `2026-08-20T08:27:52Z` |
| `docs/SITE_INSPECTION_FE_DEVELOPMENT_GUIDE.md` | `c40e84cd813716d31d3d2467abc5a48d3ad4f56ddb5f38e1d0a6fe6d2b9f75e4` | 13966 | `2026-08-20T08:27:52Z` |
| `docs/SITE_INSPECTION_MOCK_DEMO_SPEC.md` | `08deba8a022c765bad745336f815f283740f16ac6348540cc178b7e19e4ab813` | 17876 | `2026-08-20T08:04:15Z` |
| `docs/SITE_INSPECTION_UX_FRONTEND_SPEC.md` | `c1e611a11e06057304757c03465206c9eeb79296365b258a4252c3ecba605ca0` | 19948 | `2026-08-20T08:04:15Z` |
| `docs/SUBMISSIONS_API_CONFORMANCE.md` | `1fcec4daf3a71f2da3952fe988211f1f12bc353bcb55244faf2cfbac2c1f87d1` | 1221 | `2026-08-19T09:56:29Z` |
| `docs/TECHNICAL_DD_SECURE_DOCUMENTS_INTEGRATION_HANDOFF.md` | `de527e2db36ab4c21f50da63390007a7fb7a6c4f7216b31c36395391c58bace3` | 6402 | `2026-08-19T09:56:29Z` |
| `docs/VERIFICATION.md` | `ded70d6a41ee66bf68f7690b9791654c8e158322a324a68ccc5f092266a3b21b` | 5704 | `2026-08-19T09:56:29Z` |
| `docs/WORKSPACES_DESIGN.md` | `ad7544376098917cdad9b86c0a71a9af9d1681530c34140853c222b16d7acfed` | 9072 | `2026-08-19T09:56:29Z` |

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
