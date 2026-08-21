# Site Inspection Backend Development Guide and Backlog

**Status:** Proposed executable backend backlog

**Guide revision:** 1.0

**Applicable suite revision:** 1.2

**Owner:** Backend/Data, with named AI, Security, Technical, QA, and Operations approvers

**Team assumption:** One Backend engineer; approval and evaluation work is part-time support

**Master workflow:** [Site Inspection FE-BE Development Workflow](SITE_INSPECTION_DEVELOPMENT_WORKFLOW.md)

## 1. Backend implementation rules

- The public boundary is the versioned `/api/v1` gateway. Frontend never calls Convex, storage, scanner, AI provider or workers directly.
- OpenAPI in this repository owns released DTOs and errors. The tables in the requirements specification remain proposals until reviewed and released.
- Clerk proves identity; Convex-owned active memberships and staff roles authorize every record/action. Client organization IDs never grant scope.
- Convex owns business metadata, immutable snapshots, lifecycle and audit; private storage owns bytes only.
- Writes use idempotency where repeatable and expected revisions where concurrent. Duplicate delivery must have exactly-once database effects.
- Only clean/encrypted/eligible evidence reaches AI. AI output is untrusted until schema, ownership, citation, coverage and deterministic policy validation pass.
- Overall verdict, applicability, conditional-task activation and final publication are backend/human policy, never model choices.
- Do not implement n8n in this design.

Use the [Backend API/Data Specification](../architecture/SITE_INSPECTION_BACKEND_API_DATA_SPEC.md), [AI/Standards Specification](../architecture/SITE_INSPECTION_AI_STANDARDS_EVALUATION_SPEC.md), and [Security/Operations Specification](../architecture/SITE_INSPECTION_SECURITY_PRIVACY_OPERATIONS.md) as task-level authority.

## 2. Backlog and critical path

| Task | Estimate | Depends on | Primary outcome |
|---|---:|---|---|
| `BE-001` | 1–2 days of coordinated decisions | Product/Technical/Security availability | Governance activation record and no hidden critical decision. |
| `BE-002` | 1–2 days | `BE-001` | Reusable OpenAPI conventions and candidate components. |
| `BE-003` | 1–2 days | `BE-002` | Reviewed/released setup contract slice and FE handoff. |
| `BE-004` | 2 days | `BE-003` | Profile/inspection/task persistence and authorization. |
| `BE-005` | 2 days | `BE-004`, existing Documents workflow | Secure evidence attachment lifecycle. |
| `BE-006` | 2 days | `BE-005`, provider/security approval | AI preflight runs, adapter, validation and retry. |
| `BE-007` | 1–2 days | `BE-006` | Deterministic applicability, conditional tasks and completeness. |
| `BE-008` | 2 days | `BE-007`, Sales field decision | Frozen submit, atomic Sales submission and analysis orchestration. |
| `BE-009` | 2 days | `BE-008`, golden-set baseline | Criterion validation, deterministic verdict and provisional projection. |
| `BE-010` | 2 days | `BE-009`, reviewer role/SLA decisions | Technical queue and audited reviewer actions. |
| `BE-011` | 2 days | `BE-010`, renderer/storage decision | Immutable final report and authorized download. |
| `BE-012` | 2 days | `BE-004`, governance approval flow | Profile draft/validate/publish/retire administration. |
| `BE-013` | 2–4 days | `BE-005`–`BE-012` | Operational/security hardening and pilot controls. |
| `BE-014` | 0.5–1 day per released slice | Relevant implementation and tests | Versioned contract/client releases and FE fixtures. |

The primary production chain is `BE-001 -> BE-002 -> BE-003 -> BE-004 -> BE-005 -> BE-006 -> BE-007 -> BE-008 -> BE-009 -> BE-010 -> BE-011 -> BE-013`. `BE-012` may start after `BE-004`; `BE-014` occurs after each independently supported slice rather than waiting for all work.

## 3. Backend task cards

### BE-001 — Governance activation gate

**Requirements:** `INS-PROD-001`, `INS-PROD-002`, `INS-PROD-003`, `INS-PROD-004`, `INS-SEC-006`, `INS-OPS-002`, `INS-QA-002`.

Record approved service claims, US pilot allow-list, actor/role matrix, profile author/approver separation, standards/copyright process, safety prohibitions, retention/provider data-control decision, business-day calendar, reviewer roster/escalation and golden-set owner/location. Unapproved items remain explicit blockers.

Transaction/events: none. Tests: governance checklist and terminology review. Handoff: dated decision record with owners and unresolved blockers. Done when no critical product/security/standards decision is being guessed by engineering.

### BE-002 — Reusable contract foundation

**Requirements:** `INS-API-001`, `INS-API-002`, `INS-SEC-003`, `INS-SEC-005`.

Draft reusable OpenAPI components for opaque IDs, ISO timestamps, revisions, idempotency, correlation ID, error envelope, pagination and explicit enums. Define organization/staff security schemes and non-disclosing `403`/`404` policy. Mark the contract candidate until reviewed/released.

Transaction/events: idempotency/audit conventions only. Tests: OpenAPI lint/bundle, examples and breaking-change diff. Handoff: candidate bundle plus FE review matrix. Done when FE/BE owners agree the shared conventions support required UI states.

### BE-003 — Setup contract slice and release

**Requirements:** `INS-PROD-002`, `INS-UX-001`, `INS-UX-007`, `INS-API-001`, `INS-API-002`, `INS-API-010`.

Add proposed/released operations for self-service organization, customer-safe published profiles and inspection create/read/update. Specify membership authorization, validation, idempotent create, revision update and immutable profile version projection.

Transaction: organization + initial membership and inspection + materialized tasks are atomic within their operation. Tests: examples, negative roles, idempotency conflict and stale revision. Handoff: first contract tag/client/checksum with isolated setup fixtures. Done when `FE-H01/H02` can start without handwritten shapes.

### BE-004 — Profile, inspection and capture-task persistence

**Requirements:** `INS-PROD-005`, `INS-API-001`, `INS-API-002`, `INS-API-005`, `INS-API-010`, `INS-SEC-005`.

Implement profile/version/criterion, site inspection and materialized capture-task collections, indexes, validators and services. Enforce historical version immutability, organization scope, safe staff access and revision transitions. Publish only the operations covered by the released slice.

Transaction: creation freezes the selected profile version and creates initial tasks once. Events: inspection/profile lifecycle audit. Recovery: repeat create resolves by idempotency record. Tests: schema/validator, cross-org, old-version stability, duplicate create and immutable update rejection.

### BE-005 — Secure evidence lifecycle

**Requirements:** `INS-PROD-004`, `INS-API-003`, `INS-SEC-001`, `INS-SEC-004`, `INS-QA-001`.

Extend the existing private Documents workflow with inspection purpose/context, supported JPEG/PNG/WebP/PDF policy, quarantine/finalize/scanner/encryption eligibility and attach/remove/unavailable operations. Document organization, purpose, checksum, MIME, size/page and mutable-inspection gates.

Transaction: evidence metadata/link/task revision commit together; byte deletion is asynchronous. Events/jobs: upload finalized, scan/encryption state, evidence attached/detached. Recovery: expired upload creates a new session; duplicate attach is idempotent. Tests: hostile MIME, unclean evidence, cross-org IDOR, stale revision, detach and signed-URL leakage.

### BE-006 — AI evidence preflight

**Requirements:** `INS-AI-001`, `INS-AI-002`, `INS-AI-003`, `INS-AI-004`, `INS-AI-005`, `INS-AI-007`, `INS-API-007`, `INS-SEC-002`, `INS-SEC-006`.

Implement server-only provider adapter, Luna routing, minimized criterion/task/evidence input, Responses API Structured Outputs, `store: false`, no tools/web search, run persistence and application validation. Record prompt/schema/model/request hash/usage/result without chain-of-thought.

Transaction: create or reuse one logical preflight run for the frozen evidence hash. Events/jobs: queued/started/completed/failed/retryable/refused. Recovery: bounded retry and dead-letter; failure never creates criterion verdict. Tests: malformed output, refusal, timeout, rate limit, prompt injection, citation/coverage mismatch and duplicate delivery.

### BE-007 — Applicability, conditional tasks and completeness

**Requirements:** `INS-AI-006`, `INS-API-005`, `INS-API-006`, `INS-QA-001`.

Implement versioned deterministic applicability rules, extracted-fact validation, one-time conditional task materialization and backend completeness projection. Missing, unreadable, conflicting or ineligible evidence cannot pass.

Transaction: accepted facts and any newly activated tasks commit with monotonic revision. Events: rule evaluated/task activated. Recovery: replay produces no duplicate task. Tests: rule truth tables/property tests, late/replaced evidence, duplicate event and completeness invariants.

### BE-008 — Frozen submit, Sales and analysis orchestration

**Requirements:** `INS-PROD-006`, `INS-API-004`, `INS-API-007`, `INS-SEC-005`.

Implement submit with normal/limitation acknowledgement, freeze profile/evidence/task revision, create exactly one `infrastructure` Sales submission for persona `facility_operator`, and queue Terra analysis against the frozen input hash.

Transaction: inspection submission, frozen snapshot, Sales submission link, audit/outbox and logical analysis request commit atomically. Recovery: rollback on Sales failure; same idempotency key resumes safely. Tests: duplicate/uncertain response, revision change during submit, Sales rollback and outbox replay.

### BE-009 — Provisional evaluation and customer-safe result

**Requirements:** `INS-PROD-003`, `INS-PROD-005`, `INS-API-005`, `INS-API-006`, `INS-API-007`, `INS-AI-005`, `INS-AI-008`, `INS-OPS-001`, `INS-QA-002`.

Validate Terra criterion proposals, citations and coverage; persist criterion results; derive `ready`, `conditional` or `not_ready` deterministically; expose safe analysis status/result/explanation. Critical fail or critical not-verified blocks ready.

Transaction: a validated run writes one provisional result set for its frozen hash. Events/jobs: analysis lifecycle and review-queue entry. Recovery: invalid/failing output remains retryable or dead-lettered without verdict. Tests: every verdict invariant, golden cases, zero critical false pass, at least 95% critical-failure recall and latency targets.

### BE-010 — Technical review workflow

**Requirements:** `INS-UX-006`, `INS-API-008`, `INS-SEC-005`, `INS-OPS-002`.

Implement queue/detail, claim/release/reassign, criterion approve/override and reviewer-safe evidence access. Enforce roles, current claimant, revision, mandatory override reason, priority and business-calendar SLA.

Transaction: each action and audit event commit together. Events: claimed/released/reassigned/overridden/review-ready/SLA escalation. Recovery: stale claim/update returns conflict; manager can reassign/release under policy. Tests: role matrix, double claim, stale revision, non-claimant override and safe customer rationale.

### BE-011 — Immutable final report

**Requirements:** `INS-PROD-003`, `INS-API-009`, `INS-API-010`, `INS-SEC-004`, `INS-SEC-005`, `INS-QA-004`.

Implement finalization gates, immutable canonical content snapshot/hash, report version, rendering job, report list and authorized download session. Final decision exists even when PDF rendering must retry.

Transaction: final criterion decisions, inspection final state, immutable report snapshot and audit/outbox commit once. Recovery: render retry keys by content hash; duplicate finalize returns the original report. Tests: incomplete review, duplicate finalize, post-final mutation, hash integrity, cross-org download and expired URL.

### BE-012 — Profile administration

**Requirements:** `INS-UX-007`, `INS-API-010`, `INS-AI-006`, `INS-SEC-005`.

Implement Admin list/create/update, successor draft, criterion authoring, validation, publish and retire. Validate criticality, evidence requirements, safe capture instructions, applicability rules, remediation, standards-category mappings and approval metadata without copying protected standard text.

Transaction: publish freezes the complete version and activation pointer atomically. Events: draft/validate/publish/retire. Recovery: validation errors keep draft mutable; publish replay is idempotent. Tests: role denial, invalid rule, missing criterion fields, old-version stability and immutable published version.

### BE-013 — Security and operational readiness

**Requirements:** `INS-SEC-001`, `INS-SEC-002`, `INS-SEC-003`, `INS-SEC-004`, `INS-SEC-005`, `INS-SEC-006`, `INS-OPS-001`, `INS-OPS-002`, `INS-OPS-003`, `INS-OPS-004`, `INS-QA-001`, `INS-QA-003`, `INS-QA-004`.

Complete retention/deletion/legal hold, secrets/rotation, redaction, quotas, cost/concurrency controls, metrics/alerts, correlation, retry/dead-letter inspection/replay, backups/restore, incident exercises, feature flags, pilot allow-list, pause/rollback and SLA dashboards.

Transaction/events: recovery operations are authorized, idempotent and audited. Tests: threat cases, deletion/hold, restore, queue replay, outage, capacity, feature pause, critical-stop conditions and production-like E2E. Done only with named Security/Privacy/Operations/QA approvals.

### BE-014 — Contract/client releases and FE fixtures

**Requirements:** `INS-API-001`, `INS-API-002`, `INS-QA-001`.

For each supported vertical slice, verify OpenAPI/gateway parity, run lint/bundle/diff, obtain FE/BE semantic approval, publish the versioned contract/client/checksum and prepare isolated fixtures. Include supported/unsupported operations, errors, roles, idempotency/revision examples, environment and correlation lookup.

No implementation is declared available because it appears in a proposal. Done when the FE owner acknowledges the handoff and Integration contract tests pass.

## 4. Validation and handoff

Run the full applicable gate before a slice handoff:

```text
npm run fixture:verify
npm run typecheck
npm run lint
npm test
npm run openapi:lint
npm run openapi:bundle
npm run build
```

Every handoff includes contract/client versions and checksum, operation/error matrix, required roles/memberships, isolated fixture IDs, happy/conflict/forbidden/outage/retry examples, unsupported operations, correlation procedure, rollback owner, requirement IDs and test evidence.

Backend completion requires cross-organization isolation, clean-evidence gates, deterministic verdicts, idempotent/revision-safe writes, immutable profile/report history, audited human overrides, recoverable workers and production-ready operational controls.
