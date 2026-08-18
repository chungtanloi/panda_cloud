# Deal Won and archive request conformance

Date: 2026-08-18  
Status: implemented integration candidate; not declared frozen or released

## Purpose

Sales does not directly mark a Deal `won` and never hard-deletes a Deal card. Sales submits an auditable request; Manager or Admin approves or rejects it. An approved removal is a soft archive (`status=archived`, `archivedAt`) so history remains available.

## HTTP mapping

| Frontend operation | Backend operation |
|---|---|
| `dealRequests.create(dealId, body)` | `POST /api/v1/deals/{dealId}/change-requests` |
| `dealRequests.listForDeal(dealId)` | `GET /api/v1/deals/{dealId}/change-requests` |
| `dealRequests.listQueue(query)` | `GET /api/v1/manager/deal-change-requests` |
| `dealRequests.decide(requestId, body)` | `POST /api/v1/manager/deal-change-requests/{requestId}/decision` |

Creation sends only `requestType`, `reason`, `expectedDealRevision`, and `idempotencyKey`. Decision sends only `decision`, `expectedRequestRevision`, and optional `comment`. Identity, role, Deal owner and organization are resolved by the backend.

## Authorization and concurrency

- Sales may create a request only for a Deal in its backend-assigned scope.
- Manager and Admin may read and decide the queue.
- A duplicate pending request of the same type is rejected.
- Both the request revision and captured Deal revision are checked before approval.
- Rejection requires a decision comment.
- `409` is surfaced to the user and triggers a reload; the frontend does not retry the stale mutation.

## UI integration

- Sales Deal detail exposes `Mark as Won` and `Remove from pipeline` request actions.
- Sales sees pending and recent decision states on the Deal.
- Manager uses `/manager/approvals`; Admin uses `/admin/approvals`.
- Approval atomically changes the Deal to `won` or `archived` in the backend.

## Error behavior

- `401`: session missing or invalid.
- `403`: role not allowed.
- `404`: Deal/request is outside the caller's scope or missing.
- `409`: stale revision, duplicate pending request, or terminal Deal.
- `400`: invalid reason/decision; rejection comment missing.

## Validation evidence

- Frontend typecheck: PASS.
- Frontend lint: PASS, no warnings.
- Frontend tests: PASS, 29/29 (including create, queue, decision paths and identity-field exclusion).
- Frontend production build: PASS; `/manager/approvals` and `/admin/approvals` are present.
- Backend typecheck/build: PASS.
- Backend tests: PASS, 207/207.
- Backend lint: PASS with 8 pre-existing warnings in `convex/deals.ts` and no errors.
- OpenAPI lint: valid with 2 pre-existing `SalesCardCreateRequest` warnings.
