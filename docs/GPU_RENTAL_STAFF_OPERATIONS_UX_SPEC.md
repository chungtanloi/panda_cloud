# GPU Rental Staff Operations UX Specification

**Status:** Proposed Design  
**Audience:** Sales, Commercial, Operations, Finance, Support, Manager, and Admin

## 1. Workspace map

| Workspace | Primary roles | Purpose |
|---|---|---|
| Partner readiness | Manager/Admin/Operations | Partner status, evidence references, regions, SLA, and activation/suspension. |
| Catalog staging | Operations/Technical/Commercial | Import, validate, diff, review, approve, publish, pause, and expire. |
| Availability queue | Operations | Freshness, current quantity/status, hold requests, and stale alerts. |
| Quote queue | Sales/Commercial/Operations | Capacity review, margin/SLA approval, issue, alternative, and expiry. |
| Provisioning queue | Operations | Portal/ticket submission, acknowledgment, allocation, readiness, recovery, and acceptance. |
| Usage imports | Operations/Finance | Batch staging, mapping, validation, duplicate/dispute handling. |
| Billing/reconciliation | Finance | Invoice, payment allocation, supplier accrual/statement, discrepancy, adjustment, and SLA credit. |
| Support/incidents | Support/Operations | L1 triage, partner escalation, incident grouping, customer update, and closure. |
| Renewal/termination | Sales/Operations/Finance | Requote, notice, deprovision, evidence, final reconciliation, and closure. |

## 2. Catalog and availability

Staging screens show source reference/checksum, normalized values, validation errors, and a field-level diff against the published version. Technical and Commercial approval are distinct actions. Publish is disabled when partner status, price validity, SLA reference, source, availability expiry, or required approval is missing.

Availability highlights snapshot age and separates partner-reported units from active holds. Staff cannot edit a snapshot; refresh creates a new one. A stale queue provides partner, offer, region, age, affected quotes, owner, and required action.

## 3. Quote and hold

The review page displays customer configuration and customer-visible terms separately from confidential partner cost/margin. Permissions determine whether confidential fields render at all. Operations confirms capacity/hold; Commercial approves price/SLA; Sales issues the quote. One role cannot bypass another approval through the UI.

When capacity changes, staff creates an alternative version and records reason. The original issued snapshot remains visible and immutable.

## 4. Provisioning workbench

The workbench includes contract/payment readiness, partner, requested configuration, submission checklist, idempotency status, external ticket reference, sanitized partner status, evidence references, owner, next action, and customer-safe projection preview.

No free-text field accepts or displays secrets. The UI includes a permanent warning and links to the approved secure channel. Retrying submission requires the same idempotency key unless staff intentionally creates a new approved case.

## 5. Usage and finance

- Import preview shows batch totals, units, timezones, unmapped deployments, duplicates, and errors before commit.
- Issued invoice fields are read-only; changes use adjustment/credit workflows.
- Bank allocation requires verified reference, amount, received time, and Finance actor.
- Supplier reconciliation displays accrued/reported/difference, categorized discrepancy, evidence, reviewer, and status.
- Maker/checker controls disable self-approval.

## 6. Support, incident, and SLA

Support view sanitizes customer input, links deployments, searches active incidents, and controls partner escalation. Incident view groups affected cases/deployments and maintains separate partner evidence and customer-safe update. SLA-credit approval shows customer contract rule and partner remedy separately.

## 7. Termination

Termination checklist requires authorization, effective date, customer notice, partner request/reference, access revocation, release/deletion evidence, service end, final usage/invoice, supplier statement, and open credit/dispute review. Close remains disabled until required conditions pass.

## 8. Interaction and safety rules

- Every mutation displays latest revision and handles 409 by reloading; no blind retry.
- External/financial commands show idempotency state and correlation ID.
- Destructive-looking lifecycle actions require explicit confirmation and reason.
- Customer projections can be previewed, ensuring internal partner detail is not leaked.
- List views use server pagination/filter/sort and never calculate business totals from partial pages.
- Permissions are enforced by the backend; disabled/hidden controls are not security boundaries.

