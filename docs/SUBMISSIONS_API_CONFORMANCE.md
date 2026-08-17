# Submission API conformance

Source: `PandaCloudBackend/docs/collaboration/SUBMISSIONS_API_HANDOFF.md` (2026-08-17).

`SubmissionService` is implemented in the HTTP adapter:

| Operation | Route | Notes |
|---|---|---|
| create | `POST /api/v1/submissions` | anonymous marketing submission is supported |
| list | `GET /api/v1/submissions` | forwards status/cursor and returns `leads`, `continueCursor`, `isDone` |
| get | `GET /api/v1/submissions/{submissionId}` | staff-only backend authorization |
| convert | `POST /api/v1/submissions/{submissionId}/convert` | requires organizationId, ownerId, title, vertical, priority |

Marketing form values are mapped to `source`, `persona`, `vertical`, and `summary`. Conversion is an explicit transaction owned by the backend; the frontend does not create a Kanban card as a side effect and does not send role, membership, or Clerk subject fields.

Changed frontend files: `src/models/submission.ts`, `src/models/index.ts`, `src/services/contracts.ts`, `src/services/endpoints.ts`, and `src/services/http-impl/index.ts`.

Validation: adapter type-check is clean. Full repository type-check remains blocked by pre-existing Sales adapter test fixture errors.
