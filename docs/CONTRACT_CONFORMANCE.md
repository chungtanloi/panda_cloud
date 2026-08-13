# Contract conformance — frontend

Audit of this repository against
`PandaCloudBackend/docs/collaboration/frontend-backend-collaboration-workflow.md`
(workflow v1.0, 2026-08-12).

**Status: not yet conformant.** The frontend was built before the workflow
existed, against a hand-written contract in this repo. That contract is now a
*second source of truth*, which § 1.2 forbids. This document records what was
already aligned, what has been fixed, and what needs a Change Request before it
can be.

Per § 15, an FE agent may not edit the OpenAPI source or invent fields. Every
divergence below is therefore written as a **Change Request for the FE and BE
owners**, not applied unilaterally.

---

## 1. Already conformant

| Rule | Where |
|---|---|
| § 1.1 Frontend talks only to the public gateway | `services/http.ts` is the only `fetch` call site; no Convex import exists anywhere |
| § 1.1 One public boundary | `services/endpoints.ts` holds every path; nothing else contains a URL |
| § 7 URLs kebab-case, JSON camelCase | All paths and payloads |
| § 7 Error codes UPPER_SNAKE_CASE | `models/common.ts` |
| § 7 Empty list is `[]` | Mock adapter returns arrays, never null |
| § 7 Dates ISO-8601 UTC | `IsoDateTime` / `IsoDate` throughout |
| § 7 Resource ids opaque | No code parses an id's format |
| § 7.1 401 vs 403 split | `http.ts` maps them separately; `RoleGuard` renders 403 distinctly |
| § 13 FE component states | Every screen has loading / empty / error / success |

## 2. Fixed in this pass

| Rule | Change |
|---|---|
| § 7.2 Error body | `ApiErrorBody` was `{ error: { code, message, details: Record<string,string[]> } }`. Now the flat `{ errorCode, message, correlationId, details: [{field?, reason}] }` the workflow specifies. |
| § 7.2 `details[]` without a field | Previously dropped. Now surfaced as `formErrors` — cross-field rule failures were being silently swallowed. |
| § 7 `X-Correlation-Id` | The client now sends one on every request and echoes back whatever the gateway returns. Exposed on `NormalizedError.correlationId` for defect tickets (§ 18). |
| § 7.3 Cursor pagination | `CursorPage` / `CursorQuery` added and documented as the default; page pagination kept but marked as requiring a justified requirement. |
| § 7 Money | `Money` (minor-unit integer + ISO 4217) added. Existing fields not yet migrated — see CR-002. |
| § 9 Pinned release | `NEXT_PUBLIC_CONTRACT_VERSION` added; `assertApiConfig` warns when unpinned. |
| § 1.1 Gateway boundary | `assertApiConfig` now refuses a base URL that does not end in `/api/v1`. |
| § 7 Error codes | `VALIDATION_FAILED` → `VALIDATION_ERROR`, `UNAUTHORIZED` → `UNAUTHENTICATED`, `INTERNAL` → `INTERNAL_ERROR`. |

## 3. Change Requests — blocked pending FE/BE owner approval

### CR-001 — Success envelope is unspecified

§ 7.2 defines the error body but the workflow never states whether success
payloads are wrapped in `data`.

`http.ts` currently accepts **both** a wrapped and a bare payload. That
tolerance is a liability: it means a backend that changes shape mid-release
would not fail loudly. Needs a decision, then the tolerance is removed.

### CR-002 — Money is represented as a major-unit float

§ 7 requires a minor-unit integer plus ISO 4217. The current models carry
`dealValueUsd`, `capexEstimateUsd`, `amountUsd`, `hourlyRateUsd`,
`totalInvestmentUsd` and similar as **floating dollars with the currency baked
into the field name**.

Two concrete problems: a float cannot represent every cent exactly, and the
currency cannot ever be anything but USD. Migration changes the wire shape on
every commercial endpoint, so it must be agreed before freeze — not after.

### CR-003 — Custom refresh-token endpoint vs Clerk

§ 7.1: *"Clerk SDK owns session refresh. PandaCloud does not create a custom
refresh-token API without a new approved requirement."*

This repo implements its own `POST /auth/refresh` with refresh-and-replay, and
stores both tokens in `localStorage` (`services/tokenStore.ts`). That predates
the rule and conflicts with it.

Migrating to Clerk removes `tokenStore`, `/auth/refresh`, and the retry branch
in `http.ts`, and changes `AuthContext` to read the Clerk session. The refresh
logic is quarantined in one function so the swap is contained, but this is the
largest single piece of work in this list.

Storing a long-lived refresh token in `localStorage` is also the weaker option
against XSS; Clerk's httpOnly cookie handling is a security improvement, not
only a compliance one.

### CR-004 — File uploads go through the gateway as multipart

§ 7.4 is explicit: *"The browser never uploads binary data through a generic
multipart endpoint on the Vercel gateway."* The required flow is
upload-session → signed URL → direct PUT to private Supabase Storage →
finalize with metadata and checksum.

Current behaviour violates this in two places:

- `api.investment.uploadKycDocument(file)` → `POST /investments/kyc-documents` (multipart)
- `api.hyperscale.uploadRfpDocument(file)` → `POST /hyperscale/documents` (multipart)

KYC documents are identity papers, so this is the divergence with the highest
consequence: the current path streams them through the gateway and has no
checksum, no malware-scan gate, and no `malwareScanStatus` before the file is
treated as attached.

Implementing § 7.4 needs the upload-session and finalize operations in the
contract first.

### CR-005 — Role enum casing

§ 7 requires `lower_snake_case` for enums. `UserRole` is `USER` | `SALES` |
`MANAGER` | `ADMIN`.

Either the enum becomes `user` | `sales` | `manager` | `admin`, or the workflow
records an explicit exception for role values. `models/auth.ts` already has
`normalizeUserRole()` handling case-insensitively, so the frontend can absorb
whichever is chosen — but the contract must state one.

### CR-006 — This repository holds a second contract

`docs/API_CONTRACT.md` is a hand-written HTTP contract covering auth, all four
wizards, dashboard, leads, workspace resources and the sales pipeline.

§ 1.2 permits exactly one source of truth, in the backend repo, as OpenAPI 3.1.
This file must not survive as a contract. It should be re-labelled and used as
**requirements input** for the OpenAPI drafting, then deleted once the
operations exist in `api-contracts/`.

The endpoint shapes in it were designed from the Figma screens and are a
reasonable starting draft — but they are a proposal, not an agreement.

### CR-007 — Hand-written client instead of the generated one

§ 9 and § 10: the frontend consumes an Orval-generated TypeScript client built
from the pinned bundle. `services/http-impl/` is hand-written.

The architecture makes this swap cheap — `services/api.ts` selects an adapter
behind the `ApiClient` port, so the generated client becomes a third adapter and
no component changes. But until then, request and response types are asserted
by hand and can drift without CI noticing.

### CR-008 — Mock adapter is a parallel implementation, not a fixture

§ 11: Prism serves the frozen bundle; MSW covers stateful and edge cases; static
JSON is allowed *"only as a fixture typed by generated schemas"*.

`services/mock/` is a full second implementation with its own business logic —
ESG scoring, CapEx projection, quote arithmetic, ROI. It let the UI be built and
demonstrated with no backend, which was the right call at the time, and every
formula is commented as a placeholder.

It is not contract-derived, so it can drift silently. Target state: Prism for
happy paths from the bundle, MSW for the edge cases, and the projection helpers
in `lib/` deleted once the backend computes them.

## 4. Not applicable to this repository

| Rule | Note |
|---|---|
| § 6, § 8 OpenAPI authoring, SemVer, `oasdiff` | Backend-owned. The FE contributes review, not source. |
| § 10 Spectral / Redocly gates | Run in the backend pipeline. |
| § 12 Environments | The FE only needs the Integration base URL and the pinned version. |

## 5. Suggested order

1. **CR-006** — stop maintaining a second contract. Cheapest, and it unblocks the rest.
2. **CR-001, CR-005** — small shape decisions that should be settled before freeze.
3. **CR-002** — money migration touches every commercial endpoint; do it before freeze, not after.
4. **CR-003** — Clerk. Largest change; the security argument makes it worth doing early.
5. **CR-004** — upload sessions. Needs new contract operations.
6. **CR-007, CR-008** — generated client and Prism/MSW, once a release exists to generate from.

## 6. Reporting an integration defect

Per § 18, a defect ticket must carry the environment, contract version and
correlation id. All three are now available:

```ts
import { apiConfig } from "@/services/config";
import { normalizeError } from "@/services/api";

const error = normalizeError(cause);
// error.correlationId    — echoed from the gateway
// apiConfig.contractVersion — the pinned release
// apiConfig.baseUrl         — identifies the environment
```
