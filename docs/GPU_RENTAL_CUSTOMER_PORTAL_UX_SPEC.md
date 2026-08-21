# GPU Rental Customer Portal UX Specification

**Status:** Proposed Design — G0 documentation baseline, not an implemented or approved customer journey  
**Owner:** Frontend and Product  
**Required reviewers:** Backend, Security, Legal, Commercial, Operations, Support, Finance, and QA

## 1. Authority and boundary

This specification defines the Target State customer experience for
partner-managed GPU Rental. It does not authorize endpoints, fields, prices,
availability, SLA claims, or production activation.

The backend-owned
[GPU Rental FE-BE Execution Plan](../../PandaCloudBackend/docs/collaboration/GPU_RENTAL_FE_BE_EXECUTION_PLAN.md)
controls delivery order. The Frontend consumes only a pinned generated client
from a reviewed contract release. Components never call Convex or a partner
system and never infer trusted organization, role, permission, price, or
capacity from browser state.

The current five-step booking wizard is an `Existing Prototype`. It is not a
source for the Target State and receives no compatibility adapter or draft
migration.

## 2. Customer route map

| Route | Access | Required experience | Activation dependency |
|---|---|---|---|
| `/gpu-renting` | Public | Explain partner-managed service, published-offer discovery, freshness and non-binding language. | G3 public offer API; consultation-only before G3. |
| `/gpu-renting/configure` | Public | Collect workload context, approved offer, quantity, term, and requested start date. | G3 released client. |
| `/gpu-renting/estimate` | Public | Show server-returned estimate, line items, currency, price version, availability age/expiry, lead time, and disclaimer. | G3 estimate API. |
| `/gpu-renting/request-quote` | Authenticated | Confirm active organization and contact context, then create a quote request. | G4 quote API and Clerk membership. |
| `/portal/quotes` | Organization-scoped | List customer-safe quote states and next actions. | G4. |
| `/portal/quotes/[quoteId]` | Organization-scoped | Show operator disclosure, terms, expiry, revision, document, and acceptance. | G4. |
| `/portal/gpu/deployments` | Organization-scoped | List deployments and customer-safe lifecycle state. | G5-G6. |
| `/portal/gpu/deployments/[deploymentId]` | Organization-scoped | Show provisioning, secure-delivery guidance, acceptance, incident, renewal, and termination entry. | G5-G7. |
| `/portal/gpu/deployments/[deploymentId]/usage` | Organization-scoped | Show immutable normalized periods, quantities, adjustments, and billable status. | G6. |
| `/portal/billing/invoices` | Billing permission | Show issued totals, allocations, balance, due date, and approved bank instructions. | G6. |
| `/portal/support` | Organization-scoped | Create deployment-linked cases and show customer-safe incident updates. | G6. |

Before an activation dependency passes, the production route is unavailable or
renders the approved consultation-only state. It never substitutes prototype
data.

## 3. Journey and behavior

1. A visitor reads the service and availability disclaimer.
2. The visitor selects only a published offer and its allowed configuration.
3. The browser submits non-PII configuration to the estimate operation.
4. The UI renders only server-returned money and immutable line items.
5. Request Quote requires Clerk authentication and an active customer
   organization; the backend resolves trusted scope.
6. The customer follows review until a quote is issued.
7. Quote acceptance includes current revision and never displays provisioning
   as its side effect.
8. Contract/payment readiness and provisioning remain customer-safe status
   projections until access is ready through the approved secure channel.
9. Active customers can inspect usage, invoices, support, renewal, and
   termination without seeing confidential supplier data.

Workload is descriptive business context only. The UI does not recommend a
provider, guarantee suitability, or calculate commercial terms. Delivery,
tenancy, SLA, lead time, billing unit, and minimum term come from the selected
offer. `hybrid`, physical cooling, and free-form SLA selection are excluded.

## 4. Required view states

Every contract-backed screen covers:

- Loading, empty, success, partial/delayed, and service-unavailable states.
- Offer unavailable, limited, on-request, stale, expired, or superseded.
- Estimate or quote expired.
- Authentication required, permission denied, and no-leak resource not found.
- `REVISION_CONFLICT`: discard no data, load the latest representation, and
  require explicit review before another command.
- `CAPACITY_CONFLICT`: explain that capacity requires review and offer only an
  explicit alternative flow.
- Unknown enum or incompatible client: fail closed with an update/support
  message instead of treating it as a known successful state.
- Partner blocked, capacity unavailable, delayed, failed, degraded, suspended,
  terminating, and terminated customer-safe language.

The UI never silently substitutes GPU profile, operator, region, delivery
type, price, SLA, or term.

## 5. Content and security rules

- Show Panda Cloud as contracting party and L1 support provider.
- Show the approved operator/subprocessor name only on issued quote, contract,
  and authorized deployment views.
- Do not expose supplier cost, margin, partner agreements, escalation contacts,
  raw source files, internal notes, or provider payloads.
- Do not display or store passwords, private keys, tokens, credentials, or
  secret-bearing URLs.
- Local draft key: `panda.gpuRental.v1.draft`; store only non-sensitive
  configuration context and ignore `cp.booking.draft`.
- Use server-returned minor-unit money and ISO currency; do not perform browser
  discounts, egress, support, invoice, or SLA-credit calculations.
- Use typography, structured border cards, and text status badges. Do not use
  decorative SVG icons, emoji, or icon fonts.

## 6. Acceptance criteria

- Consultation-only production state contains no mock catalog, price,
  availability, reservation, or deployment action.
- Anonymous estimate contains no PII and exposes its price/availability expiry.
- Quote request cannot use client-supplied organization authority.
- Quote acceptance does not create a provisioning case.
- A stale revision cannot be retried blindly.
- Cross-organization quote, deployment, usage, invoice, and support access
  fails closed.
- No customer response or rendered view exposes confidential or secret data.
- Tests cover every state in section 4 using generated contract types.

