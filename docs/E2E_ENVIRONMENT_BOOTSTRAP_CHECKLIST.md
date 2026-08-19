# Non-Production E2E Environment Bootstrap Checklist

This checklist prepares the existing cross-workspace E2E runbook. It does not
create accounts, bypass authorization, write Convex tables directly, seed
production, or manufacture malware state.

## Automatable now

- [x] Keep the frontend on `main` and synchronized with `origin/main`.
- [x] Keep the backend on `main` and synchronized with `upstream/main`.
- [x] Use the documented local ports: frontend `3000`, gateway `3001`.
- [x] Keep the frontend adapter set to HTTP for real integration runs.
- [x] Keep `.e2e.local.json` ignored and limited to placeholder IDs.
- [ ] Remove `CLERK_SECRET_KEY` from `panda_cloud/.env`.
- [ ] Remove `SUPABASE_STORAGE_SERVICE_ROLE_KEY` from `panda_cloud/.env`.
- [ ] Ensure no other server-only values are present in frontend environment
      files. Do not commit `.env` or `.env.local`.

## Owner / Clerk Dashboard action

- [ ] Create one non-production Clerk Sales identity using an owner-controlled
      test-only address, for example `e2e.sales+<tenant>@example.invalid`.
- [ ] Create Technical, Compliance, Legal, Manager and Admin identities using
      the same test-only naming convention. Do not use real customer accounts.
- [ ] Confirm each identity signs in to the same non-production Clerk tenant.
- [ ] Confirm the backend Clerk issuer, audience and authorized party settings
      correspond to that tenant and `http://localhost:3000`.
- [ ] Confirm the Clerk user webhook reaches the non-production gateway. The
      webhook only synchronizes identity/profile; it does not grant roles.

## Owner / PandaCloud membership action

There is no approved public identity-provisioning or membership-provisioning
API in the current repositories. Clerk Organizations are not the source of
truth for PandaCloud business roles. `organizationMemberships` in Convex is.

- [ ] Through an owner-approved existing development/bootstrap mechanism,
      create or identify one disposable organization named `PandaCloud E2E Test
      Org` (or the existing non-production convention).
- [ ] Ensure each Clerk identity has one internal `users` record mapped by its
      verified Clerk subject.
- [ ] Add active memberships in that organization with exactly these canonical
      roles: `sales`, `technical`, `compliance`, `legal`, `manager`, `admin`.
- [ ] Verify each identity through `GET /api/v1/auth/me`; never put a role or
      organization selector in the browser request.
- [ ] If no owner-approved mechanism exists, leave this section unresolved and
      classify the next run as `TEST_DATA_BLOCKER`; do not edit Convex directly.

## Role readiness table

| Role | Clerk identity | PandaCloud user | Active membership | Expected allowed scope | Ready? |
| --- | --- | --- | --- | --- | --- |
| Sales | Required | Required by Clerk subject | `sales` in test org | Sales reads, assigned pipeline, non-terminal work, change requests | NO |
| Technical | Required | Required by Clerk subject | `technical` in test org | Deal-scoped DD and authorized document work | NO |
| Compliance | Required | Required by Clerk subject | `compliance` in test org | Deal-scoped KYC | NO |
| Legal | Required | Required by Clerk subject | `legal` in test org | Deal-scoped NCNDA | NO |
| Manager | Required | Required by Clerk subject | `manager` in test org | All pipeline, projects, reports, request decisions | NO |
| Admin | Required | Required by Clerk subject | `admin` in test org | Manager scope plus read-only governance views | NO |
| Customer (optional) | Optional | Required if tested | No staff membership | Customer-only authorized scope; staff endpoints denied | NO |

## Fixture readiness table

| Fixture | Creation mechanism | Required role | Ready? |
| --- | --- | --- | --- |
| Test organization | Owner-approved development bootstrap only | Admin/owner | NO |
| Contact A | Existing authorized Sales/application workflow | Sales | NO |
| Lead A | Public submission then Sales conversion | Sales | NO |
| Deal A, normal stage | Approved Sales deal creation | Sales | NO |
| Deal B, DD candidate | Deal A-style creation, then DD assessment API | Technical | NO |
| Deal C, KYC/NCNDA candidate | Deal creation, then deal-scoped KYC/NCNDA APIs | Compliance/Legal | NO |
| Deal D, legitimate Won deal | Normal terminal change-request approval flow | Sales + Manager/Admin | NO |
| Pending change request | Sales request API with current revision/idempotency key | Sales | NO |
| Published DD template/version | Existing non-production reference-data seed mechanism | Admin/bootstrap | UNVERIFIED |
| Tiny safe document | Existing upload-session → direct upload → finalize flow | Technical | NO |

## Infrastructure / product action

- [ ] Confirm the Convex target is the intended non-production deployment and
      that `CONVEX_SITE_URL` and the deployment HMAC are the matching pair.
- [ ] Confirm Supabase URL and buckets are non-production private storage.
- [ ] Confirm a legitimate scanner process can transition a finalized document
      to `clean`. If none exists, record attachment workflows as
      `PASS_WITH_EXPECTED_POLICY_BLOCK`; never set the field manually.
- [ ] Keep Quotes, generic Operations, global Legal/Compliance queues, dynamic
      Permissions/Settings, and other documented product-policy gaps blocked.

## Gate for the next E2E run

The next run may begin only after at least one Sales identity passes
`/api/v1/auth/me`, Manager/Admin identities exist for terminal decisions,
Technical/Compliance/Legal identities exist for their lanes, the test
organization and memberships resolve server-side, and the required disposable
records can be created through approved APIs. Malware scanning is not required
for the overall gate if evidence attachment remains visibly and truthfully
blocked.
