# KYC API conformance

Source: `PandaCloudBackend/docs/collaboration/KYC_API_HANDOFF.md` (2026-08-17).

The HTTP adapter now uses the deal-scoped gateway:

| Frontend operation | Backend route | Mapping |
|---|---|---|
| listCases(dealId) | `GET /api/v1/deals/{dealId}/kyc` | `{ cases }` → `{ items }` |
| createCase(dealId, body) | `POST /api/v1/deals/{dealId}/kyc` | deal id remains in the path |
| getCase(caseId) | `GET /api/v1/kyc/{caseId}` | `{ case }` mapped to the UI model |
| updateCase(caseId, body) | `PATCH /api/v1/kyc/{caseId}` | dates are Unix milliseconds; `expectedRevision` is preserved |
| listDocuments(caseId) | `GET /api/v1/kyc/{caseId}/documents` | document list envelope preserved |
| attachDocument / detachDocument | `POST` / `DELETE` document route | only `documentId` and optional `documentRole` are sent |

The create UI keeps organization/contact XOR validation. Update UX must require a rejection reason for `rejected` and a verification timestamp for `approved`; authorization remains backend-enforced. Missing `dealId` is a deliberate context-required state, not a global query fallback.

Changed frontend files: `src/services/endpoints.ts`, `src/services/contracts.ts`, `src/services/http-impl/index.ts`, `src/services/mock/index.ts`, `src/models/kyc.ts`, and compliance screens.

Validation: TypeScript passes for the migration code; the repository still reports pre-existing Sales adapter test fixture errors in `src/components/sales/salesAdapter.test.ts`.
