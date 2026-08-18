# KYC + NCNDA Frontend Integration — Phase 1

## Audited bases

- Frontend base: `4dc8e5a` (`main`, Technical DD + Secure Documents merge).
- Backend audited read-only: `79160d1`.
- The frontend consumes the public `/api/v1` gateway through the shared Clerk
  bearer client. It does not call Convex, storage administration APIs, or any
  provider directly.

## Approved APIs consumed

### KYC

- `GET` / `POST` `/deals/{dealId}/kyc`
- `GET` / `PATCH` `/kyc/{kycCaseId}`
- `GET` / `POST` `/kyc/{kycCaseId}/documents`
- `DELETE` `/kyc/{kycCaseId}/documents/{documentId}`

KYC begins from Deal Readiness. Creation offers the selected deal's organization
or primary contact and sends exactly one opaque subject id:
`subjectOrganizationId` XOR `subjectContactId`. It never sends a role,
organization authorization override, Clerk subject, storage bucket/object path,
malware state, encryption state, or provider payload.

KYC detail uses the returned revision as `expectedRevision`. A `409 CONFLICT`
reloads the authoritative case and shows the correlation id; it does not retry a
stale write. Status editing is labelled as the currently supported manual status
update, not provider verification or a finalized lifecycle.

### NCNDA

- `GET` / `PATCH` `/deals/{dealId}/ncnda`
- `GET` `/ncnda/{agreementId}`
- `GET` / `POST` `/ncnda/{agreementId}/documents`
- `DELETE` `/ncnda/{agreementId}/documents/{documentId}`

NCNDA begins from Deal Readiness. The approved PATCH body contains only the
published update fields; `dealId` selects the route and is not sent in the JSON
body. The current gateway requires `expectedRevision`, including `1` for the
initial drafting create. Detail uses the server revision and reloads after a
`409`; the UI presents a manual status update rather than a client-owned state
machine.

## Documents

KYC and NCNDA reuse `SecureDocumentUpload`:

1. create a backend-authorized upload session;
2. browser uploads bytes to the short-lived private URL;
3. finalize the server-owned document (retrying only finalize on failure);
4. attach only after the backend reports malware status `clean`;
5. request an on-demand signed download URL only when the user clicks Download.

Detach removes the domain association only. It does not delete the document or
storage object. Backend `409` errors for expired or cancelled KYC cases are
surfaced without a client-side workaround.

## Readiness and queues

KYC and NCNDA mutations invalidate the existing centralized Deal Readiness cache
and reload the current readiness page. No duplicate readiness evaluator was
introduced.

The Legal and Compliance landing pages are truthful deal-scoped landings. There
is no approved global KYC or NCNDA queue, and legal/compliance users cannot use
Sales enumeration as a substitute.

## CR-004 policy

CR-004 is **not consumed**. In particular, no production route invokes:

- `GET /ncnda`
- `GET /ncnda/summary`
- `POST /ncnda/{agreementId}/transitions`

The existing CR-004 prototype service/model code remains isolated for review but
is not mounted by the Legal workspace. Controlled NCNDA transitions and a
cross-deal Legal queue remain blocked pending approved backend/OpenAPI contract.

## Status matrix

| Capability | Status | Notes |
|---|---|---|
| KYC Deal entry/create/detail/manual update | READY_WITH_OPEN_POLICY | Approved gateway APIs; transition graph, case uniqueness and provider semantics remain open. |
| KYC documents | LIVE_BACKEND | Shared secure upload, attach/detach and signed download. |
| Compliance global queue | BLOCKED | No cross-deal KYC API or authorized deal enumeration. |
| NCNDA Deal entry/detail/manual update | READY_WITH_OPEN_POLICY | Approved deal-scoped upsert/PATCH only; no frontend state machine. |
| NCNDA documents | LIVE_BACKEND | Shared secure upload, attach/detach and signed download. |
| Legal global queue | BLOCKED | CR-004 proposal is not approved or consumed. |
| NCNDA controlled transitions | BLOCKED | Pending CR-004 approval and release. |

## Verification

- Focused frontend test coverage: KYC organization/contact XOR creation, stale
  KYC reload, clean/closed-document attachment, NCNDA document list and
  revision-guarded update, no live CR-004 queue, and approved adapter paths.
- Frontend tests at this documentation update: `105`.
- Real E2E: **NOT RUN**. It requires a non-production Clerk development user,
  legal and compliance test memberships, configured gateway/Convex HMAC,
  private storage, a safe deal, KYC organization/contact, NCNDA agreement and a
  controlled document.

## Open product/backend decisions

- KYC canonical transition graph, current-case uniqueness, multiple active
  cases per deal, provider verification, automated approval/rejection and
  notifications.
- NCNDA cross-deal queue and controlled transition resource (CR-004).
- Any global Legal/Compliance discovery scope.
