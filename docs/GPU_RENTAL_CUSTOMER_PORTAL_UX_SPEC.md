# GPU Rental Customer Portal UX Specification

**Status:** Proposed Design — do not implement against handwritten endpoints  
**Contract authority:** backend-owned released OpenAPI client  
**Product:** Partner-managed dedicated GPU/node rental

## 1. Navigation and route map

| Route | Purpose | Authentication |
|---|---|---|
| `/gpu-renting` | Published offer discovery and product explanation | Public |
| `/gpu-renting/configure` | Workload, region, hardware, quantity, delivery, and term | Public |
| `/gpu-renting/estimate` | Non-binding price/availability summary | Public |
| `/gpu-renting/request-quote` | Confirm organization/contact and submit request | Required |
| `/portal/quotes` | Customer quote list | Required + organization scope |
| `/portal/quotes/[quoteId]` | Quote, operator disclosure, SLA, expiry, and acceptance | Required + organization scope |
| `/portal/gpu/deployments` | Deployment list | Required + organization scope |
| `/portal/gpu/deployments/[deploymentId]` | Provisioning/active/termination status and secure-access guidance | Required + organization scope |
| `/portal/gpu/deployments/[deploymentId]/usage` | Usage periods and adjustments | Required + organization scope |
| `/portal/billing/invoices` | Invoice/payment status | Required + billing permission |
| `/portal/support` | Cases and incident updates | Required + organization scope |

Final route names may change only through FE/BE contract and information-architecture review. The screen behaviors below are authoritative requirements input.

## 2. Anonymous configuration

The wizard collects workload category, region, approved hardware profile, dedicated GPU/node unit, quantity, VM/bare-metal delivery type, billing model, term, and requested start date. It never collects email, name, organization, secrets, model data, or workload content before authentication.

The estimate displays:

- Configuration and price version.
- USD estimate breakdown and billing unit.
- Availability state and snapshot age.
- Lead-time range.
- Explicit non-binding and reconfirmation disclaimer.
- Sign-in action to request a quote.

Unavailable offers cannot continue. `limited` and `on_request` offers may continue with explicit review messaging. Stale offers are not represented as available.

## 3. Quote request and tracking

After Clerk sign-in, the user selects an authorized organization or receives the approved personal-organization flow. The request confirms contact, configuration, quantity, term, start date, and business context.

Quote detail shows customer-safe states:

- Capacity review.
- Commercial review.
- Issued with expiry.
- Accepted, expired, rejected, or cancelled.
- Alternative proposed when capacity/configuration changes.

The issued quote must show Panda Cloud as contracting party, the infrastructure operator/subprocessor disclosure, configuration, region, delivery type, term, price, SLA summary/exclusions, payment condition, expiry, and downloadable approved document. It must not expose supplier cost, margin, partner agreement, or internal notes.

Acceptance requires the latest revision and an explicit confirmation. A 409 reloads the quote and never retries acceptance blindly.

## 4. Provisioning and deployment

Customer-facing provisioning states use clear language rather than internal partner/ticket states:

| Internal state | Customer presentation |
|---|---|
| `draft/submitted/acknowledged` | Order received; partner scheduling in progress. |
| `allocated/provisioning` | Capacity allocated; environment being prepared. |
| `ready_for_acceptance` | Access ready; follow secure-delivery instructions. |
| `active` | Service active. |
| `partner_blocked/capacity_unavailable` | Delivery requires review; Panda Cloud will provide options. |
| `failed` | Provisioning issue under investigation. |

The portal never displays credentials or secret-bearing URLs returned from business APIs. It displays secure-delivery status, one-time-channel instructions, access recipient, delivery timestamp, and rotation/revocation guidance.

Customer acceptance confirms service start and visible configuration. A mismatch opens a support/operations review instead of silently activating billing.

## 5. Usage, invoice, and support

- Usage displays period, unit, validated quantity, adjustments, and billable status; partner raw rows remain hidden.
- Invoice displays immutable issued totals, credits, due date, bank-transfer instructions from approved finance configuration, payment allocations, and balance.
- Support intake verifies deployment, severity symptoms, impact, start time, and sanitized attachment workflow. It warns users never to submit passwords/private keys/tokens.
- Incident updates show customer-safe summaries and next-update expectations without raw partner messages.

## 6. Renewal and termination

Renewal shows current end date and requests a new capacity/price quote. It never promises automatic extension. Termination shows notice/effective date, service/access consequences, final usage/invoice process, and data deletion/return policy before confirmation.

## 7. Required UX states

Every view covers loading, empty, unavailable, stale, expired, validation, unauthenticated, forbidden, not found, revision conflict, partner delayed, provisioning failed, invoice overdue, support escalated, and network/server failure. Reduced motion, keyboard access, focus management, semantic errors, and WCAG AA contrast apply.

## 8. Frontend boundaries

- Components never call `fetch`; use the generated/pinned service boundary.
- Static config may contain approved explanatory copy and layout metadata only.
- No live price, stock, capacity, lead time, SLA, operator, invoice, or usage fixture may appear as production data.
- Unknown enum values fail closed and surface a compatibility error rather than a generic normal state.

