# Cross-Workspace Integration Status — Phase 1

Audited frontend: `40698ecaa6c30cf354bea8a89fba8ad742106c65` on `main`.
Audited backend: `1cefbe02004be645b52ad595ad18654bd0537ea0` on `main`. The real
authenticated E2E attempt passed frontend secret hygiene but stopped when
`npx convex dev` rejected an existing non-production `leads` document whose
stored `priority` field is absent from the current schema. No live
authenticated workflow ran.

| Domain | Frontend status | Backend status | Automated coverage | Real E2E status | Blocker | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| Auth | Integrated through Clerk session bridge and `/auth/me` | Implemented | Auth/session and HTTP-client tests | BLOCKED_ENVIRONMENT | Convex dev startup fails schema validation on existing non-production data | Resolve deployment data/schema mismatch, then role smoke step 1 |
| Sales | Integrated: overview, leads, pipeline, tasks, activities, customers, reports | Implemented | Adapter/component and backend gateway/route tests | BLOCKED | Authenticated Sales identity and disposable fixtures unavailable | Run non-terminal Sales smoke |
| Lookups | Integrated through HTTP lookups | Implemented | HTTP contract tests | BLOCKED | Staff fixture scope unverified | Exercise opaque-cursor lookups |
| Deal Change Requests | Integrated Sales request and Manager/Admin decision queue | Implemented | Frontend workflow and backend tests | BLOCKED | Safe pending request fixture unverified | Run terminal-request round trip |
| DD | Deal-scoped assessments, progress and revisioned responses | Implemented | Technical component and backend tests | BLOCKED | Technical role and Deal B unverified | Run assessment/revision smoke |
| Documents | Upload session → direct upload → finalize → metadata/download | Implemented | Secure-upload and backend transfer tests | BLOCKED | Private storage and harmless file fixture unverified | Run safe document smoke |
| KYC | Deal-scoped create/detail/revision/documents | Implemented | KYC/NCNDA integration and backend tests | BLOCKED | Compliance role and Deal C unverified | Run XOR subject and revision smoke |
| NCNDA | Deal-scoped upsert/detail/documents | Implemented | KYC/NCNDA integration and backend tests | BLOCKED | Legal role and Deal C unverified | Run deal-scoped smoke; CR-004 stays unused |
| Readiness | One client evaluator refetches authoritative lane data | Partial by design (no aggregate endpoint) | Readiness and mutation-refresh tests | BLOCKED | Fixture state unverified | Verify post-mutation refreshes |
| Projects | Manager conversion plus project list/detail/report | Implemented | Manager frontend and backend tests | BLOCKED | Disposable Won Deal D unverified | Run idempotent conversion smoke |
| Manager | Overview, team/detail, pipeline reuse, Sales Performance reuse, operations/project subset, request queue, reports | Implemented/partial | Manager/Admin integration and backend route/gateway tests | BLOCKED | Manager fixture unverified | Run Manager smoke workflow |
| Admin | Overview, users/detail, roles, audit/detail, events/detail, health, request approvals | Implemented read-only | Manager/Admin integration and backend governance tests | BLOCKED | Admin fixture unverified | Run read-only Admin smoke |
| Quotes | Truthfully blocked | No canonical quote domain | N/A | BLOCKED | Product contract | Do not add a fake quote API/UI |

## Contract continuity

The integrated frontend uses `src/services/api.ts` and the `/api/v1` HTTP
gateway only. Clerk supplies the current session token; PandaCloud issues no
browser access/refresh token. API errors normalize to `errorCode`, `message`,
`correlationId`, and field/form detail arrays. Cursor values remain opaque,
timestamps remain ISO UTC until presentation, and monetary amounts use
minor-unit strings grouped by ISO currency without cross-currency summation.

Sales terminal stages remain a Deal Change Request workflow. Manager project
conversion carries `expectedRevision`, `idempotencyKey` and a caller-provided
project code. The client refreshes after `409`; it does not apply an optimistic
terminal move or automatic project conversion.

## Findings and classifications

| Classification | Count | Finding |
| --- | ---: | --- |
| FRONTEND_DEFECT | 1 fixed | Admin audit/event detail API operations existed but had no detail routes or linked read-only views. |
| BACKEND_DEFECT | 0 | None found during source audit; backend was not modified. |
| CONTRACT_DRIFT | 0 | Current consumed approved paths match the backend HTTP surface. CR-004 remains proposal-only and is not mounted in production Legal routes. |
| ENVIRONMENT_BLOCKER | 1 | Live Clerk/gateway/Convex/storage configuration alignment is unverified without external calls. |
| TEST_DATA_BLOCKER | 1 | Required disposable role identities, memberships and workflow fixtures are unverified. |
| PRODUCT_POLICY_BLOCKER | 6 | Quotes; generic Manager Operations; Admin Permissions; Admin Settings; global Legal/Compliance queues; malware scanner lifecycle. |

## Explicitly blocked or partial surfaces

- Evidence attachment remains blocked unless a trusted scanner reports the
  finalized document as clean; the frontend never manufactures that state.
- Manager Operations does not claim GPU capacity, deployments, land, RFP, or
  investment persistence. Project state is the available subset.
- Admin Permissions and Settings are truthful blocked states; Admin UI has no
  webhook retry or destructive provider action.
- The dormant CR-004 queue service is proposal/test support only. Production
  Legal routes use the approved deal-scoped NCNDA landing and do not call it.

## Real E2E decision

**REAL_E2E_BLOCKED.** Frontend secret hygiene passed, but the required Convex
development startup failed schema validation on an existing non-production
`leads` document with an extra `priority` field. No credentials, sessions,
provider calls, or fixture mutations were performed. Resolve that deployment
data/schema mismatch and rerun the stack gate. See
`docs/E2E_ENVIRONMENT_BOOTSTRAP_CHECKLIST.md` for the owner actions and
`docs/CROSS_WORKSPACE_E2E_RUNBOOK.md` for the exact non-production
prerequisites, role matrix, fixture set, safe mutations, cleanup rules and
correlation-ID capture procedure.
