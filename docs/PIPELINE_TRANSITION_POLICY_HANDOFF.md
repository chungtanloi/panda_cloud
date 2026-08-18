# Pipeline Transition Policy — Frontend Handoff

Date: 2026-08-18  
Backend source: `PandaCloudBackend/convex/lib/stageTransitionPolicy.ts` and the
backend OpenAPI integration candidate.

## Contract mapping

- `GET /api/v1/sales/cards/{dealId}/transition-options` returns every target
  stage with `allowed`, stable `blockers`, `warnings`, `requiredFields`, and
  `canOverride`.
- `POST /api/v1/sales/cards/{dealId}/move` remains authoritative and repeats
  the policy check. Writes include `expectedRevision`; On Hold adds `reason`
  and `followUpAt`; Manager/Admin override adds `override` and
  `overrideReason`.
- `POST /api/v1/deals/{dealId}/change-requests` handles `mark_won`,
  `mark_lost`, and `archive`. Terminal actions are never direct drag targets.
- `POST /api/v1/deals/{dealId}/activities` accepts the backend-owned milestone
  marker `businessEvent: proposal_sent | customer_response`.

## UX behavior

- The board lazily loads policy per card and disables hard-blocked targets.
- The move adapter always preflights again on drop; cached UI state is not an
  authorization mechanism.
- Warnings, On Hold inputs, and eligible Manager/Admin overrides open a review
  dialog before mutation.
- Deal Detail shows a complete per-stage checklist with backend messages and
  action links. It also provides a small evidence composer for completed
  customer contact, Proposal sent, and Customer response activities.
- Won/Lost columns show `Approval request required`. Sales creates a request;
  Manager/Admin decides in the existing approval queue. Archive follows the
  same workflow.

## Central policy implemented by backend

Normal open-stage graph:

`New ↔ Contacted ↔ Qualified ↔ Due Diligence ↔ Evaluation ↔ Proposal ↔ Negotiation`

Any open stage may move to On Hold; resumption targets the previous stage.
Minimum data gates follow the approved plan. NCNDA/KYC/DD readiness is a
warning for Proposal/Negotiation, not a hard business gate. Backend records
normal transitions, overrides, request decisions, and rejection reasons in
the audit/history surfaces.

## Error and concurrency behavior

- `400`: stable policy blocker or invalid transition input.
- `401/403/404`: authentication, authorization, and scoped-resource failures.
- `409`: stale revision. Frontend refreshes server state and never blind-retries.
- Preflight failure never calls the mutation.

Frontend protection is UX only. Backend scope, permissions, OCC, stage policy,
and request approval remain authoritative.

## Files changed

- Board/detail UI: `src/components/sales/SalesBoard.tsx`,
  `TransitionReviewDialog.tsx`, `TransitionChecklistPanel.tsx`,
  `DealMilestoneComposer.tsx`, `salesAdapter.ts`.
- Models/services: `src/models/sales.ts`, `src/models/salesWorkspace.ts`,
  `src/models/dealChangeRequests.ts`, `src/services/contracts.ts`, endpoint,
  HTTP, and mock adapters.
- Approval UI: Sales request panel and Manager/Admin request queue.

## Validation

Frontend: typecheck PASS, lint PASS, tests 78/78 PASS, production build PASS.
Backend: typecheck PASS, lint PASS with 8 pre-existing warnings, tests 223/223
PASS, OpenAPI lint PASS, route parity 4/4 PASS, production build PASS. Real
Clerk E2E still requires a running frontend, Next gateway, synchronized Convex
deployment, and staff fixtures with the corresponding Sales/Manager scopes.
