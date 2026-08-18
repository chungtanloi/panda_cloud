# Frontend checklist status report

Date: 2026-08-18

Status meanings: **DONE** = implemented and locally validated; **PARTIAL** =
frontend implementation exists but live integration evidence or an external
decision is still missing; **BLOCKED** = cannot be completed by frontend alone.

| Item from the checklist | Status | Short assessment |
|---|---|---|
| Synchronize Backend `main` with `origin/main` | OUTSIDE FE SCOPE | Backend repository ownership/release task. Preserve its uncommitted documentation before synchronization. |
| Fix remaining `createCard` fixture type errors | DONE | Sales adapter fixtures compile; frontend typecheck passes. |
| Sales Overview, Leads, Tasks, Customers and Reports E2E | PARTIAL | Screens and HTTP adapters are connected and contract-tested. A real Clerk session plus seeded backend data is still needed for browser E2E evidence. |
| KYC and NCNDA end-to-end tests | PARTIAL | Create/update, OCC, document list/attach/detach and secure upload UI exist. Real Clerk, storage, malware-state and deliberate `409` E2E cases remain. |
| Review and freeze the OpenAPI integration candidate | BLOCKED — JOINT | Current OpenAPI validates and matches runtime routes, but Product/Frontend/Backend have not published a frozen versioned release or generated client. |
| Connect Technical DD workspace to live backend | DONE | Assessment list/detail, responses, progress and evidence use the API abstraction; no browser-to-Convex call. |
| Browser signed upload and finalize | FE DONE / LIVE PARTIAL | Frontend implements upload-session → signed storage PUT → finalize and waits for a clean malware status. Live storage verification remains. |
| Friendly Deal/organization/contact/owner selectors | PARTIAL | Lookup service and reusable Deal picker exist. Backend scope still denies Legal/Compliance/Technical Deal lookup and Legal organization lookup, so those roles retain a safe ID fallback. |
| Confirm KYC/NCNDA lifecycle and uniqueness | BLOCKED — PRODUCT/BE | Frontend renders backend state and guidance only; it does not invent automatic creation or current-case uniqueness rules. |
| Confirm lead ownership and reporting formulas | BLOCKED — PRODUCT/BE | Frontend preserves backend scope and per-currency results; unresolved reporting rules remain backend-owned. |
| Full regression and handoff | AUTOMATION DONE / E2E PARTIAL | Frontend typecheck, lint, 78 tests and production build pass. Backend regression and OpenAPI checks also pass. Real cross-repository browser E2E and a formal integration defect list remain. |
| Decide Quotes schema and MVP scope | BLOCKED — PRODUCT | Quotes stays an honest blocked surface; frontend does not fabricate persistence or calculations. |

## Additional work completed outside the checklist

- Added Deal Readiness combining NCNDA, KYC and Technical DD.
- Added Sales → Manager Deal change requests for **Won**, **Lost** and
  **Archive**, with Manager/Admin approval instead of direct terminal drag.
- Added backend-owned Pipeline Transition Policy, preflight blockers/warnings,
  On Hold inputs, audited Manager override and OCC conflict handling.
- Added Sales milestone evidence for completed contact, Proposal sent and
  customer response.
- Removed primary opaque Deal ID entry where lookup scope permits; added an
  explicit fallback where backend authorization still blocks lookup.
- Kept Clerk Bearer authentication, API service boundaries and backend
  authorization authoritative.

## Current validation snapshot

- Frontend: typecheck **PASS**, lint **PASS**, tests **78/78 PASS**, build **PASS**.
- Backend integration touched by this work: typecheck **PASS**, tests **223/223
  PASS**, OpenAPI lint **PASS**, route parity **4/4 PASS**, build **PASS**.

## Remaining priorities

1. Run real Clerk E2E for Sales and KYC/NCNDA workflows.
2. Widen backend lookup scope for Legal, Compliance and Technical if approved.
3. Freeze and version OpenAPI, then adopt a generated frontend client.
4. Decide KYC/NCNDA lifecycle rules, reporting formulas and Quotes MVP.
