# Site Inspection Frontend Development Guide and Backlog

**Status:** Proposed executable frontend backlog

**Guide revision:** 1.0

**Applicable suite revision:** 1.2

**Owner:** Frontend

**Team assumption:** One Frontend engineer with part-time Product Design and QA support

**Master workflow:** Backend repository `docs/collaboration/SITE_INSPECTION_DEVELOPMENT_WORKFLOW.md`

## 1. Frontend implementation rules

- Follow the repository MVC boundary: models define DTO/domain types, services own I/O, controllers own behavior/state, and views render.
- Add `siteInspections: SiteInspectionService`, `inspectionReview: InspectionReviewService`, and `inspectionProfiles: InspectionProfileAdminService` to `ApiClient`. Both mock and HTTP adapters implement the same interfaces.
- Reuse `DocumentsService` for production-shaped evidence transfer. Demo-selected bytes remain session-local and never become authoritative documents.
- Components do not call `fetch`, read environment variables, choose adapters, derive authorization, calculate applicability or derive overall verdicts.
- HTTP mode uses only a pinned generated client from a released backend OpenAPI artifact. Proposed specs and mock fixtures are not a production contract.
- `NEXT_PUBLIC_API_ADAPTER=mock` may expose scenario/reset controls and simulated latency. Those controls do not render in HTTP mode, and HTTP failure never falls back to mock.
- Persist only versioned, non-sensitive demo metadata. Never persist `File`, `Blob`, byte content or object URLs. Revoke object URLs on replace, reset and unmount.

Authoritative behavior is defined by [the UX specification](SITE_INSPECTION_UX_FRONTEND_SPEC.md) and [mock/demo specification](SITE_INSPECTION_MOCK_DEMO_SPEC.md).

## 2. Backlog overview

| Task | Estimate | Depends on | Primary outcome |
|---|---:|---|---|
| `FE-D01` | 1 day | Approved proposed DTO/state input | Models, enums, three services and `ApiClient` registration. |
| `FE-D02` | 0.5–1 day | `FE-D01` | Versioned deterministic mock store and `ready` fixture. |
| `FE-D03` | 1 day | `FE-D02` | Landing, setup, organization/profile selection. |
| `FE-D04` | 1–1.5 days | `FE-D02` | Responsive capture shell, checklist, Copilot and local preview. |
| `FE-D05` | 1 day | `FE-D04` | Preflight states, retake/replacement and conditional task. |
| `FE-D06` | 1 day | `FE-D05` | Completeness, submit, analysis and provisional results. |
| `FE-D07` | 0.5–1 day | `FE-D06` | Technical queue/detail, claim/release and conflict. |
| `FE-D08` | 0.5–1 day | `FE-D07` | Approve/override, immutable finalization and customer final. |
| `FE-D09` | 1 day | `FE-D03`–`FE-D08` | Remaining scenarios, accessibility, error recovery and rehearsal. |
| `FE-H01` | 0.5–1 day | Released contract/client | Pin client and implement shared HTTP boundary. |
| `FE-H02` | 1 day | `FE-H01`, BE setup slice | Onboarding/profile/setup HTTP integration. |
| `FE-H03` | 1–2 days | `FE-H01`, BE evidence/preflight slices | Documents, tasks, evidence, resume and preflight integration. |
| `FE-H04` | 1–1.5 days | `FE-H03`, BE provisional slice | Completeness, submit, analysis/retry and results integration. |
| `FE-H05` | 1.5–2 days | `FE-H04`, BE review/admin slices | Technical review, reports and profile administration integration. |
| `FE-H06` | 1 day | `FE-H02`–`FE-H05` | Production errors, telemetry boundary and demo exclusion. |

The demo critical path is `FE-D01 -> FE-D02 -> FE-D04 -> FE-D05 -> FE-D06 -> FE-D07 -> FE-D08 -> FE-D09`; `FE-D03` begins after `FE-D02` and must finish before rehearsal.

## 3. Mock/demo task cards

### FE-D01 — Domain and service foundation

**Requirements:** `INS-PROD-001`, `INS-PROD-003`, `INS-PROD-004`, `INS-PROD-005`, `INS-UX-001`, `INS-UX-002`, `INS-UX-005`, `INS-UX-008`, `INS-API-002`, `INS-API-005`, `INS-API-006`, `INS-API-007`, `INS-API-010`.

Deliver opaque-ID DTOs, ISO timestamps, positive revisions, explicit lifecycle/evidence/verdict enums, criterion/evidence citations and the three service interfaces. Register them in `ApiClient`, mock adapter and an explicit HTTP placeholder/wrapper boundary so TypeScript prevents one-sided additions. Do not invent fields outside the proposed backend requirements input.

Acceptance: models have invariant tests; both adapters compile; controllers/views can import only the service port; verdict and applicability are read projections, not component calculations.

### FE-D02 — Deterministic mock engine

**Requirements:** `INS-UX-008`, `INS-API-002`, `INS-API-007`, `INS-API-008`, `INS-API-009`, `INS-SEC-003`, `INS-OPS-003`.

Implement schema-versioned metadata persistence, deterministic base clock, configurable fake latency, idempotency ledger, optimistic revisions, fixture reset and `ready` scenario. Separate durable metadata from session-only object URLs. Unknown/corrupt fixture versions fail closed to an explained reset.

Acceptance: reset is deterministic; repeat writes do not duplicate logical records; stale writes return `409`; no timer/network race makes tests flaky; no file bytes or object URLs enter storage.

### FE-D03 — Landing and inspection setup

**Requirements:** `INS-PROD-001`, `INS-PROD-002`, `INS-PROD-004`, `INS-UX-001`, `INS-UX-007`, `INS-UX-008`.

Own `/site-inspections` and `/inspections/new`. Implement claims/limitations, authentication return path, membership/self-service organization states, US site form, profile selection/version summary and setup validation. Published profiles render read-only.

Acceptance: public discovery distinguishes provisional, Panda Cloud reviewed and third-party certification; invalid form focus is correct; organization choices come from authorization context; successful create navigates to capture.

### FE-D04 — Guided capture shell and local evidence

**Requirements:** `INS-UX-001`, `INS-UX-002`, `INS-UX-003`, `INS-UX-004`, `INS-PROD-004`, `INS-SEC-003`, `INS-SEC-004`.

Own `/inspections/[id]/capture`. Build desktop checklist/capture/Copilot layout and mobile checklist/full-screen selector/Copilot bottom sheet. Support local JPEG, PNG, WebP and PDF selection, safe metadata display and session preview. Render uploading, scanning, analyzing, accepted, retake-required, wrong-evidence, manual-review and failed states.

Acceptance: checklist remains primary; feedback always states usable, missing and next safe action; keyboard/focus/touch behavior works; replace/reset/unmount revokes URLs; UI never asks for energized, invasive or testing activity.

### FE-D05 — Preflight problems and conditional tasks

**Requirements:** `INS-UX-003`, `INS-AI-006`, `INS-API-003`, `INS-API-005`, `INS-API-007`, `INS-QA-003`.

Implement `retake`, wrong-evidence, replacement/remove, manual-review and failed simulations. Activate the battery task once through the deterministic rule projection. Preserve prior evidence history as ineligible when replaced and never let it support a pass.

Acceptance: conditional activation occurs exactly once; retake/wrong/failed evidence cannot complete a task; focus/live-region announces task and status changes; scenario tests use fake timers.

### FE-D06 — Review, submission and provisional results

**Requirements:** `INS-PROD-003`, `INS-PROD-006`, `INS-UX-003`, `INS-UX-005`, `INS-API-004`, `INS-API-005`, `INS-API-006`, `INS-API-007`, `INS-OPS-001`.

Own `/inspections/[id]/review` and `/inspections/[id]/results`. Implement completeness groups, limitation acknowledgement, revision-frozen submit, simulated analysis stages/retry, provisional verdict/findings, evidence citations, remediation and grounded Copilot explanation. Add `critical`, `missing` and `outage` scenarios.

Acceptance: missing evidence becomes `not_verified`; critical fail/not-verified blocks ready; outage has no fabricated verdict; submission/retry are idempotent; provisional disclosure remains visible.

### FE-D07 — Technical queue, claim and conflict

**Requirements:** `INS-UX-001`, `INS-UX-004`, `INS-UX-006`, `INS-API-008`, `INS-OPS-002`.

Own `/technical/inspections` and `/technical/inspections/[id]`. Implement role guard, queue filters/priority/SLA, criterion navigator, evidence viewer, proposal panel, claim/release and `conflict` scenario.

Acceptance: customer role cannot enter Technical routes; claim requires current revision; conflict reloads safe current state without blind retry; claimed reviewer state remains explicit.

### FE-D08 — Override, finalization and final customer result

**Requirements:** `INS-PROD-003`, `INS-UX-005`, `INS-UX-006`, `INS-API-008`, `INS-API-009`, `INS-API-010`, `INS-SEC-005`.

Implement criterion approve/override, mandatory override reason, finalization confirmation, immutable report fixture/hash, `override` scenario and customer transition from provisional to reviewed final.

Acceptance: incomplete review cannot finalize; override reason is required and customer receives only safe rationale; repeated finalize produces one report; final result cannot be edited; provisional/final labels remain visually distinct.

### FE-D09 — Coverage, accessibility and rehearsal

**Requirements:** `INS-UX-004`, `INS-UX-008`, `INS-OPS-003`, `INS-OPS-004`, `INS-QA-003`, `INS-QA-004`.

Complete `ready`, `retake`, `critical`, `override`, `missing`, `outage` and `conflict`; loading, empty, offline, expired, forbidden, not-found and recovery states; keyboard, focus, screen-reader, zoom, touch and reduced-motion verification. Add mock-only presenter controls, zero-backend-call assertion, reset instructions and rehearsal checklist.

Acceptance: all seven scenario smokes pass; disclosure cannot be hidden; presenter controls do not render in HTTP mode; build/network inspection finds no production call; approved sample files contain no sensitive customer data.

## 4. HTTP integration task cards

### FE-H01 — Pinned client and HTTP wrappers

**Requirements:** `INS-API-001`, `INS-API-002`, `INS-SEC-003`.

Pin the released contract/client and checksum, wrap generated operations behind existing services, map the released error envelope to `ApiError`, and record the contract version in integration diagnostics. No component/controller change is allowed merely to switch adapters.

Acceptance: no handwritten response shape or duplicated OpenAPI; both adapters compile; adapter contract tests cover released methods and error codes.

### FE-H02 — Onboarding/profile/setup integration

**Requirements:** `INS-PROD-002`, `INS-UX-001`, `INS-UX-007`, `INS-API-001`, `INS-API-002`, `INS-API-010`.

Integrate self-service organization, published profile list and inspection create/read/update. Handle `401`, `403`, `404`, `409` and validation responses without revealing other-organization existence.

Acceptance: isolated customer fixtures pass; repeated create uses the same idempotency key; stale setup update reloads and asks for deliberate retry.

### FE-H03 — Documents, evidence, capture and preflight

**Requirements:** `INS-PROD-004`, `INS-UX-002`, `INS-UX-003`, `INS-API-003`, `INS-AI-001`, `INS-AI-004`, `INS-SEC-001`, `INS-SEC-004`.

Integrate `DocumentsService`, capture tasks, attach/remove/unavailable, evidence status, preflight status/retry and draft resume. Upload bytes only to the authorized short-lived URL; never send evidence to AI from the browser.

Acceptance: attachment waits for eligible clean state; interrupted upload can resume/restart as contract permits; expired URL is replaced through a new authorized session; signed URLs are not persisted or logged.

### FE-H04 — Submit, analysis and results

**Requirements:** `INS-PROD-003`, `INS-PROD-005`, `INS-PROD-006`, `INS-API-004`, `INS-API-005`, `INS-API-006`, `INS-API-007`, `INS-OPS-001`.

Integrate completeness, frozen submit, analysis status/retry, customer-safe result, finding explanation and evidence citations. Poll/backoff only as the released contract/run status permits.

Acceptance: no client verdict calculation; repeated submit/retry is safe; timeout/rate limit/outage remains explicit; results never expose provider payload, private note or storage path.

### FE-H05 — Review, reports and profile administration

**Requirements:** `INS-UX-005`, `INS-UX-006`, `INS-UX-007`, `INS-API-008`, `INS-API-009`, `INS-API-010`, `INS-OPS-002`.

Integrate Technical queue/detail/actions, report list/download session and Admin profile draft/validate/publish/retire. Use revision guards for all mutable actions and refresh immutable projections after success.

Acceptance: role matrix and cross-role negative tests pass; conflict is recoverable; override reason/finalize confirmation are enforced; expired download URL is never reused; published/final records are read-only.

### FE-H06 — Production hardening

**Requirements:** `INS-SEC-003`, `INS-OPS-003`, `INS-OPS-004`, `INS-QA-001`, `INS-QA-003`, `INS-QA-004`.

Complete production error taxonomy, correlation-ID support, safe telemetry, offline/interruption states, feature-disabled state and integration E2E. Assert demo controls, scenario query handling, role shortcuts, simulated latency and automatic mock fallback are absent from HTTP behavior.

Acceptance: production bundle/render paths do not expose demo controls; critical QA gates pass; provider/storage/scanner outage shows unavailable/retry state; telemetry excludes restricted data.

## 5. Handoff and validation

For each `FE-H*` task, attach the pinned contract/client version, operations consumed, UI states covered, fixture identities, commands run, screenshots for material states, correlation IDs for defects and deferred operations. A backend mismatch is reported; it is not normalized silently in a component.

Run before demo or integration handoff:

```text
npm run typecheck
npm run lint
npm test
npm run build
```

Frontend completion requires all task acceptance, no component-level transport/environment access, identical adapter interfaces, no persisted file bytes/object URLs, and no mock fallback in HTTP mode.
