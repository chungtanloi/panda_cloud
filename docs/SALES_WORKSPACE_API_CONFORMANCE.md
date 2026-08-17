# Sales Workspace API conformance (2026-08-17)

Frontend was aligned to `PandaCloudBackend/docs/collaboration/SALES_WORKSPACE_PHASE_2_API_HANDOFF.md` and the backend sales domain types.

## Implemented mapping

- `/sales` → `GET /api/v1/sales/overview`
- `/sales/leads` → `GET /api/v1/sales/leads`
- `/sales/leads/:id` → `GET /api/v1/sales/leads/:leadId`; qualification uses `POST /api/v1/sales/leads/:leadId/qualify`.
- `/sales/tasks` → `GET /api/v1/sales/tasks` (activity records with `activityType=task`).
- `/sales/customers` → `GET /api/v1/sales/customers` (organization/deal read model).
- `/sales/reports` → conversion, activity and forecast report endpoints.
- Deal activity methods are available in the shared `salesWorkspace` adapter for deal-scoped detail screens.

All calls go through `src/services/http-impl` and use the existing Clerk Bearer session. Mock and HTTP adapters implement the same `SalesWorkspaceService` interface. Cursor fields (`continueCursor`, `isDone`) are preserved. Report `_open` fields are displayed as backend-owned caveats; no frontend formula is invented.

## Backend-owned gaps

Quotes have no canonical backend schema and remain a documented placeholder. Lead assignment/bulk assignment, notifications/webhooks, audit queries and scheduled reports are not available. Lead ownership and report conversion/forecast formulas remain open in the backend handoff. The frontend does not add endpoints for these gaps.

## Validation

- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npm run typecheck`: only the pre-existing optional `createCard` fixture errors in `src/components/sales/salesAdapter.test.ts` remain.
