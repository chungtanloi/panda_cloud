# Agent Documentation Context Summary

## Cache metadata

- `schema_version`: `1`
- `repository`: `panda_cloud`
- `branch_at_refresh`: `main`
- `head_at_refresh`: `006d1774dffa4e1c7d1ad396cba2fa753a350719`
- `source_file_count`: `9`
- `source_fingerprint`: `6dfa6d0975ff8388eff598a1cbba040d96bcf739f6fdfa520ee4a2657e3fa258`
- `last_full_read_at_utc`: `2026-08-13T07:41:32Z`
- `last_context_refresh_at_utc`: `2026-08-13T07:41:32Z`

The branch and HEAD values are diagnostic only. The manifest includes dirty and
untracked documentation, and the content fingerprint is the cache-validity
authority.

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
  and a pinned `NEXT_PUBLIC_CONTRACT_VERSION`.
- The public integration boundary is the backend's versioned Vercel HTTP
  gateway. The frontend must not import Convex schemas/functions or connect to
  the database directly.
- Production product records, prices, stock, capacity, financing inputs, and
  availability belong to backend-owned data sources. Static frontend config may
  contain approved presentation copy and layout metadata only.

## Current documented status

- Marketing pages, authentication, Choose Your Path, the five-step Land Owner
  Assessment, and Dashboard Overview are documented as built. Some marketing
  imagery remains placeholder content.
- GPU Cluster Booking, AI Token Investment, and Hyperscale flows are mapped in
  Figma but are marked not started in the screen map. The financing and
  infrastructure pages require text verification from their design sources.
- The static verification audit found architectural rules satisfied and fixed
  two broken primary CTA destinations. It did not run `typecheck`, `lint`, or
  `build`; those commands remain required before treating the application as
  build-verified.
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
  Hyperscale paths.
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
  operation for a non-staff token. Missing roles default to customer.
- The Kanban package may ship a conflicting Tailwind preflight reset; if styles
  drift on the sales page, disable preflight in the library and rebuild it.

## Frontend-backend contract

- `docs/API_CONTRACT.md` is structured requirements input consumed by the
  existing UI. It is explicitly not the contract and must shrink as operations
  enter the backend-owned OpenAPI source.
- The backend repository owns the OpenAPI 3.1 source and tagged contract
  releases. The frontend pins and verifies a generated client artifact rather
  than following backend `main` or keeping a copied YAML contract.
- The repository is documented as not yet contract-conformant. Open decisions
  include success-envelope policy, minor-unit money migration, Clerk replacing
  custom refresh tokens, signed direct-to-storage uploads, lower-snake-case role
  enums, removal of the second contract, generated-client adoption, and
  replacing the full mock implementation with contract-derived Prism/MSW
  behavior.
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
- Long-lived refresh tokens in local storage and frontend-managed refresh are
  transitional; the approved target uses Clerk session management.

## Gaps and open questions

- The backend OpenAPI source, tagged release, generated client, and contract
  gates described by the collaboration workflow are not yet present for the
  frontend to consume.
- Production operations remain required for GPU purchase inventory, broader
  infrastructure inventory, financing products, and backend-owned financing
  calculations.
- Many Figma assets are unexported, Assessment Step 4 lacks a source design, and
  the Request Received and Hyperscale landing experiences need source/fidelity
  confirmation.
- Canonical auth timing, CTA destinations, transaction/provider states,
  formulas, pricing sources, and customer-dashboard entities must be confirmed
  rather than inferred from mock screens.
- Contract Change Requests CR-001 through CR-008 require FE and BE owner review.

## Cross-repository dependency

The sibling `../PandaCloudBackend` repository owns business/domain persistence,
the future Vercel gateway, OpenAPI source and contract releases. Validate that
repository's `docs/AGENT_CONTEXT_SUMMARY.md` independently before cross-repo
work. A valid frontend fingerprint does not imply a valid backend fingerprint.

## Source manifest

`incorporated_at_utc` is the time each source was read into this summary.

| Path | SHA-256 | Bytes | Modified UTC | Incorporated UTC |
|---|---|---:|---|---|
| `README.md` | `0fb7faa7e9127c6862fbb821a83904a0c4bb9547a6ba01cf8b87d9b0489397ff` | 4757 | `2026-08-13T06:32:01.674Z` | `2026-08-13T07:41:32Z` |
| `docs/API_CONTRACT.md` | `b583e15c5c14e15d4316ed459bab052fa542169fb5bcb4f3a10a53b253447bdc` | 27648 | `2026-08-13T06:32:01.675Z` | `2026-08-13T07:41:32Z` |
| `docs/CONTRACT_CONFORMANCE.md` | `31d985af65e924484b1cdded5288f3e54007df7d5f261cc3da9e35d1f5c59144` | 9247 | `2026-08-13T06:32:01.676Z` | `2026-08-13T07:41:32Z` |
| `docs/FIGMA_ASSETS.md` | `5130a3fd9db00d07610a1cf0567cabede1d97da5e4a0b3c49c8be2784d9b9857` | 5582 | `2026-08-13T06:32:01.677Z` | `2026-08-13T07:41:32Z` |
| `docs/FIGMA_SCREEN_MAP.md` | `6114b2ab2b4f0c01a3f6d0c933380ed7e4b71b7db3674513c44fbc79a4ba5a4e` | 5664 | `2026-08-13T06:32:01.677Z` | `2026-08-13T07:41:32Z` |
| `docs/KANBAN_INTEGRATION.md` | `bb9616032bb68609c96185c50fd14127c4d50759a2a91b7a7753b40af5905515` | 5175 | `2026-08-13T06:32:01.678Z` | `2026-08-13T07:41:32Z` |
| `docs/MOTION.md` | `9eb1b8f6b1f9fea64af705092362c1f7759767c9ff3df3388b5f29e7178127e7` | 3229 | `2026-08-13T06:32:01.678Z` | `2026-08-13T07:41:32Z` |
| `docs/PRODUCT_DATA_BACKEND_REQUIREMENTS.md` | `a72fa7d714d9a4ac75c6e3734bedd492151d8f8d96a80b4d6ca97c3f66ebf9ce` | 2188 | `2026-08-13T06:32:01.679Z` | `2026-08-13T07:41:32Z` |
| `docs/VERIFICATION.md` | `ded70d6a41ee66bf68f7690b9791654c8e158322a324a68ccc5f092266a3b21b` | 5704 | `2026-08-13T06:32:01.679Z` | `2026-08-13T07:41:32Z` |
