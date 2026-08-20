# Site Inspection UX and Frontend Implementation Specification

**Status:** Proposed implementation specification

**Suite revision:** 1.2

**Audience:** Product Design, Frontend, QA, Technical Review, and Profile Administration

**Canonical source:** Backend repository `docs/business/AI_ASSISTED_SITE_INSPECTION_SPEC.md`

**Repository ownership:** This document is the authoritative frontend implementation specification. Proposed HTTP operations remain subordinate to a released backend-owned OpenAPI contract.

**Contract authority:** Released backend-owned OpenAPI and generated frontend client

## 1. Purpose and boundaries

This document makes the canonical customer, reviewer, and profile-administration journeys implementation-ready. It does not approve HTTP operations, criterion content, standards claims, or production AI configuration. Those remain governed by the canonical specification and backend-owned contract.

The frontend follows the repository MVC boundary:

- Models contain DTOs and view-safe domain types.
- Services are the only network/environment boundary.
- Controllers own async behavior, orchestration, polling, and transient UI state.
- Routes and components render state and never call `fetch` or read environment variables.
- `api.siteInspections`, `api.inspectionReview`, and `api.inspectionProfiles` must be implemented by mock and HTTP adapters before any page consumes them.

Related requirements: `INS-PROD-001`–`006`, `INS-UX-001`–`008`, `INS-API-001`–`010`, `INS-SEC-001`–`006`.

## 2. Information architecture

| Route | Shell | Access | Primary outcome |
|---|---|---|---|
| `/site-inspections` | Marketing | Public | Understand the advisory service and start. |
| `/inspections/new` | Customer workspace | Authenticated active organization member | Create a site inspection from an approved profile. |
| `/inspections/[id]/capture` | Customer workspace | Owning organization member | Complete checklist tasks and resolve evidence feedback. |
| `/inspections/[id]/review` | Customer workspace | Owning organization member | Review completeness and submit, including limitations. |
| `/inspections/[id]/results` | Customer workspace | Owning organization member | Track analysis and view provisional/final results. |
| `/technical/inspections` | Technical workspace | Technical, Manager, Admin | Prioritize and claim review work. |
| `/technical/inspections/[id]` | Technical workspace | Technical, Manager, Admin | Review, override, finalize, release, or reassign. |
| `/admin/inspection-profiles` | Admin workspace | Admin | List profiles, drafts, published versions, and validation state. |
| `/admin/inspection-profiles/[id]` | Admin workspace | Admin | Edit profile metadata and manage successor drafts. |
| `/admin/inspection-profiles/[id]/versions/[versionId]` | Admin workspace | Admin | Author/validate a draft or inspect an immutable published version. |

The browser treats route IDs as opaque. Loading a route never proves access; each service operation must authorize the actor and organization server-side (`INS-API-001`). A `403` renders the shared forbidden state without disclosing whether the resource exists.

## 3. Shared frontend architecture

### 3.1 Service boundary

`ApiClient` gains three services:

```ts
interface ApiClient {
  siteInspections: SiteInspectionService;
  inspectionReview: InspectionReviewService;
  inspectionProfiles: InspectionProfileAdminService;
  documents: DocumentsService;
}
```

Pages consume controller hooks, not these services directly. Recommended controller ownership:

| Controller | Responsibility |
|---|---|
| `InspectionSetupController` | Organization selection, profile options, draft validation, create idempotency. |
| `InspectionCaptureController` | Task selection, local capture state, secure document workflow, evidence polling, conditional task refresh. |
| `InspectionReviewController` | Completeness projection, limitation acknowledgement, revision-guarded submission. |
| `InspectionResultController` | Analysis polling, result refresh, citation selection, report download session. |
| `InspectionQueueController` | Filters, pagination, claim/release and conflict recovery. |
| `InspectionTechnicalReviewController` | Criterion navigation, evidence viewer, overrides, finalization and reassignment. |
| `InspectionProfileController` | Draft editing, validation, publication and immutable-version inspection. |

Controller state must distinguish `idle`, `loading`, `success`, `empty`, `error`, `forbidden`, `not_found`, `conflict`, and `offline` rather than collapsing them into one message.

### 3.2 Shared components

| Component | Required behavior |
|---|---|
| `InspectionStatusPill` | Exhaustive mapping for inspection, evidence, AI run, report, and profile-version states. Unknown values fail closed with a compatibility message. |
| `InspectionProgress` | Shows completed/total tasks, evidence problems, and current phase without deriving technical verdicts. |
| `EvidenceCard` | Shows file name/type, task, state, thumbnail/document icon, timestamps, feedback, and allowed actions. |
| `EvidenceViewer` | Authorized image/PDF viewing, citation location, zoom, keyboard controls, and no durable URL display. |
| `CriterionFinding` | Verdict, criticality, observation, rationale, remediation, limitations, evidence citations, and review state. |
| `CopilotPanel` | Contextual prompts and grounded explanations only; it cannot modify inspection state. |
| `RevisionConflictNotice` | Explains that server data changed, reloads latest data, and never retries a stale write blindly. |
| `SimulationDisclosure` | Visible only in mock mode on every inspection/reviewer page. |

### 3.3 State ownership and persistence

- Backend owns all production records and lifecycle state.
- Controllers may hold selected task, open panel, local preview URL, filter values, and polling timers.
- Production inspection data must not be stored in `localStorage`.
- Mock mode may persist versioned, non-sensitive metadata as defined in `SITE_INSPECTION_MOCK_DEMO_SPEC.md`.
- `File`, `Blob`, file bytes, signed URLs, AI payloads, and report contents never enter browser persistence.
- Polling pauses while the page is hidden or offline and resumes with a fresh read.

## 4. Public landing page

### 4.1 Content order

1. Eyebrow: `RAPID STANDARDS-ALIGNED SITE INSPECTION`.
2. Headline emphasizing guided capture and reviewed readiness guidance.
3. Primary CTA: `Start AI-assisted inspection`.
4. Secondary CTA: `See what to prepare`, scrolling to evidence preparation.
5. Three-stage explanation: guided evidence, provisional AI result, Technical-reviewed report.
6. Supported V1 site profiles and evidence formats.
7. Safety and service limitations.
8. Provisional/reviewed/certification comparison.
9. Free US pilot and one-business-day review target.
10. FAQ and final CTA.

The page must not use `certified`, `certification`, `TIA compliant`, `Tier certified`, or `code compliant` for Panda Cloud output (`INS-PROD-001`). A comparison may name third-party certification only to explain that it is separate.

### 4.2 CTA behavior

- Authenticated customer with an active membership: navigate to `/inspections/new`.
- Authenticated customer without an organization: navigate to the self-service organization step within `/inspections/new`.
- Unauthenticated visitor: enter Clerk sign-in with `/inspections/new` as the verified return destination.
- Staff-only identity without a customer membership: show an organization-membership requirement; do not let the user choose an arbitrary organization.

## 5. Inspection setup

### 5.1 Form sections

- Organization: active memberships only, plus approved self-service creation.
- Site: name, US address, IANA time zone.
- Facility: type and operational state.
- Objective: readiness, pre-acquisition, risk review, or remediation recheck.
- Known systems: utility, transformer/switchgear, UPS, batteries, generators, cooling, fire protection, and physical security.
- Jurisdiction: AHJ and adopted editions when known, otherwise explicit unknown.
- Profile preview: approved profile name/version, category count, expected evidence and limitations.

### 5.2 Validation and submission

- Validate on blur and on submit; move focus to the first invalid field.
- Organization, site name, US address, time zone, facility type, operational state, and objective are required.
- Unknown AHJ/edition is allowed but creates a visible limitation.
- Create uses one generated idempotency key retained until success or a changed request.
- Duplicate submission disables the button and shows one in-progress state.
- Success navigates to `/inspections/{id}/capture` using the returned opaque ID.
- A `409` idempotency mismatch requires a new user action; no automatic resubmission.

## 6. Guided capture

### 6.1 Desktop layout

Use a three-region layout at large widths:

- Left: filterable category/task checklist with progress and problem counts.
- Center: selected task instructions, capture actions, evidence grid, and safe handling warning.
- Right: contextual Copilot panel, collapsible but never the only way to complete a task.

The checklist and selected task remain usable at 200% zoom. Regions become a stacked layout before horizontal scrolling is required.

### 6.2 Mobile layout

- The checklist is the default page.
- Selecting a task opens its detail route state without losing checklist scroll position.
- `Open camera` may use a file input capture hint only when production scope enables it; the mock/demo uses local file selection.
- The evidence preview is full-width with safe-area padding.
- Copilot opens as an accessible bottom sheet, traps focus while modal, and returns focus to its trigger on close.
- Primary actions remain reachable without covering validation text.

### 6.3 Task presentation

Each task shows category, criterion purpose, required views, allowed file types, safe capture instruction, and `Cannot provide` action. Customer text must not reproduce protected standards language.

Actions:

- `Open camera` or `Choose image`.
- `Upload PDF` where allowed.
- `Replace` for retake/wrong evidence.
- `Remove` before submission, with confirmation.
- `Cannot provide`, with optional explanation and resulting `not_verified` warning.

### 6.4 Secure evidence lifecycle

The UI mirrors, but does not invent, these states:

```text
uploading -> scanning -> analyzing -> accepted
                                  -> retake_required
                                  -> wrong_evidence
                                  -> manual_review
uploading|scanning|analyzing      -> failed
```

- `uploading`: progress and cancel only where storage supports safe cancellation.
- `scanning`: attachment and AI analysis are disabled.
- `analyzing`: show criterion-specific preflight activity.
- `accepted`: state what is usable and any non-blocking limitation.
- `retake_required`: state the quality problem and safe replacement action.
- `wrong_evidence`: restate the requested asset/view.
- `manual_review`: explain that a Technical reviewer must decide; never imply acceptance.
- `failed`: show correlation/reference and a retry appropriate to the failed stage.

Only a clean, attached document may enter `analyzing`; only accepted or reviewer-confirmed evidence may support final decisions (`INS-API-003`, `INS-API-005`).

### 6.5 Conditional tasks

When the backend activates a pre-authored conditional task, insert it under its category, announce the change through a polite live region, and show `Added because evidence indicated …`. Do not expose raw model confidence or let the UI create tasks.

### 6.6 Copilot

Supported prompt chips:

- `What should I capture?`
- `Why is a retake needed?`
- `What is missing?`
- `Why does this evidence matter?`

The panel shows evidence-grounded responses, citations where relevant, safety limits, and a `This does not change the inspection result` note. Free text is constrained to the active task/finding. No general chat history, web search, or result mutation is available.

## 7. Completeness review and submission

Group tasks into accepted, replacement required, missing, unavailable, and manual review. Display:

- Total and evaluable criterion count.
- Critical/high items that will be `not_verified`.
- Evidence still scanning/analyzing, which blocks submission until resolved or failed.
- Jurisdiction and other report limitations.

Normal submission is enabled when required evidence is accepted. `Submit with limitations` is enabled when no upload/scan is active and the user checks an explicit acknowledgement. Both operations send `expectedRevision` and an idempotency key.

On success, navigate to results. On `409`, reload completeness and require reconfirmation. Submission is irreversible in V1; the UI states that follow-up evidence requires a new inspection/reinspection.

## 8. Results and report

### 8.1 Analysis progress

Render persisted stages rather than a generic animation:

1. Evidence verified.
2. Facts extracted.
3. Criteria evaluated.
4. Provisional report prepared.

Polling handles `queued`, `running`, `retryable_failed`, `permanent_failed`, and `completed`. A retry action appears only when the backend authorizes it.

### 8.2 Provisional result

Header badge: `AI PROVISIONAL — TECHNICAL REVIEW PENDING`.

Show overall readiness, critical/high summary, limitations, ordered findings, and review status. Each finding links to one or more evidence records and separates direct observations from interpretation. `not_verified` is not visually softened into neutral success.

### 8.3 Final result

Header badge: `PANDA CLOUD REVIEWED — FINAL REPORT` with finalization timestamp and report version. Show reviewer-approved rationale, visible overridden findings, limitations, and a short-lived download action. Do not show internal reviewer notes, provider output, prompts, token usage, or audit payloads.

### 8.4 Customer Copilot

Finding explanation is limited to approved prompts: why, evidence, remediation priority, and what evidence could change a future result. It cannot amend the result or promise compliance.

## 9. Technical review queue

The queue provides server-side pagination, filtering, and sorting. Required columns:

- SLA/priority.
- Inspection/site and customer-safe organization name.
- Provisional readiness.
- Critical/uncertain/not-verified counts.
- Evidence quality indicator.
- Submitted/updated time.
- Claim status and reviewer.

Default ordering is breached SLA, approaching SLA, critical risk, low evidence/conflict, then oldest submission. Role-based visibility is enforced by the backend.

Claim sends `expectedRevision`. A conflict reloads the row and identifies the current claimant. Reviewer may release their claim; Manager/Admin may release or reassign with a reason. Queue actions are audited (`INS-API-008`).

## 10. Technical review detail

Use a workbench with:

- Inspection/profile/site/limitation header.
- Criterion navigator prioritized by criticality and uncertainty.
- Evidence viewer with citation highlighting.
- AI proposal panel: observation, proposed verdict, rationale, remediation, conflicts.
- Reviewer decision panel: approve or override, final verdict, reason, customer-safe rationale.
- Finalization readiness summary.

Override requires a reason and new customer-safe rationale. `not_applicable` critical/high requires explicit confirmation. Finalize is disabled while required criteria are unresolved, evidence is unclean, the claim is not held, or the revision is stale.

Finalization confirmation summarizes readiness, override count, limitations, and immutability. On success, the record becomes read-only and displays its report version. No blind retry is allowed after an uncertain response; reload first to learn whether finalization succeeded.

## 11. Profile administration

### 11.1 Profile list/detail

List profile name, market, facility type, active version, draft state, owner, validation status, and updated time. Admin can create a profile, create a successor draft from the active version, archive an unused profile, or inspect history.

### 11.2 Version editor

Editor areas:

- Metadata and intended site scope.
- Category-level standards mappings and jurisdiction overlay.
- Criteria with code, criticality, requirement, evidence, safe capture, applicability, and remediation.
- Conditional rule definitions referencing pre-authored criteria/tasks.
- Validation errors and change summary.

Draft autosave uses revision-guarded writes. Publishing requires explicit validation success and confirmation. A published version is immutable and the UI removes editing controls (`INS-UX-007`, `INS-API-010`). Profile administration never copies protected standards text into customer-facing fields.

## 12. Error and interruption behavior

| Condition | Required UX |
|---|---|
| Offline | Preserve transient input, pause polling/upload initiation, and retry only after connectivity returns. |
| Upload interrupted | Resume only when the storage contract supports it; otherwise preserve task context and request file re-selection. |
| Session expired | Preserve non-sensitive draft state, reauthenticate through Clerk, and return to the verified route. |
| Forbidden | Render shared forbidden view with no existence or organization detail leak. |
| Not found | Render a generic unavailable view; do not distinguish inaccessible from absent where that leaks scope. |
| Revision conflict | Reload latest record, preserve unsaved text separately, and require the user to reapply/confirm. |
| Provider outage | Explain that analysis is delayed, keep evidence/results safe, and show backend-authorized retry/status. |
| Scanner outage | Keep evidence unattached/unavailable to AI and communicate operational delay. |
| Unknown enum | Fail closed with a compatibility error and correlation/reference. |

## 13. Accessibility and responsive acceptance

- Meet WCAG 2.2 AA for target flows.
- All actions and evidence navigation are keyboard operable.
- Use semantic headings, lists, tables, progress, status, and form errors.
- Status is never conveyed by color alone.
- Live regions announce upload/preflight/conditional-task changes without excessive repetition.
- Dialogs and bottom sheets manage focus and Escape consistently.
- Evidence images have task-specific alternative text; decorative samples use empty alt text.
- PDF evidence has a non-canvas metadata/fallback view.
- Honor `prefers-reduced-motion`; no content depends on animation.
- Support 320 CSS-pixel width, 200% zoom, and touch targets of at least 44 by 44 CSS pixels.
- Validate current Chrome, Edge, Safari desktop, and current iOS Safari/Android Chrome for capture routes.

## 14. Analytics and privacy-safe telemetry

Allowed events use opaque inspection/task IDs and categorical state only: landing CTA, inspection created, task opened, evidence state, retake, limitation acknowledgement, submission, provisional viewed, report downloaded, queue claim, override, and finalization.

Never send site address, file name, extracted label text, finding narrative, signed URL, user-entered explanation, or evidence bytes to client analytics (`INS-SEC-003`).

## 15. Frontend Definition of Done

- All routes and guards match this document and the canonical registry.
- Mock and HTTP adapters implement identical service interfaces.
- No component calls `fetch`, reads environment variables, or contains canonical business records.
- All statuses have explicit loading/empty/error/conflict behavior.
- Customer and reviewer paths pass automated component/integration tests.
- Accessibility and responsive acceptance passes on the target matrix.
- Provisional/final/certification terminology passes content review.
- Production enablement remains blocked until a released OpenAPI client, approved profile, security review, and backend acceptance tests exist.
