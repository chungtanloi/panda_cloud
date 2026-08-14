# Clerk authentication — frontend design and implementation record

**Repository:** `panda_cloud` (frontend)
**Date:** 2026-08-14
**Driving requirement:** `PandaCloudBackend/docs/collaboration/PHASE_1_FRONTEND_AUTH_HANDOFF.md`
("Required frontend migration") and CR-003 in `docs/CONTRACT_CONFORMANCE.md`.
**Status of the backing contract:** the backend OpenAPI source is `0.1.0-draft`
and is **not frozen, tagged, or released**. Everything below is written against
the one operation the draft defines, `GET /api/v1/auth/me`.

This document is the mandatory pre-implementation analysis. It records what was
read, what the architecture already is, what the flow must be, and every point
the source documents do not decide.

---

## A. Documents read

### Context / working agreements

| File | Repo |
|---|---|
| `AGENTS.md` | panda_cloud |
| `docs/AGENT_CONTEXT_SUMMARY.md` | panda_cloud |
| `HANDOFF.md` | panda_cloud |
| `AGENTS.md` | PandaCloudBackend |
| `docs/AGENT_CONTEXT_SUMMARY.md` | PandaCloudBackend |
| `README.md`, `docs/README.md` | both |

`D:\Project\AGENTS.md` exists at the workspace root but is 0 bytes.

### Backend documentation (complete corpus, 13/13 files)

- `docs/architecture/ADR-001-HTTP-API-CONTRACT-BOUNDARY.md`
- `docs/architecture/DEALFLOW_MVP_DATABASE_DESIGN.md`
- `docs/collaboration/frontend-backend-collaboration-workflow.md`
- `docs/collaboration/PHASE_1_FRONTEND_AUTH_HANDOFF.md`
- `docs/system-analysis/SYSTEM_ANALYSIS_OVERVIEW.md`
- `docs/system-analysis/USE_CASES.md`
- `docs/system-analysis/FUNCTIONAL_TREE.md`
- `docs/system-analysis/DATA_FLOW.md`
- `docs/system-analysis/SYSTEM_MODULES.md`
- `docs/business/CLOUD_PANDA_PDF_ANALYSIS.md`
- `docs/business/TIER_1_BUSINESS_MODEL_ASSESSMENT.md`

### Backend API contract

- `api-contracts/openapi.yaml`
- `api-contracts/components.yaml`
- `api-contracts/paths/auth-me.yaml`

### Backend implementation

- `convex/schema.ts`, `convex/auth.config.ts`, `convex/http.ts`,
  `convex/identity.ts`, `convex/gateway.ts`, `convex/webhooks.ts`
- `convex/lib/authorization.ts`, `errors.ts`, `validators.ts`, `gatewayAuth.ts`
- `src/bootstrap.ts`, `src/config/env.ts`, `src/domain/errors.ts`,
  `src/domain/identity/service.ts`, `src/domain/identity/types.ts`
- `src/http/auth-me-handler.ts`, `clerk-webhook-handler.ts`, `correlation.ts`,
  `cors.ts`, `responses.ts`
- `src/integrations/clerk.ts`, `src/integrations/convex.ts`
- `app/api/v1/auth/me/route.ts`, `app/api/webhooks/clerk/route.ts`
- `tests/auth-me.test.ts`, `clerk-authentication.test.ts`, `clerk-webhook.test.ts`
- `.env.example`, `package.json`

### Frontend documentation (complete corpus, 10/10 files)

`README.md`, `docs/API_CONTRACT.md`, `docs/CONTRACT_CONFORMANCE.md`,
`docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md`, `docs/PRODUCT_DATA_BACKEND_REQUIREMENTS.md`,
`docs/KANBAN_INTEGRATION.md`, `docs/VERIFICATION.md`, `docs/FIGMA_SCREEN_MAP.md`,
`docs/FIGMA_ASSETS.md`, `docs/MOTION.md`

### Frontend implementation

`package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `.env` (names only),
`src/app/layout.tsx`, all 66 route files, `src/controllers/*`,
`src/services/{api,config,contracts,endpoints,http,tokenStore}.ts`,
`src/services/http-impl/index.ts`, `src/services/mock/*`,
`src/models/*`, `src/config/access.ts`, `src/config/paths.ts`,
`src/components/workspace/*`, `src/components/sales/*`,
`src/components/dashboard/Sidebar.tsx`, `src/components/assessment/ReportDownload.tsx`.

---

## B. Current authentication architecture

### Backend (implemented, Phase 1 identity slice)

```text
Browser
  -> Authorization: Bearer <Clerk session JWT>
  -> Next.js gateway route  app/api/v1/auth/me/route.ts
  -> ClerkIdentityProvider.authenticate()          [@clerk/backend]
       verifies signature, audience, issuer, azp, acceptsToken=session_token
  -> IdentityService.me()
       resolveExisting(clerkSubject)               -> Convex HTTP action (HMAC-signed)
       if absent: getTrustedProfile() from Clerk   -> upsertIdentity  (idempotent)
  -> Convex internal mutation identity.resolveExisting / identity.upsertFromGateway
       requireUser(): users.by_clerkSubject, rejects suspended/disabled
       resolveActiveMemberships(): organizationMemberships.by_user_status
  -> AuthMeResponse { user, authorization: { isStaff, memberships[] } }
```

Gateway → Convex is **not** public: `convex/lib/gatewayAuth.ts` requires an
HMAC-SHA256 signature over `v1\n<timestamp>\n<requestId>\n<path>\n<sha256(body)>`
with `CONVEX_GATEWAY_SHARED_SECRET`, ±60 s clock skew.

`isStaff` is computed server-side as: at least one **active** membership whose
role is not `customer`, in an organization with `organizationType=cloud_panda`,
`status=active`, `archivedAt` unset (`convex/lib/authorization.ts`,
`src/domain/identity/service.ts`).

### Frontend (current, legacy — to be replaced)

```text
Login form -> AuthContext.login() -> api.auth.login() -> POST /auth/login
           -> tokenStore.set({accessToken, refreshToken}) in localStorage
           -> services/http.ts attaches Bearer, and on 401 calls POST /auth/refresh once
Session restore -> tokenStore.isValid() -> api.auth.me() -> GET /auth/me
Role            -> user.role: "USER" | "SALES" | "MANAGER" | "ADMIN"
Guarding        -> RoleGuard (client) + config/access.ts permissions
```

None of `POST /auth/login`, `/auth/signup`, `/auth/refresh`, `/auth/logout`,
`PUT /auth/path` exist in the backend or in the OpenAPI draft.

---

## C. Clerk flow (target — from the documentation, unchanged)

```text
User
 |
 v
Frontend (Next.js, panda_cloud)
 |  Clerk SDK custom flow (useSignIn / useSignUp)
 v
Clerk  ── issues session, owns refresh, owns MFA
 |
 v
Clerk session JWT  (getToken(), NO custom template; audience = CLERK_JWT_AUDIENCE)
 |
 v
services/http.ts   Authorization: Bearer <JWT> + X-Correlation-Id
 |
 v
Vercel HTTP Gateway  /api/v1  (PandaCloudBackend)
 |  verify signature / issuer / audience / azp
 v
Identity            users.clerkSubject -> internal user  (409 on collision)
 |
 v
Organization        organizationMemberships (active only)
 |
 v
Role                sales | compliance | legal | technical | manager | admin | customer
 |
 v
Authorization       requireUser / requireStaff / requireRole  (Convex, server-side)
 |
 v
Business Module     Convex domain functions
```

Sources: ADR-001 §Decision 1–2, collaboration workflow §1.1 and §7.1,
DEALFLOW_MVP_DATABASE_DESIGN §9.1, PHASE_1_FRONTEND_AUTH_HANDOFF.

---

## D. Frontend flow

### Sign up

```text
/signup  -> useSignUp().create({ emailAddress, password, firstName, lastName })
         -> prepareEmailAddressVerification({ strategy: "email_code" })
         -> user enters code -> attemptEmailAddressVerification
         -> setActive({ session })
         -> redirect (returnTo ?? /assessment)
```

Email verification is **required, not optional**: the backend returns
`409 IDENTITY_EMAIL_REQUIRED` when the Clerk primary email is not verified
(`src/integrations/clerk.ts` → `getTrustedProfile`). The existing Figma-built
form and copy are retained; only the submit handler changes
(PHASE_1: *"The existing PandaCloud visual design can remain"*).

### Sign in

```text
/login -> useSignIn().create({ identifier, password }) -> setActive -> redirect
```

### Session

Owned by Clerk. No PandaCloud token is created, stored, or refreshed.
`services/tokenStore.ts` (localStorage) and the refresh-and-replay branch in
`services/http.ts` are deleted (CR-003).

### User context

```text
ClerkProvider
  -> ClerkTokenBridge   registers Clerk getToken() into services/sessionToken
  -> AuthProvider       when Clerk reports signed-in: api.auth.me()
                        -> AuthProfile { user, authorization }
```

### Organization / role context

Derived **only** from `authorization.memberships[]` returned by `/auth/me`.
The frontend never sends or chooses `organizationId` or `role`.

### Protected route

```text
middleware.ts (clerkMiddleware)  -> authentication gate, redirects to /login
RoleGuard (client)               -> authorization gate, after /auth/me resolves
Backend                          -> the only real control
```

---

## E. Backend flow (already implemented — the frontend must not change it)

| Concern | Implementation |
|---|---|
| JWT verification | `ClerkIdentityProvider.authenticate` — `authenticateRequest` with `acceptsToken: "session_token"`, `authorizedParties`, `audience`, optional `jwtKey`; then re-checks `iss` and `azp` explicitly |
| Identity mapping | `users.by_clerkSubject`; `normalizedEmail` uniqueness checked inside the mutation; collisions raise `IDENTITY_SUBJECT_COLLISION` / `IDENTITY_EMAIL_COLLISION` → HTTP 409 |
| Membership resolution | `organizationMemberships.by_user_status` filtered to `status = "active"`; `isStaffOrganization` requires an active, non-archived `cloud_panda` organization |
| Authorization | `requireUser`, `requireStaff`, `requireRole` in `convex/lib/authorization.ts` |
| Webhook | `POST /api/webhooks/clerk` → `verifyWebhook` (Svix) → `svix-id` as `externalEventId` → `integrationWebhookEvents.by_provider_externalEvent` dedupe → `received/processing/processed/ignored/failed` → payload redacted to `{clerkSubject, email, fullName}` |
| Audit | `auditLogs` rows: `user.authenticated`, `user.identity_created`, `user.identity_updated`, `user.identity_disabled` |
| Idempotency | Webhook dedupe by `(provider, externalEventId)`; already-`processed`/`ignored` events short-circuit; `attemptCount` and truncated `lastError` recorded on failure |
| Error envelope | `{ errorCode, message, correlationId }` + `X-Correlation-Id` echoed |
| CORS | Origin allow-list from `CLERK_AUTHORIZED_PARTIES`; `GET, OPTIONS`; `Authorization, Content-Type, X-Correlation-Id` |

`user.deleted` sets `users.status = "disabled"`; it does not delete the record.
A disabled user then fails `requireUser` with `FORBIDDEN` → HTTP 403.

---

## F. API contract (only what the documentation defines)

| Operation | Auth | Response | Errors |
|---|---|---|---|
| `GET /api/v1/auth/me` (`getAuthenticatedIdentity`) | `ClerkSessionBearer` (Clerk session JWT) | `AuthMeResponse` | 401 missing/invalid/expired · 403 suspended/disabled · 409 identity collision/incomplete · 500 |

```ts
AuthMeResponse = {
  user: {
    id: string; email: string; fullName: string;
    userType: "staff" | "customer";
    status: "invited" | "active" | "suspended" | "disabled";
    createdAt: string; updatedAt: string; lastLoginAt?: string;
  };
  authorization: {
    isStaff: boolean;
    memberships: Array<{ organizationId: string; role: MembershipRole }>;
  };
};
MembershipRole = "sales" | "compliance" | "legal" | "technical"
               | "manager" | "admin" | "customer";
```

Optional request header `X-Correlation-Id`; always echoed in the response.

**No other authenticated operation exists in the contract.** Everything else in
`src/services/endpoints.ts` remains transitional requirements input
(`docs/API_CONTRACT.md` header, CR-006) and is left untouched by this task.

---

## G. Database mapping

```text
Clerk user            user.id  ("user_...")   -> immutable subject
   |
   v  users.clerkSubject            (UK, index by_clerkSubject)
internal user         users._id -> AuthMeResponse.user.id (opaque string)
   |  users.normalizedEmail         (UK, index by_normalizedEmail)
   |  users.userType: staff|customer     users.status: invited|active|suspended|disabled
   v
organizationMemberships  (organizationId, userId) unique via by_organization_user
   |  status: invited|active|suspended|removed   (only "active" is returned)
   v
organizations         organizationType: cloud_panda|customer|partner|vendor|investor|other
   |                  status: prospect|active|inactive|blocked; archivedAt
   v
role                  membershipRole (7 values above)
```

Creation/update rules, verbatim from the implementation:

- **Created**: on the first `/auth/me` for an unknown subject (gateway fetches the
  trusted Clerk profile and calls the idempotent upsert), or by the
  `user.created` webhook — whichever arrives first.
- **Defaults**: `userType = "customer"`, `status = "active"`, **no membership**.
  PHASE_1 states explicitly that this grants no staff privilege and no access to
  customer or business resources.
- **Updated**: `user.updated` webhook and every `/auth/me` (which patches
  `lastLoginAt` / `updatedAt`).
- **Disabled**: `user.deleted` webhook → `status = "disabled"`.
- **Membership changes**: there is **no** Clerk-organization webhook handler and
  no organization/membership sync in the code. Memberships are Convex-owned and
  currently have no write path. → NEEDS CLARIFICATION (U-04).

---

## H. Unresolved items — NEEDS CLARIFICATION

Not one of these is resolved by assumption in the implementation.

| ID | Item | Source | How the implementation behaves |
|---|---|---|---|
| U-01 | Is CR-003 approved by the FE and BE owners? | ROLE_PERMISSION_MATRIX §17 Q1 | Implemented per the backend's PHASE_1 handoff, which is an explicit "required frontend migration". Not deployable until owners confirm. |
| U-02 | `USER` vs `CUSTOMER` wire value; role enum casing (CR-005) | CONTRACT_CONFORMANCE CR-005; ROLE_PERMISSION_MATRIX §12.2 | The frontend stops carrying a role on the user object entirely and reads `authorization.memberships[].role` in canonical `lower_snake_case`. No wire value is invented. |
| U-03 | Precedence when a user holds several active staff memberships | not documented anywhere | Access is evaluated against the **whole set** of roles. Only the *default landing route* needs an order; a fixed, documented order is used and flagged here. |
| U-04 | How are organizations and memberships created/synchronised? | no handler in code; DEALFLOW §9.1 says Convex is the source of truth | Frontend never writes them. Users with no membership get the customer workspace only. |
| U-05 | May a staff-only identity open the customer workspace `/dashboard`? | PHASE_1: customer resource permission model "Needs Clarification" | **Existing behaviour preserved**: any authenticated identity may open `/dashboard`; `admin` may too (as today). Not tightened, not loosened. |
| U-06 | Admin access to Sales / Manager workspaces | ROLE_PERMISSION_MATRIX §12.3 | Unchanged from today (admin → admin + customer only). |
| U-07 | Permissions for `technical`, `legal`, `compliance`; their workspaces | ROLE_PERMISSION_MATRIX §11 note, §12.1 | Roles are recognised and carried, granted **no** permissions and **no** workspace; they land on `/` and see the 403 surface if they navigate to a workspace. Fail-closed. |
| U-08 | Does `/choose-path` require authentication? | ROLE_PERMISSION_MATRIX §17 Q5 | Left public, exactly as today. |
| U-09 | Does `PUT /auth/path` survive? Where is the product track stored? | PHASE_1 "no approved field or endpoint"; ROLE_PERMISSION_MATRIX §17 Q4 | Persistence removed (the endpoint does not exist). The page now routes only. Nothing is invented to replace it. |
| U-10 | Auth timing for `/booking`, `/investment/{kyc,payment,confirmation}`, `/hyperscale` | UC-007 precondition; ROLE_PERMISSION_MATRIX §17 Q6 | Unchanged from today. |
| U-11 | `/dashboard/sales` vs `/sales/pipeline` duplication | HANDOFF §14 P1; ROLE_PERMISSION_MATRIX §17 Q7 | Both kept; the staff check is migrated, the routing question is not decided here. |
| U-12 | Clerk organization ↔ `organizationMemberships` mapping | ROLE_PERMISSION_MATRIX §17 Q9 | Frontend uses Convex memberships only and ignores Clerk organizations. |
| U-13 | Sign-out destination and Clerk `afterSignOutUrl` | not documented | `/login`, matching today's `WorkspaceShell.leave()`. |
| U-14 | Is the Clerk instance provisioned; audience/authorized-parties agreed? | PHASE_1 "Integration configuration still required" | Environment template shipped; values are the team's to supply. |

---

## Route protection table

`Source` cites the document that decides the row. `NEEDS CLARIFICATION` means no
document decides it and current behaviour was preserved.

| Route | Public / Protected | Required role | Source |
|---|---|---|---|
| `/` | PUBLIC | — | UC-001 precondition "No login required"; CLOUD_PANDA_PDF_ANALYSIS §2A |
| `/gpu-renting`, `/buy-gpu`, `/energy-land`, `/financing`, `/infrastructure` | PUBLIC | — | UC-001, UC-022; FIGMA_SCREEN_MAP "Marketing / public" |
| `/login`, `/signup` | PUBLIC | — | UC-003 |
| `/choose-path` | PUBLIC | — | NEEDS CLARIFICATION (U-08) — unchanged |
| `/submit-request` | PUBLIC | — | API_CONTRACT §8 `POST /leads` — *public*; UC-002 |
| `/assessment`, `/assessment/*` | PUBLIC | — | API_CONTRACT §3.2 "No authentication required… open to anonymous visitors"; FIGMA_SCREEN_MAP land-flow note |
| Assessment PDF download | PROTECTED | any authenticated | API_CONTRACT §3.2 "sign-up is prompted only when the PDF report is downloaded" |
| `/booking`, `/booking/*` | PUBLIC up to review | — | NEEDS CLARIFICATION (U-10) — unchanged; `/booking/review` submit requires sign-in today |
| `/investment/*` | PUBLIC | — | NEEDS CLARIFICATION (U-10) — unchanged |
| `/hyperscale/*` | PUBLIC | — | NEEDS CLARIFICATION (U-10) — unchanged |
| `/requests/[reference]` | PROTECTED | any authenticated | API_CONTRACT §7 receipt returns 401/403/404 |
| `/dashboard`, `/dashboard/*` | PROTECTED | any authenticated identity | NEEDS CLARIFICATION (U-05) — unchanged |
| `/dashboard/sales` | PROTECTED | staff (`isStaff`) | API_CONTRACT §10 "staff only"; KANBAN_INTEGRATION §Access control |
| `/sales`, `/sales/*` | PROTECTED | `sales` | DEALFLOW §9.2 role matrix; ROLE_PERMISSION_MATRIX §4 |
| `/manager`, `/manager/*` | PROTECTED | `manager` | DEALFLOW §9.2; ROLE_PERMISSION_MATRIX §8 |
| `/admin`, `/admin/*` | PROTECTED | `admin` | DEALFLOW §9.2; ROLE_PERMISSION_MATRIX §9 |
| `/technical/*`, `/legal/*`, `/compliance/*` | NOT IMPLEMENTED | `technical` / `legal` / `compliance` | ROLE_PERMISSION_MATRIX §11 note — "proposed page design, not implemented" |

## Customer vs staff capability matrix

Canonical source: `DEALFLOW_MVP_DATABASE_DESIGN.md` §9.2, cross-checked against
`ROLE_PERMISSION_MATRIX.md` §2.1. Read/write detail below the role level is
`NEEDS CLARIFICATION` in both documents.

| Capability | customer | sales | technical | legal | compliance | manager | admin |
|---|---|---|---|---|---|---|---|
| Customer journeys / customer dashboard | yes | — | — | — | — | — | — |
| View Kanban | — | assigned | relevant | relevant | relevant | all | all |
| Create / edit deal | — | yes | no | no | no | yes | yes |
| Move stage | — | yes | limited | limited | limited | yes | yes |
| Activity / note | — | yes | yes | yes | yes | yes | yes |
| Update technical DD | — | read | yes | read | read | yes | yes |
| Update NCNDA | — | read | no | yes | read | yes | yes |
| Update KYC | — | read | no | read | yes | yes | yes |
| Mark Won / Lost | — | no | no | no | no | yes | yes |
| Convert Won → project | — | no | no | no | no | yes | yes |
| Configure stage / template | — | no | no | no | no | read | yes |
| Manage users / roles | — | no | no | no | no | read | yes |

None of these capabilities has a frontend surface yet except the Kanban board
and the four existing workspaces. The frontend grants only what it can render.

---

## Implementation map

Frontend only. **No backend file is modified.**

| File | Change |
|---|---|
| `package.json` | add `@clerk/nextjs` |
| `.env.example` | restored (was deleted locally, tracked at HEAD) + Clerk keys |
| `src/middleware.ts` | new — `clerkMiddleware`, authentication-only gate |
| `src/services/sessionToken.ts` | new — token provider registry, replaces `tokenStore` |
| `src/components/auth/ClerkTokenBridge.tsx` | new — registers Clerk `getToken()` |
| `src/services/tokenStore.ts` | deleted (CR-003) |
| `src/services/config.ts` | reads the Clerk publishable key (still the only `process.env` reader) |
| `src/services/http.ts` | Bearer from the session provider; refresh-and-replay removed |
| `src/services/api.ts` | stops exporting `tokenStore` |
| `src/services/contracts.ts` | `AuthService` reduced to `me()` |
| `src/services/endpoints.ts` | `auth.me` only |
| `src/services/http-impl/index.ts` | `auth.me` maps `AuthMeResponse` |
| `src/services/mock/index.ts` | `auth.me` fixture; legacy auth methods removed |
| `src/models/auth.ts` | contract-shaped types, canonical roles, fail-closed normalisation |
| `src/config/access.ts` | permissions keyed by membership role, set-based |
| `src/controllers/AuthContext.tsx` | Clerk-backed session + `/auth/me` |
| `src/app/layout.tsx` | `ClerkProvider` + token bridge |
| `src/app/(auth)/login/page.tsx` | Clerk `useSignIn` custom flow |
| `src/app/(auth)/signup/page.tsx` | Clerk `useSignUp` + email-code verification |
| `src/app/(auth)/choose-path/page.tsx` | routes only, no persistence (U-09) |
| `src/components/workspace/{RoleGuard,WorkspaceShell,Forbidden}.tsx` | workspace ids |
| `src/components/{shared/PermissionGate,dashboard/Sidebar,sales/SalesBoard}.tsx` | role usage |
| `src/app/{dashboard,sales,manager,admin}/layout.tsx` | workspace ids |
| `src/app/dashboard/sales/page.tsx` | staff check |
| `src/models/platform.ts` | `AuditLog.role` type |

### Architecture rules preserved

1. No component calls `fetch` — `services/http.ts` remains the only call site.
2. `process.env` is read in exactly one file — `services/config.ts`.
3. Every path lives in `services/endpoints.ts`.
4. Both adapters implement `ApiClient` identically.
5. The browser talks only to `/api/v1`; nothing imports Convex.
6. Frontend guards are UX only; the backend is the control.
