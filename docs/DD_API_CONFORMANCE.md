# Due Diligence API conformance

Source: `D:\Project\PandaCloudBackend\DD API.md` and the implemented backend gateway (2026-08-17).

| Frontend operation | Backend route | Mapping |
|---|---|---|
| listAssessments(dealId) | `GET /api/v1/deals/{dealId}/due-diligence/assessments` | `{ assessments }` → `{ items }` |
| createAssessment(dealId, body) | `POST /api/v1/deals/{dealId}/due-diligence/assessments` | deal id is path-scoped; body sends templateVersionId/assignedTo only |
| getAssessment(id) | `GET /api/v1/due-diligence/assessments/{assessmentId}` | maps `{ assessment, items, responses }` |
| getProgress(id) | `GET /api/v1/due-diligence/assessments/{assessmentId}/progress` | maps `live` metrics; materialized/consistent remain backend data |
| updateResponse(id, itemId, body) | `PATCH /api/v1/due-diligence/assessments/{assessmentId}/responses/{templateItemId}` | sends status, optional value/comments, and required expectedRevision |

No complete/cancel or evidence-upload endpoint was added. OCC revisions and backend error envelopes remain intact. Display-only deal and organization labels use the identifiers until a separate approved lookup contract is available.

Changed frontend files: `src/services/http-impl/index.ts`, `src/models/dueDiligence.ts`, and the technical assessment screens. TypeScript migration code is clean; the repository's existing Sales test fixture errors remain.
