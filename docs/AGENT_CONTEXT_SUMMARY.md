# Agent Documentation Context Summary

## Cache metadata

- `schema_version`: `1`
- `repository`: `panda_cloud`
- `branch_at_refresh`: `main`
- `head_at_refresh`: `3c127eb239f33f09d3d48bb5bd68c159166a8c44` (diagnostic only; the
  working tree carries uncommitted Clerk-migration changes)
- `source_file_count`: `11`
- `source_fingerprint`: `41ba8d73cd21f9fcee3228c814c5fe623ce5977f65221ab7b1e0cbb073ef681f`
- `last_full_read_at_utc`: `2026-08-14T01:20:00Z`
- `last_context_refresh_at_utc`: `2026-08-14T02:35:00Z`

The branch and HEAD values are diagnostic only. The manifest includes dirty and
untracked documentation, and the content fingerprint is the cache-validity
authority.

> The previous summary recorded fingerprint
> `f2c95e01141e6e6b9130671ca5d04defe0da63431de560684c3e61492c8916b5` over 9
> files. That fingerprint was stale: `docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md`
> was absent from the manifest and `README.md` had changed. The complete corpus
> was therefore re-read on 2026-08-14 before any implementation work.

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
- The Clerk migration typechecks and builds clean in an isolated sandbox, with
  two caveats recorded in `HANDOFF.md` section 13: `@kanban/library` was
  substituted with a type stub, and no runtime behaviour was exercised against a
  live Clerk instance or gateway.
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

### Sales pipeline

- `/dashboard/sales` embeds the local `@kanban/library` project from
  `kaban_cloud/`. The library must be built before the host app installs/uses
  its `dist-lib` output.
- `components/sales/salesAdapter.ts` is the sole bridge between Kanban types and
  `api.sales`, preserving the common mock/HTTP adapter boundary.
- Customer submissions create cards in the backend; the frontend board does not
  expose delete/create behavior for that path. Lost deals preserve audit
  history.
- UI role guards are convenience only. The backend must reject every staff
  operation for a non-staff token. A missing membership means customer.
- The Kanban package may ship a conflicting Tailwind preflight reset; if styles
  drift on the sales page, disable preflight in the library and rebuild it.

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
| `README.md` | `15b1bef0151fb25b9bbf7c065ff15dfc63e0c6f0a700f5c367263295f2c49dd3` | 4683 | `2026-08-14T01:20:00Z` |
| `docs/API_CONTRACT.md` | `7c26ff7652057ac77bc601c9e7b6222b05093328fca6136274130ed455ee0220` | 26848 | `2026-08-14T01:20:00Z` |
| `docs/CLERK_AUTH_DESIGN.md` | `b95c75d980e37d599a8d4cb70da342a705996f031f47b6ba52fce9cad3c69223` | 21733 | `2026-08-14T02:35:00Z` |
| `docs/CONTRACT_CONFORMANCE.md` | `94f667969ce2b6d86ba40b915610e8bdaedccbef3965325ab5c3c34084ed7d1c` | 9063 | `2026-08-14T01:20:00Z` |
| `docs/FIGMA_ASSETS.md` | `612a2d81993d15d756802a82fb3449a4e3f0ae15749bd1cabe7a1fd73ba42c48` | 5507 | `2026-08-14T01:20:00Z` |
| `docs/FIGMA_SCREEN_MAP.md` | `66191f2f36aea246e6cfe8ae9daf92b46810bf31e0acbba5951d2255b17951f1` | 5545 | `2026-08-14T01:20:00Z` |
| `docs/KANBAN_INTEGRATION.md` | `108f770d7c38e681a6e0c438eaa5612d4fb2ffaeebced459cb3d1768213821d8` | 5047 | `2026-08-14T01:20:00Z` |
| `docs/MOTION.md` | `663f7dfcf504017172635bb7cfca548a741aa4c6849265401a29eed42b9176a3` | 3165 | `2026-08-14T01:20:00Z` |
| `docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md` | `b1457cf44f3952ccc4afde17a91f6a232a99fab4a7c9b408a143872654b2a4df` | 19055 | `2026-08-14T01:20:00Z` |
| `docs/PRODUCT_DATA_BACKEND_REQUIREMENTS.md` | `f847316fca11265e6e641f2e0f101de421d1e3b42222c7e90686406f17bac26d` | 2141 | `2026-08-14T01:20:00Z` |
| `docs/VERIFICATION.md` | `a0a61499a8710964691472e3f7bd39cce32181467ed5711385e908f0f5244ffb` | 5585 | `2026-08-14T01:20:00Z` |
