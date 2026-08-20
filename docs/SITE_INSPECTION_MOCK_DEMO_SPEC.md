# Site Inspection Full-Journey Mock and Demo Specification

**Status:** Approved scope for a frontend-only prototype; not production behavior

**Suite revision:** 1.2

**Audience:** Product, Design, Frontend, QA, Technical Review, and Demo Presenters

**Canonical source:** Backend repository `docs/business/AI_ASSISTED_SITE_INSPECTION_SPEC.md`

**Repository ownership:** This document is the authoritative mock/demo specification. The mock must conform to production-shaped frontend interfaces but does not define the production HTTP contract.

**Runtime:** `NEXT_PUBLIC_API_ADAPTER=mock`; no backend, OpenAI, n8n, storage, scanner, email, Sales, or PDF-rendering dependency

## 1. Demo objective

Deliver a credible, deterministic demonstration of the entire customer and Technical reviewer journey:

```text
Landing
  -> Setup
  -> Guided capture
  -> Simulated evidence preflight
  -> Completeness review
  -> Simulated provisional analysis
  -> Technical queue
  -> Claim and approve/override
  -> Simulated final reviewed report
  -> Customer results refresh
```

The prototype demonstrates intended interaction and architecture. It does not perform technical inspection, file security scanning, AI analysis, certification, report issuance, or real staff review. Every inspection/reviewer screen displays `Prototype — simulated AI analysis and review` (`INS-UX-008`).

## 2. Scope

### 2.1 Included

- All customer routes and Technical queue/detail routes.
- Existing mock authentication and workspace guards.
- One versioned US demo profile with 8–12 original demonstration criteria.
- Local JPEG, PNG, WebP, and PDF selection/preview.
- Deterministic upload/scan/preflight/analysis delays and failures.
- Conditional task activation simulation through the same rule projection used by production DTOs.
- Draft resume from non-sensitive versioned metadata.
- Provisional findings with evidence citations.
- Reviewer claim, conflict, approve, override, finalization, and customer final-result refresh.
- Seven resettable scenarios.
- Component/service tests and presenter runbook.

### 2.2 Excluded

- Real file upload, checksum, encryption, malware scan, OCR, AI, web search, email, Sales submission, audit persistence, PDF generation/download, backend organization creation, or SLA notification.
- Browser camera capture; local file selection only.
- Production standards text or an assertion of real readiness.
- Admin profile-authoring UI in the demo track; the demo consumes a fixed mock profile DTO. Production profile administration remains documented in the full suite.
- Cross-device synchronization, multi-browser persistence, or real multi-user concurrency.

## 3. Architectural invariants

The prototype uses the repository's existing adapter selection:

```text
route/component
  -> controller
  -> api.siteInspections / api.inspectionReview / api.inspectionProfiles
  -> mock services and fixtures
```

Rules:

- Components do not import fixture files or branch on adapter mode.
- Components never call `fetch`, storage APIs, OpenAI, or environment variables.
- Mock and HTTP adapters implement the same `ApiClient` interfaces.
- Business state transitions live in the mock service/domain helpers, not click handlers.
- IDs, timestamps, revisions, pagination, error envelopes, and enums match proposed production DTOs.
- The mock may simulate latency/outcomes but cannot add fields that exist only for demo presentation.
- Demo controls are supplied by a separate mock-only presenter component and are not part of domain DTOs.

## 4. Required service surface

The mock implements every method used by the demo in:

- `SiteInspectionService` for profiles, create/read/update, tasks, evidence, completeness, submit, analysis, results, explanations, and reports.
- `InspectionReviewService` for queue/detail, claim, release, reassign, resolve criterion, and finalize.
- `InspectionProfileAdminService` with read-only demo profile operations or explicit `NOT_IMPLEMENTED` for out-of-scope mutations; customer pages must not need Admin operations.
- `DocumentsService` for simulated upload session, local upload, finalize metadata, document summary, and simulated download limitation.

The mock service returns the same `ApiError` codes/status semantics documented for HTTP: `401`, `403`, `404`, `409`, `422`, `429`, and `503` where scenarios require them.

## 5. Demo profile and fixtures

### 5.1 Profile

Use one clearly labeled profile:

- Code: `demo_us_dc_electrical_readiness`.
- Name: `Demo US Data Center & Electrical Readiness`.
- Version: `1` / `published` fixture.
- Market: US.
- Criteria: 8–12 original demonstration items across electrical service, power continuity, maintenance evidence, fire protection, battery/UPS, cooling, and physical/site context.

Fixture criterion language must be original, brief, non-certifying, and not copied from TIA, ISO, NFPA, or another protected standard. Every criterion includes criticality, evidence requirement, safe capture instruction, deterministic applicability rule, and approved demo remediation.

### 5.2 Opaque records

Use stable opaque IDs such as `insp_demo_ready`, `task_demo_service_overview`, and `evid_demo_001`; UI never derives meaning from the string. Timestamps are generated from a scenario base clock so ordering and SLA displays are deterministic.

All records include organization ID, profile version, positive revision, ISO timestamps, and explicit statuses. The mock profile/results must remain production-shaped DTOs.

### 5.3 Demo evidence

- Local user-selected files display an object URL preview for the current browser session.
- Seeded evidence uses approved generic placeholders or sanitized owned demo assets, never fabricated imagery presented as real technical evidence.
- PDF shows document icon, name, page-count fixture, and preview-unavailable state unless a safe local browser preview is implemented.
- File names are escaped and never injected as HTML.

## 6. Scenario selection and reset

Supported query parameter:

```text
?demoScenario=ready|retake|critical|override|missing|outage|conflict
```

Rules:

- It is read only when `NEXT_PUBLIC_API_ADAPTER=mock`.
- Missing/unknown value defaults to `ready` and shows a presenter notice for unknown values.
- Scenario switching requires explicit reset confirmation because it replaces local demo state.
- A visible presenter drawer may select/reset scenarios in mock mode.
- Presenter controls do not render in HTTP mode and are excluded from production navigation.
- Reset revokes object URLs, clears the demo storage key, re-seeds the chosen scenario, resets the deterministic clock, and navigates to the documented start route.

## 7. Deterministic scenarios

### 7.1 `ready`

Goal: demonstrate the smooth complete journey.

- All initially applicable evidence is accepted after simulated preflight.
- One extracted `battery_system_present` fact activates a pre-authored battery task.
- Completeness reaches all required critical/high evidence.
- Provisional overall verdict is `ready` with a review-pending label.
- Reviewer claims and approves all required items.
- Final report remains `ready` and customer page changes to reviewed/final.

### 7.2 `retake`

Goal: demonstrate in-field AI assistance.

- First selected image for one task becomes `retake_required` with `Image is too blurred to read the requested label`.
- Another evidence fixture may become `wrong_evidence` to show requested-view correction.
- Replacement uses a new evidence ID; prior evidence remains visible as replaced/ineligible history or is detached according to the proposed DTO behavior.
- Accepted replacement completes the task.
- No retake/wrong evidence supports `pass`.

### 7.3 `critical`

Goal: demonstrate risk-bearing behavior.

- One critical criterion has accepted evidence supporting `fail`.
- Provisional and final overall verdict are `not_ready`.
- Finding displays direct observation, evidence citation, limitation, and approved remediation.
- Reviewer cannot finalize a `ready` result without changing the underlying criterion through an explicit audited-style override simulation.

### 7.4 `override`

Goal: demonstrate Technical accountability.

- AI proposes one high criterion as `fail` or `not_verified`.
- Reviewer examines two evidence citations and selects a different final verdict.
- Empty/whitespace reason and unchanged customer rationale are rejected where change is required.
- Valid override increments revisions and appears in final customer-safe result as reviewed rationale; internal reason is not exposed to the customer.

### 7.5 `missing`

Goal: demonstrate explicit limitations.

- Customer marks a required task unavailable.
- Completeness predicts `not_verified` and requires acknowledgement.
- Submit with limitations succeeds.
- Missing critical evidence produces `not_ready`; lower-criticality missing evidence follows deterministic rules.
- Reviewer confirms or resolves without converting absence to `pass`.

### 7.6 `outage`

Goal: demonstrate recovery.

- First preflight or full-analysis attempt becomes `retryable_failed` with `AI_PROVIDER_UNAVAILABLE`/`503`.
- UI explains that evidence is safe and analysis is delayed.
- Retry uses the same logical run and idempotency key; attempt count increments once.
- Second configured attempt completes deterministically.
- No failure state creates a criterion verdict.

### 7.7 `conflict`

Goal: demonstrate optimistic concurrency.

- The first reviewer claim/update attempt returns `409 REVISION_CONFLICT` with a safe current projection.
- UI reloads and shows current claimant/revision.
- Presenter can reset or release/retry deliberately.
- No blind retry or duplicate override/final report occurs.

## 8. Local file simulation

### 8.1 Allowed files

- JPEG: `image/jpeg`.
- PNG: `image/png`.
- WebP: `image/webp`.
- PDF: `application/pdf`.

Demo configuration defines size/page display limits matching the profile fixture. Browser checks provide immediate feedback but are not represented as production security validation.

### 8.2 Simulated pipeline

```text
choose file
  -> create object URL + transient File registry
  -> uploading
  -> scanning
  -> analyzing
  -> scenario outcome
```

Default deterministic timing, configurable through mock config:

| Stage | Default delay |
|---|---:|
| Create upload session | 150 ms |
| Upload progress | 600 ms in predictable increments |
| Finalize/scanning | 700 ms |
| Evidence preflight | 1,200 ms |
| Full inspection analysis | 2,500 ms |
| Report finalization/render simulation | 900 ms |

Tests use fake timers and do not wait in real time. Reduced-motion changes animation, not lifecycle duration/state.

### 8.3 Object URL lifecycle

- Create object URL only after file selection.
- Revoke on replacement, removal, reset, provider unmount, and page/session cleanup where ownership ends.
- Object URL/file bytes are held in an in-memory registry keyed by mock document ID.
- Never write `File`, `Blob`, base64, ArrayBuffer, or object URL to local storage.
- After full reload, metadata resumes but local preview shows `Local preview expired — choose the file again to preview or replace it`.
- Accepted scenario state may remain for workflow demonstration, but the disclosure states that production would require a persisted clean private document.

## 9. Metadata persistence

Storage key:

```text
panda-cloud:site-inspection-demo:v1
```

Persist only:

- Schema version and scenario.
- Mock organization/user references.
- Inspection/task/evidence/document metadata without bytes/object URLs.
- Evidence/AI/result/report states.
- Revisions and deterministic timestamps.
- Selected route-safe UI identifiers where useful.

Do not persist:

- File bytes, object URLs, data URLs, signed URLs, extracted text, contact/site address entered by a real customer, credentials, prompt/model payloads, or reviewer free text from outside seeded demo content.

On schema mismatch/corrupt data, discard safely, seed the selected scenario, and show `Demo state was reset because its version changed.`

## 10. Mock state machines

Mock services enforce the canonical state machines and reject illegal transitions with `409 INVALID_STATE_TRANSITION`.

Inspection:

```text
draft -> capturing -> ready_for_submit -> submitted -> analyzing
      -> provisional_ready -> in_review -> finalized
```

Evidence:

```text
uploading -> scanning -> analyzing -> accepted
                                  -> retake_required
                                  -> wrong_evidence
                                  -> manual_review
uploading|scanning|analyzing      -> failed
```

AI run:

```text
queued -> running -> completed
                  -> retryable_failed -> queued
                  -> permanent_failed
```

Reviewer mutations require the current positive revision and claimant. Finalization creates exactly one final report fixture with immutable hash.

## 11. Deterministic verdict projection

The mock uses the same pure verdict helper intended for backend contract tests:

- Required missing/ineligible evidence -> `not_verified`.
- Critical `fail` or `not_verified` -> `not_ready`.
- No critical failure/uncertainty but lower finding -> `conditional`.
- `ready` only when all applicable critical/high pass and N/A confirmation rules are satisfied.

Fixture authors set observations/evidence; they do not hard-code a contradictory overall verdict. Tests assert that the derived verdict matches scenario expectation (`INS-API-005`, `INS-API-006`).

## 12. Route behavior in demo mode

### 12.1 Public/setup

Landing is presentation-ready and leads through existing mock login to setup. Setup uses a demo organization and the published profile fixture. Creating a new inspection is idempotent within the scenario.

### 12.2 Capture/review/results

Customer can select local files, watch states, resolve retake, mark unavailable, submit, watch analysis, and inspect findings/citations. A persistent simulation banner is visible. Results provide a presenter action/link to open the Technical queue in the same browser.

### 12.3 Technical review

Technical mock identity sees the seeded shared queue. Because the existing mock auth represents one browser identity at a time, the presenter may use the approved demo role switch/login mechanism; domain records persist in the mock store. Claim/override/finalize follows service methods and revisions.

### 12.4 Customer final result

After finalization, presenter returns/switches to customer identity and refreshes the same inspection. The results service returns final reviewed fixture. The download control shows a `Demo report preview` or explicit unavailable message; it does not generate a production-looking signed certificate/PDF.

## 13. Simulation disclosure and claims

Required banner:

> Prototype — AI analysis, security scanning, Technical review, report generation, and integrations are simulated. Do not use this result for operational or compliance decisions.

The disclosure appears on authenticated inspection and Technical pages and in demo report preview. Presenter may not hide it through a URL/control. Marketing content still describes the proposed service but labels prototype status in the demo environment.

The demo never uses `certified`, `code compliant`, `TIA compliant`, `Tier certified`, or similar claims for its output.

## 14. Error simulation

In addition to named scenarios, a mock-only developer configuration may select one-shot failures by operation:

- Unauthorized/forbidden/not found.
- Upload validation/finalize failure.
- Scanner unavailable.
- AI retryable/permanent failure.
- Revision conflict.
- Report render unavailable.
- Offline flag.

Failure injection is outside domain DTOs, resettable, disabled by default, and tree-shaken/not rendered in HTTP mode. Customer demo scenario behavior remains deterministic.

## 15. Tests

### 15.1 Unit/service

- Scenario seeds satisfy DTO/schema and canonical invariants.
- State transitions reject invalid movement.
- Verdict helper covers all criticality/verdict combinations.
- Idempotency repeats same outcome and rejects changed input.
- Revision conflicts cause no mutation.
- Conditional rule activates one task once.
- Finalization creates one immutable report.
- Persistence serializer excludes forbidden values/keys.
- Object URLs are revoked.

### 15.2 Component/integration

- Every route renders loading/success/error/empty/forbidden/conflict states.
- File selection, progress, preflight, retake/replacement, unavailable and citation flows work.
- Simulation disclosure is always present in mock inspection/reviewer routes.
- Queue claim/override/finalize and customer final refresh work.
- Scenario/reset controls exist only in mock mode.
- Keyboard, focus, live regions, reduced motion, responsive layouts pass.

### 15.3 Demo smoke

Run each scenario from reset through its intended endpoint. Verify zero network calls to backend/OpenAI/storage/email/Sales/report systems. Browser console has no unhandled error, object URL leak warning, hydration mismatch, or secret/signed URL.

## 16. Demo Definition of Done

- Seven scenarios are deterministic, resettable, tested, and documented.
- Full customer-to-reviewer-to-final-customer path works without backend services.
- Mock/HTTP adapter interfaces are identical and compile-time enforced.
- Local files never leave the browser or persist as bytes/object URLs.
- All simulated operations are visibly disclosed.
- Verdict/task state follows canonical rules; missing/failed evidence never passes.
- Responsive/accessibility acceptance passes the target demo device matrix.
- Presenter runbook can be followed without editing source or developer tools.
- Nothing in the prototype is represented as a real inspection, reviewed report, certification, or production security control.
