# GPU Rental Staff Operations UX Specification

**Status:** Proposed Design — G0 documentation baseline, not implemented or approved staff tooling  
**Owner:** Frontend and Operations  
**Required reviewers:** Product, Backend, Security, Commercial, Finance, Support, Legal, and QA

## 1. Authority and boundary

This specification defines the Target State staff workspaces required to run a
partner-managed GPU Rental service. It does not approve a role, operation,
schema, partner, price, financial action, or production workflow.

The backend-owned
[GPU Rental FE-BE Execution Plan](../../PandaCloudBackend/docs/collaboration/GPU_RENTAL_FE_BE_EXECUTION_PLAN.md)
controls gate order. Staff UI guards improve usability but never authorize an
operation; the gateway and Convex domain enforce permission, tenant scope,
state, revision, idempotency, and audit.

## 2. Workspace sequence

| Workspace | Primary users | Core decisions and evidence | Gate |
|---|---|---|---|
| Partner readiness | Operations, Security, Legal, Commercial, Finance | Due diligence, agreement references, operator disclosure, escalation, billing/statement readiness, activation/suspension. | G1-G3 |
| Catalog staging and approval | Operations, Technical, Commercial | Import provenance, normalization, diff, technical review, commercial approval, publish/pause/expiry. | G3 |
| Availability and hold queue | Operations | Snapshot freshness, reported units, reconfirmation, hold evidence, expiry, conflict, release. | G3-G4 |
| Quote review | Sales, Operations, Commercial | Customer/organization, configuration, capacity, cost/margin, terms, SLA, operator disclosure, issue/revision/alternative. | G4 |
| Provisioning workbench | Operations, Support | Contract/payment readiness, idempotency key, partner ticket/reference, evidence, owner, next action, failure/recovery. | G5 |
| Usage import and validation | Operations, Finance | Source reference, period, duplicate check, normalization, validation, dispute. | G6 |
| Billing and supplier reconciliation | Finance | Invoice, payment allocation, accrual, statement match, discrepancy, adjustment, maker/checker. | G6 |
| Support, incident, and SLA credit | Support, Operations, Finance | Severity, customer impact, escalation, incident window, partner remedy, evaluation, approved credit. | G6 |
| Renewal and termination | Sales, Operations, Finance, Support | Capacity/price reconfirmation, new quote, revoke, deprovision, release evidence, final reconciliation, closure. | G7 |

Customer pilot remains closed until every required queue has a named owner and
can complete its dry run without spreadsheet-only canonical state.

## 3. Interaction rules

- Every mutable resource displays current state and revision.
- Commands are explicit text actions with a confirmation summary; drag/drop is
  not used for guarded financial, provisioning, or lifecycle transitions.
- A `REVISION_CONFLICT` reloads the resource and preserves the proposed change
  separately for comparison; it never overwrites newer server state.
- External and financial commands carry an idempotency key. A retry displays
  the original result when the request is identical and surfaces
  `IDEMPOTENCY_CONFLICT` when it is not.
- Invalid transitions display backend-provided blockers and allowed next
  actions. The UI never invents a bypass.
- Lists use server pagination, filtering, and stable sort from the released
  contract.
- Destructive or irreversible operations require reason, authorized actor, and
  audit evidence. Maker/checker separation is visible where required.
- Supplier cost, margin, partner agreements, and escalation data appear only
  for specifically authorized staff roles.

## 4. Failure and safety states

All workspaces must represent:

- Loading, empty, partial, failed, delayed, and partner-unavailable states.
- Stale or expired catalog, snapshot, hold, quote, contract, and evidence.
- Permission denied and no-leak not-found behavior.
- Capacity, revision, idempotency, and partner-reference conflicts.
- Commercial approval required and missing contract/payment readiness.
- Duplicate/unmapped usage, statement discrepancy, disputed invoice, and
  pending adjustment approval.
- Partner blocked, provisioning failed, degraded deployment, Sev1/2 incident,
  missing termination evidence, and unreconciled final financial state.

The UI does not expose credentials, secret-bearing URLs, raw provider payloads,
unapproved personal data, or unrelated tenant data. Secure access is a status
and evidence workflow, not a credential viewer.

## 5. Permission baseline requiring G0 approval

- Sales: customer demand, Dealflow, quote preparation, and renewal initiation;
  no Finance mutation or provisioning command.
- Commercial approver: price, margin, term, cancellation, and customer SLA.
- Operations: partner/catalog evidence, availability, holds, provisioning,
  deployment lifecycle, and termination evidence.
- Finance: invoice, bank allocation, adjustment, supplier statement,
  reconciliation, and credit approval; no provisioning command by default.
- Support: customer cases, incident communication, partner escalation, and SLA
  evaluation input; no commercial approval by default.
- Admin/Super Admin: platform governance does not automatically replace
  maker/checker or named commercial/financial approval.

The exact operation-to-permission mapping remains a hard G0-G1 approval and
must be represented in the released OpenAPI/security handoff before code uses
it.

## 6. Acceptance criteria

- Staff can dry-run one offer-to-termination lifecycle with authoritative state
  in the backend and no spreadsheet-only handoff.
- Concurrent hold and stale-revision commands fail deterministically.
- Retried provisioning produces one partner case/reference.
- Duplicate usage produces no second billable record.
- Adjustments and SLA credits enforce required maker/checker approval.
- Termination cannot close or release capacity before operational and financial
  evidence is complete.
- Permission tests deny cross-role operations and all customer-facing
  projections exclude confidential partner data.
- Screens use typography, structured borders, and text status badges without
  decorative SVG icons, emoji, or icon fonts.

