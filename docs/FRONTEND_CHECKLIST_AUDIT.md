# Frontend checklist audit

Date: 2026-08-18

| Checklist item | Frontend status | Evidence / remaining dependency |
|---|---|---|
| Synchronize backend `main` | OUT OF FRONTEND SCOPE | Repository operation owned by Backend; no frontend mutation performed. |
| Fix `createCard` fixture type errors | DONE | `tsc --noEmit --incremental false` passes. Existing Sales adapter tests compile. |
| Sales Overview/Leads/Tasks/Customers/Reports E2E | PARTIAL | HTTP adapters and six new contract tests cover routes and request mapping. A live Clerk browser session and seeded backend dataset are still required for true E2E evidence. |
| KYC and NCNDA E2E | PARTIAL | Deal-context UI, create/update/OCC handling and adapter route tests exist. Live creation, 409 conflict, upload scan, attach/detach still require a configured backend, Clerk users and storage/malware state. |
| Freeze OpenAPI integration candidate | BLOCKED — JOINT DECISION | Product and Backend must publish/version the candidate. Frontend continues through typed service adapters; no generated client is claimed. |
| Connect Technical DD to live backend | DONE | HTTP adapter uses implemented deal list, detail, progress and response routes. Deal Readiness now loads DD with NCNDA/KYC. No direct Convex or mock-only UI assumption. |
| Browser signed upload and finalize | FRONTEND DONE / INTEGRATION PARTIAL | Added upload-session → signed PUT → finalize service and reusable UI. Automatic KYC/NCNDA attachment occurs only when backend reports `malwareScanStatus=clean`; pending scan is shown honestly. |
| Lookup APIs and friendly selectors | FRONTEND MITIGATED / BACKEND BLOCKED | Deal Card supplies organization, owner and primary contact. Raw ID fields were removed. Staff-wide Deal, Legal, Compliance and Technical queue endpoints are still absent. |
| KYC/NCNDA lifecycle and uniqueness policy | BLOCKED — PRODUCT | Frontend guides documented transitions but does not invent a strict backend state machine or current-case uniqueness rule. |
| Lead ownership and report formulas | BLOCKED — PRODUCT/BACKEND | Frontend renders backend raw report components and preserves per-currency money. |
| Full regression and handoff | PARTIAL | Typecheck and lint pass. New contract suite: 6/6 assertions pass; Vitest then reports a local EPERM while writing `node_modules/.vite/vitest/results.json`. Live E2E/build evidence remains outstanding. |
| Quotes schema and MVP scope | BLOCKED — PRODUCT | Quotes remain an explanatory blocked surface; frontend does not fabricate persistence. |

## Frontend changes completed in this pass

- Added typed secure document transfer models and `DocumentsService`.
- Added HTTP and mock implementations for upload session, signed PUT and finalize.
- Added reusable `SecureDocumentUpload` with SHA-256 computed in the browser.
- Integrated upload UI into KYC and NCNDA document screens.
- Added adapter tests for Sales reports, KYC, NCNDA, DD, Manager conversion and documents.
- Preserved backend error/OCC/authorization ownership and avoided client-supplied identity or role fields.

## Required live test prerequisites

- Frontend and backend running with the same Clerk instance.
- Active Sales, Legal, Compliance, Technical, Manager and Admin test memberships.
- Seeded Deal with organization, primary contact and owner.
- Configured private Supabase buckets and signed upload credentials.
- A malware/encryption state transition mechanism if attachment-after-finalize is expected.
