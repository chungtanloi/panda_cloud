# Deal Readiness frontend handoff

Date: 2026-08-18

## Outcome

The frontend now presents NCNDA and KYC as parallel readiness lanes under one staff-only Deal context. The readiness state is a presentation aid only; it does not authorize a Deal transition or replace backend policy.

Routes:

- `/deal-readiness` — temporary Deal-id entry while no lookup API exists.
- `/deal-readiness/{dealId}` — combined NCNDA/KYC readiness.
- Nested NCNDA, KYC and KYC-document routes retain the same adaptive staff workspace shell.

The Sales Deal Detail panel links directly to readiness for the selected Deal. Sales, Legal and Compliance navigation also exposes the entry route.

## Contract usage

No new backend operations were invented. The screen composes the implemented gateways:

- `GET /api/v1/deals/{dealId}/ncnda`
- `GET /api/v1/deals/{dealId}/kyc`
- Existing NCNDA agreement/detail/document operations.
- Existing KYC case/detail/document operations.

Every staff role may read both lanes according to the backend handoffs. NCNDA mutations remain Legal/Manager/Admin only; KYC mutations remain Compliance/Manager/Admin only. Frontend permissions are UX gates and the backend remains authoritative.

## Readiness projection

- NCNDA ready: `active`.
- KYC ready: `approved`, `verifiedAt` is present and `expiresAt` is absent or in the future.
- Blocked: rejection, cancellation, expiry, KYC provider error or prohibited risk.
- Other states: needs attention; missing records are not started.

This mapping is deliberately not a lifecycle state machine. The backend currently accepts status writes subject to validation and OCC.

## Workflow changes

NCNDA is document-first: creation is drafting-only, Deal context is inherited, immutable versions are prominent, lifecycle actions record sent/signed/countersigned timestamps, and activation warns when no current signed/countersigned document exists. The backend currently enforces the effective date but not the document recommendation.

KYC is evidence-first: creation begins with exactly one subject, provider metadata is advanced/optional, evidence is grouped by the canonical document-role enum, and guided review actions preserve approval/rejection validation and expected revisions.

## Backend gaps retained

- Deal, organization, contact and staff lookup APIs.
- Global Legal and Compliance queues.
- Browser upload-session/finalize flow.
- E-signature/signatory integration.
- Structured legal term fields.
- Required KYC evidence policy and strict lifecycle transitions.
- Current/active KYC case policy.
- Backend-enforced readiness gate for Won conversion.

## Validation

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS (21/21).
- `npm run build`: PASS (74 routes, including 5 Deal Readiness routes).
