# Manager + Admin Integration Phase 1

Frontend branch: `feat/integration-v1-manager-admin` (base `9388cc50dfe6c59c0268f9ffedb0396540153b13`).
Backend audited read-only at `4aa9a6cebe95f8396d2aea631b6ff050645b98c2`.

## Surface status

| Workspace | Surface | Status | Notes |
| --- | --- | --- | --- |
| Manager | Overview | LIVE_BACKEND | Uses `/manager/overview`; currency buckets and source-backed deal/team/project counts only. |
| Manager | Sales Performance | READY_WITH_OPEN_POLICY | Reuses Sales overview/reports; lead ownership and report formulas remain open. |
| Manager | Team | LIVE_BACKEND | Uses team list and member detail; active Sales identity, deal/activity metrics and per-currency pipeline only. |
| Manager | Pipeline | LIVE_BACKEND | Reuses the existing Sales Pipeline adapter and transition/readiness/change-request flows. |
| Manager | Projects / Operations | PARTIAL | Uses project list/detail and source-deal projection. Unsupported GPU, deployment, infrastructure, land, investment and RFP domains show a blocked notice. |
| Manager | Approvals | LIVE_BACKEND (narrow) | Deal Change Requests only: mark_won, mark_lost and archive with OCC/idempotency semantics. |
| Manager | Reports | LIVE_BACKEND | Uses project status/vertical counts and won-deals-pending-project; no revenue or cross-currency totals. |
| Admin | Overview | LIVE_BACKEND | Uses source-backed identity, membership, webhook and DD configuration counts. |
| Admin | Users | LIVE_BACKEND / READ_ONLY | Bounded identity/membership list and detail; no user mutations. |
| Admin | Roles | LIVE_BACKEND / READ_ONLY | Canonical roles only; no dynamic role administration. |
| Admin | Permissions | BLOCKED | Backend has no permissions administration contract. |
| Admin | System | LIVE_BACKEND | Displays API/Convex/schema/server-time facts returned by the backend. |
| Admin | Audit Logs | LIVE_BACKEND | Redacted audit projection; no secrets, payloads or provider credentials. |
| Admin | Integration Events | LIVE_BACKEND | Safe retry metadata only; no raw payload and no manual retry action. |
| Admin | Settings | BLOCKED | No provider, secret, environment or feature-flag mutation contract. |
| Admin | Approvals | LIVE_BACKEND (narrow) | Reuses the same Deal Change Request queue; it is not a generic approvals system. |

## Consumed API surface

Manager consumes `/manager/overview`, `/manager/team`, `/manager/team/{userId}`, `/manager/projects`, `/manager/projects/{projectId}`, `/manager/reports/projects`, `/deals/{dealId}/project`, the existing Sales reports/pipeline paths, and the Deal Change Request queue/decision paths.

Admin consumes `/admin/overview`, `/admin/users`, `/admin/users/{userId}`, `/admin/roles`, `/admin/system/health`, `/admin/audit-logs`, `/admin/audit-logs/{auditId}`, `/admin/integrations/events`, and `/admin/integrations/events/{eventId}`.

All calls remain behind the authenticated HTTP adapter and Clerk bearer session. The UI does not authorize by itself, send roles or organizations, call Convex, or store custom tokens. Cursor values remain opaque and money is formatted per currency without merging buckets. Project conversion preserves backend OCC, idempotency and conflict behavior; the existing conversion queue reloads authoritative state after a conflict.

## Verification

The focused Manager/Admin integration suite covers overview, team list/detail, project list/detail, project reporting, typed Admin views, and adapter path mapping. The full frontend suite and build are the final authority for this handoff.

Real non-production E2E was not run: no disposable Clerk/Convex gateway identity and fixture dataset were supplied.

Remaining product/backend gaps are regional demand, lead ownership/conversion policy, revenue recognition, GPU capacity/telemetry, generic approvals, dynamic permissions, and generic settings administration.
