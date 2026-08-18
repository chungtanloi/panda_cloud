# Technical DD & Secure Documents — Frontend Integration Handoff

## Status

**Implemented on `feat/integration-v1-technical-documents` (uncommitted):**

- Frontend base inspected: `b3cb8c695a434a5020f4fa4887953af7a8f3a306`
  (`main`, before this branch).
- Backend authority inspected read-only at
  `upstream/main` `79160d1ed1a20bbe32bfe1a5de77d437bb0eebaf`.

- Technical DD assessment list/create/detail/progress/response update.
- Item-scoped DD evidence list, attach and detach.
- Private document upload-session, direct signed upload, finalization retry,
  metadata lookup and on-demand signed download.
- DD consumer DTOs now retain the gateway's real opaque identifiers, nullable
  fields and full progress counters; they do not synthesize deal titles,
  organization names, assessment status, or revisions.

The frontend uses only the backend `/api/v1` gateway through `services/api.ts`.
It neither calls Convex nor receives a storage bucket, object path, service key,
or persistent signed URL.

## Technical DD

| Screen | Gateway operation | UI behaviour |
| --- | --- | --- |
| `/technical/assessments?dealId=…` | `GET` / `POST /deals/{dealId}/due-diligence/assessments` | Lists one deal's assessments. Technical, Manager and Admin can initialize an assessment using the active template; clients do not send a template unless an approved selector is added. |
| `/technical/assessments/{assessmentId}` | `GET /due-diligence/assessments/{assessmentId}` and `/progress` | Displays the server template and response rows. Every response update sends the response's positive `expectedRevision`; a 409 reloads instead of blindly retrying. |
| response status | `PATCH /due-diligence/assessments/{assessmentId}/responses/{templateItemId}` | Sends only `status`, optional response value/comments, and `expectedRevision`. The UI does not invent a separate review mutation. |
| `/technical/assessments/{assessmentId}/evidence` | DD evidence endpoints below | Evidence is selected by a real template item returned from the assessment detail. |

The current DD list remains deal-scoped. Technical cannot currently enumerate a
global deal list under the established lookup/Kanban scope, so the existing
`DealPicker` deliberately falls back to an opaque handoff identifier when that
lookup is forbidden. This is an authorization/domain gap, not a client-side
deal-selector policy.

## Evidence and secure document flow

1. The page creates `POST /document-upload-sessions` with safe file metadata
   and `{ context: { type: "dd_assessment", resourceId } }` only.
2. The browser sends bytes directly to the one-time `uploadUrl` via the service
   adapter. PandaCloud HTTP and Convex never proxy file bytes.
3. The client calls `POST /documents/{documentId}/finalize`.
4. If finalization fails after a successful direct upload, **Retry finalize**
   repeats only step 3 against the same document id; it never creates a second
   document/object or re-uploads bytes.
5. Evidence uses:
   - `GET /due-diligence/assessments/{assessmentId}/responses/{templateItemId}/evidence`
   - `POST` on the same path with `{ documentId, documentRole? }`
   - `DELETE .../evidence/{documentId}`
6. The attach control first reads safe document metadata from
   `GET /documents/{documentId}` and stays disabled until the backend reports
   `malwareScanStatus: clean`. It never treats a successful finalize as clean.
7. A download is obtained only on demand through
   `POST /documents/{documentId}/download-session`; the response URL is passed
   immediately to the browser and is not persisted in application state.

## Authorization and safety

- Backend authorization remains the authority. UI guards only avoid presenting
  unavailable writes.
- DD read: staff roles; DD create/response/evidence write: `technical`,
  `manager`, `admin`; customers are denied by the backend.
- All request correlation/auth handling is centralized in `services/http.ts`:
  Clerk session bearer and `X-Correlation-Id` are sent to the gateway; canonical
  errors are normalized once.
- The frontend sends no role, organization selection, uploader identity,
  malware status, encryption status, bucket, object path, storage credential,
  or provider security metadata.

## Open decisions / backend dependencies

- **Cross-deal Technical discovery:** Technical has no canonical authorized
  deal-enumeration scope. Continue handoff-id fallback until a scoped read is
  accepted.
- **Malware provider:** current finalization leaves scan state pending. The
  frontend correctly blocks attachment until `clean`; production attachment
  cannot complete until the provider/state-transition design exists.
- **Unlinked-document discovery:** no canonical list exists for documents that
  were finalized for an assessment but are not yet attached. The UI supports a
  safe opaque document-id handoff and metadata check; do not add a client-side
  inventory or infer storage locations.
- **DD completion/cancellation:** no lifecycle mutation is implemented here.
- **Retention/legal hold, size/MIME policy and checksum verification:** retain
  the backend handoff's stated open decisions; the client must not enforce an
  invented business policy.

## Verification evidence

- Baseline: 93 tests in 12 files.
- This slice adds 4 focused tests, resulting in 97 tests in 14 files before
  final lint/build verification.
- `workspaceContracts.test.ts` verifies all DD workflow/evidence/document
  gateway paths, preserves exact response shapes, and prevents storage fields
  from entering request bodies.
- `SecureDocumentUpload.test.tsx` proves finalize retry reuses the same
  document id and does not repeat upload-session creation or the direct PUT.
- `AssessmentDetail.test.tsx` proves a 409 OCC response reloads the assessment
  instead of overwriting the other writer's response.

## Real E2E status

**NOT RUN.** This task did not call Clerk, the PandaCloud gateway, Convex, or
Supabase. A bounded non-production smoke test requires a configured Clerk dev
session, local/dev `/api/v1` gateway and HMAC transport, private Supabase
storage buckets, a Technical test user, a non-production deal with a published
DD template, and a safe test file. It must also include a controlled malware
scan state before testing evidence attachment.
