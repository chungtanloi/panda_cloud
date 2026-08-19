# PandaCloud Cross-Workspace E2E Runbook — Phase 1

This runbook exercises the current frontend through the backend-owned
`/api/v1` gateway in a disposable, non-production environment. It is not a
seed script, deployment guide, or permission workaround.

## Prerequisites

| Requirement | Status from local audit | Required for a real run |
| --- | --- | --- |
| Frontend HTTP adapter, API base URL and Clerk publishable key | PRESENT locally; deployment alignment UNVERIFIED | Set `NEXT_PUBLIC_API_ADAPTER=http`, a base URL ending in `/api/v1`, and the matching Clerk publishable key. |
| Backend Clerk, HMAC gateway and private-storage configuration | PRESENT locally; live deployment alignment UNVERIFIED | Matching Clerk issuer/audience/authorized parties, `CONVEX_SITE_URL`, HMAC secret and private Supabase storage. |
| Convex deployment and gateway | UNVERIFIED | A disposable dev deployment whose HTTP gateway is reachable from the frontend base URL. |
| Clerk sessions and PandaCloud memberships | UNVERIFIED | Active Sales, Technical, Compliance, Legal, Manager and Admin test identities in the same active Cloud Panda organization. |
| Disposable records | MISSING/UNVERIFIED | The fixture set below, created only in non-production. |
| Trusted malware transition | UNVERIFIED | Required only before attaching a document as DD evidence. Never manufacture `clean`. |

Do not copy secret values into this document, a browser console, bug reports,
or screenshots. The frontend must use Clerk `getToken()` and the HTTP adapter;
it never talks directly to Convex.

## Start commands

Run these independently from their repository roots:

```text
# PandaCloudBackend
npm run dev

# panda_cloud
NEXT_PUBLIC_API_ADAPTER=http npm run dev
```

Use the environment-management mechanism for the remaining variables. Do not
put server-only Clerk, Convex, or Supabase credentials in `NEXT_PUBLIC_*`.
Before beginning, record the frontend and backend commit SHAs, environment
name, API base URL host (not credentials), and test-user aliases.

## Minimum non-production fixture set

| Fixture | Purpose | Safe mutation |
| --- | --- | --- |
| Cloud Panda organization A | Shared staff scope | None during smoke |
| Sales, Technical, Compliance, Legal, Manager, Admin users | Role matrix | Sign in only |
| Contact A and Lead A | Sales lead/qualification | One disposable qualification if needed |
| Deal A in a normal stage | Pipeline, tasks, activities | One non-terminal activity or move |
| Deal B | Technical DD and documents | One response update and safe document upload |
| Deal C | KYC and NCNDA | Revisioned create/update only |
| Won Deal D | Project conversion | One conversion with a unique project code |
| Pending terminal Deal Change Request | Manager/Admin decision | One decision only if deliberately pre-created |
| Tiny harmless test file | Upload/finalize/download | Use only disposable storage metadata |

Use opaque identifiers returned by the API. Do not invent organization IDs,
cursor values, roles, expected revisions, or malware state in the browser.

## Role smoke matrix

| Role | Expected allowed paths | Expected 403 / unavailable state |
| --- | --- | --- |
| Sales | Sales overview, leads, assigned pipeline, tasks, activities, customers, reports, lookups; request terminal deal changes | Manager/Admin reads, DD write, KYC write, NCNDA write, project conversion |
| Technical | Deal-scoped DD reads/writes and authorized document flow | Global technical discovery without an approved resource scope; Manager/Admin |
| Compliance | Deal-scoped KYC reads/writes and relevant readiness | Global compliance queue, Manager/Admin |
| Legal | Deal-scoped NCNDA reads/writes and relevant readiness | CR-004 global queue/transition proposal, Manager/Admin |
| Manager | All pipeline, change-request queue/decision, project conversion, Manager overview/team/projects/reports | Admin governance reads |
| Admin | Manager scope plus read-only Admin overview/users/roles/audit/events/health and change-request decision | Dynamic permissions/settings and manual webhook retry |
| Customer (optional) | Only explicitly authorized customer routes | Every staff workspace endpoint |

## Ordered smoke workflow

1. Sign in as each selected Clerk dev identity. Confirm `GET /api/v1/auth/me`
   returns the server-owned user and membership context. A missing/expired
   session must produce `401`, not a locally minted token.
2. As Sales, open Overview, Leads, Pipeline, Tasks, Customers, Reports and
   lookups. Page only with server-returned opaque cursors. Perform at most one
   safe non-terminal activity or move using the latest `expectedRevision`.
3. Run the terminal workflow only with the disposable fixture: request a
   terminal change from Sales, open the Manager or Admin queue, decide it,
   and refresh the deal. The deal must not change terminal state before the
   backend decision succeeds.
4. As Technical, create/read an assessment, update one response with its
   current revision, and confirm a `409` reloads rather than overwrites.
   Create an upload session, upload the harmless file directly to its
   ephemeral provider URL, finalize, and request a download session. Do not
   send bucket, object path, service credential, or persisted signed URL.
5. Attach evidence only if the finalized document already has a trusted
   backend `clean` scanner state. Otherwise record the blocked evidence lane;
   do not bypass it.
6. As Compliance and Legal, create/read/update the deal-scoped KYC/NCNDA
   records using their returned revisions. KYC subjects must use exactly one
   of organization or contact. Refresh Deal Readiness after each mutation.
7. As Manager, verify overview, team/detail, pipeline, Sales Performance,
   projects, project report and the request queue. Convert Won Deal D once
   with the latest deal revision, a fresh idempotency key and unique project
   code. Repeat only the same request to validate replay; a changed request
   with the same key must conflict.
8. As Admin, verify read-only overview, users/detail, roles, audit/detail,
   integration events/detail and system health. Event detail must show only
   safe lifecycle metadata—never payloads, signatures, tokens, headers,
   secrets, private URLs, or a retry button.

## Expected HTTP and client behavior

| Condition | Expected result |
| --- | --- |
| Valid request | Bare response payload and echoed `X-Correlation-Id` |
| Missing/invalid Clerk session | `401 UNAUTHENTICATED` |
| Inadequate role or out-of-scope resource | `403 FORBIDDEN` |
| Missing or inaccessible record | `404 NOT_FOUND` |
| Stale revision, duplicate project code, idempotency mismatch | `409 CONFLICT`; refresh authoritative state before retrying |
| Invalid input | `400 VALIDATION_ERROR`, with field/form feedback where supplied |

Capture the `X-Correlation-Id` response header (and normalized client error
correlation ID) with each failed smoke step. Never record the Authorization
header or JWT. For a reproducible issue, record role alias, endpoint/method,
safe request shape, status/error code, correlation ID, and fixture alias.

## Cleanup and rollback

- Prefer disposable fixtures that can remain as an auditable dev history.
- Do not hard-delete finalized documents, evidence associations, projects,
  audits, webhook events, or business records merely to make the environment
  look clean.
- If an owner-approved dev cleanup process exists, use it after capturing
  identifiers and correlation IDs. Otherwise label the record as a smoke
  fixture and retain it.
- A failed stale-revision or idempotency attempt needs no cleanup; refresh
  before considering a new intentional mutation.

## Current real-E2E decision

**E2E_BLOCKED.** Local configuration keys are present, but no external
provider or deployment was contacted during this audit. Matching live Clerk
sessions, active memberships, a reachable dev gateway/Convex deployment,
private storage, a trusted malware transition, and disposable fixture data
remain unverified. Execute this runbook only after those prerequisites are
confirmed by the environment owner.
