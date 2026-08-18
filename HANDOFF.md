# Panda Cloud Frontend Handoff

| Item | Value |
|---|---|
| Date | 2026-08-17 (Technical/Legal/Compliance workspaces · DD service layer · contact on the card · organization auto-create) · 2026-08-15 (manual card creation) · 2026-08-14 (Clerk migration) · 2026-08-13 (original audit) |
| Repository audited | `D:\Project\panda_cloud` |
| Branch | `main` |
| HEAD at original audit | `3c127eb239f33f09d3d48bb5bd68c159166a8c44` |
| Remote state at original audit | `HEAD`, `origin/main`, and `origin/HEAD` pointed to the same commit |

## 0. Recent changes — newest first

### 2026-08-17 — Technical, Legal and Compliance workspaces

Frontend only; no backend file changed. Full write-up in
**`docs/WORKSPACES_DESIGN.md`** — read that before touching any of the three.

Eleven routes, built to the tables in ROLE_PERMISSION_MATRIX §§ 5.2, 6.2, 7.2
and 11, which previously carried the note that they were proposed page design
rather than implemented pages. Nothing outside those tables was invented.

**Read this before demoing.** None of the three has a backend. The gateway
exposes ten paths — identity, webhooks, sales — and nothing else. NCNDA and KYC
are worse off than DD: `convex/ncnda.ts` and `convex/kyc.ts` contain **only
mutations and no query at all**, so listing agreements or cases is not a
missing gateway hop, it is a missing backend function. Everything works on the
mock adapter and 404s against a real one. Screens that cannot work say so on
the page (`components/workspace/GapNotice.tsx`) rather than rendering an empty
table that reads as "no data".

**Business rules encoded** — each mirrored in the mock adapter as well as the
form, so a payload that passes locally passes for real: NCNDA needs an
effective date to go active and allows only one active agreement per deal and
counterparty (409); KYC needs exactly one subject (modelled as a discriminated
union so the invalid state cannot be constructed), pairs provider with provider
case id, requires a reason to reject and a date to approve, and its update is a
**full status write** — a field omitted from the body is cleared, so the form
sends everything back.

**Three screens are blocked and say so:**

1. `/technical` and `/technical/assessments` — there is no cross-deal
   assessment list, and a Technical identity cannot enumerate deals
   (`resolveKanbanScope` fails closed → 403 on the sales board). The list page
   takes a deal id in a field; the overview stays explanatory instead of
   charting data it cannot fetch.
2. `/technical/assessments/[id]/evidence` — upload is out of scope per
   `DD API.md`.
3. `/compliance/cases/[id]/documents` — `kycCases` has no document relation and
   § 7.4 forbids inventing one. There is deliberately no document type in
   `models/kyc.ts`.

**⚠ The NCNDA and KYC paths are proposed, not agreed.** No contract defines
them; `services/endpoints.ts` shapes them after the sales operations. Likewise
the wire shapes in `models/ncnda.ts` / `models/kyc.ts` are a proposal derived
from Convex row shapes. Both need BE owner review — this is the most likely
place the pass is wrong.

**⚠ Display names.** Those models declare `counterpartyName`, `ownerName`,
`assignedToName` and `dealTitle` as fields the backend must resolve, following
the `SalesCard.organizationName` precedent. Until it does, the UI shows an em
dash — it never prints an id.

Verified: `tsc --noEmit` clean, `next build` succeeded, 70 routes. No frontend
test harness exists, so nothing beyond those two checks covers this.

### 2026-08-17 — Due Diligence service layer, aligned to `DD API.md`

Frontend only; no backend file was changed. Full write-up in
**`docs/DD_API_CONFORMANCE.md`** — read that before touching DD.

**The one thing to know:** the backend has **not** shipped the DD HTTP surface.
`PandaCloudBackend/convex` has no `ddGateway.ts`, no DD entries in
`gatewayPaths.ts` and no DD routes in `http.ts` — the three additions
`DD API.md` itself lists as "expected". `convex/dueDiligence.ts` holds the
engine but still authorizes through the old `ctx.auth.getUserIdentity()`
pattern and nothing routes to it. So every DD call through the HTTP adapter
answers 404 today. Nothing is stubbed to hide that; the mock adapter is fully
functional and is the way to build DD screens right now.

Wired: exactly the five documented operations over four paths, on both
adapters, behind `DueDiligenceService`. Update is keyed by **templateItemId**,
not response id — an unanswered requirement has no response row, so it is an
upsert and `expectedRevision: 0` means "I believe this is unanswered". No
complete/cancel method exists; `DD API.md` forbids inventing one.

Quarantined under an explicit "NOT ON THE WIRE" banner in
`models/dueDiligence.ts`: evidence upload (out of scope in `DD API.md`),
`DdEligibleDeal` and `DdWorkspaceOverview` (no operation exists). **The last
one blocks the `/technical` overview page** — there is no aggregate endpoint to
populate it from, which is why the Technical scaffold is still outstanding
rather than merely unfinished.

**⚠ Discrepancy resolved, needs a sanity check.** ROLE_PERMISSION_MATRIX § 10
grants `dd:*` to Technical only; `DD API.md` gives read to every staff role and
create/update to technical/manager/admin. Followed `DD API.md` — the old grants
left manager and admin unable to see a nav item for assessments they may
create. Table in the conformance doc.

**⚠ Four response shapes are guesses.** `DD API.md` describes the write cascade
but never says what the endpoints return, so
`DdAssessmentListResponse` / `DdProgress` / `DdAssessmentCreateResponse` /
`DdResponseUpdateResponse` are the frontend's best reading and need BE owner
confirmation. This is the most likely place the pass is wrong.

Verified: `tsc --noEmit` clean, `next build` succeeded (64 pages). No frontend
test harness covers the service layer, so adapter parity rests on the shared
TypeScript port alone.

### 2026-08-17 — The sales card carries a company and a reachable contact

Redesign of manual entry so a pipeline card can actually be worked. Previously
a card showed a title and an opaque `organizationId`, and the board offered no
way to reach anyone — `SALES_KANBAN_INTEGRATION_HANDOFF` records this plainly:
"`contactName`/`email` … are not part of the Sales API yet".

**What changed, in product terms.** The Add-card form is now grouped the way a
salesperson holds the information — *Customer* (company, contact name, job
title, phone, email), then *Opportunity* (title, vertical, priority, stage,
description), then *Value and timing*. A board card shows the company name and
the contact with one-tap `tel:` / `mailto:` links; the detail panel repeats
them in a Customer section.

**Backend.** `deals.resolveContact` finds-or-creates a `contacts` row inside
the resolved organization, matched by normalized email through the existing
`by_normalizedEmail` index and re-checked against the organization (the index
is global). It writes a `contact.created` audit row in the same mutation as the
deal, so a half-created contact is impossible. Blanks on an existing contact
are filled from what was typed; **an existing value is never overwritten** —
this endpoint is not a contact editor. `isPrimary` is set only when the company
has no primary contact yet.

`convex/lib/cardParties.ts` (new) denormalizes `organizationName` and
`primaryContact` onto every card the board reads. Reads are deduplicated by id
per page, so a column full of deals for one customer costs one organization
read, not one per card. A dangling or archived reference resolves to `null`
rather than throwing — a board that will not render because one contact was
archived is worse than a card with no phone number.

**Rules enforced, and where.**

| Rule | Source | Enforced |
|---|---|---|
| Contact needs at least email or phone | DEALFLOW § 5.1 | `deals.resolveContact`, mirrored in the gateway parser, the mock adapter and the form |
| `contactName` required when any contact field is sent | same | gateway parser + mutation |
| `primaryContactId` XOR the typed `contact*` group | this change | gateway parser + mutation |
| `do_not_contact` gets no call/email affordance | DEALFLOW § 5.1 | `contactChannels()` in `models/sales.ts` — the single sanctioned way to build a link |

**Owner is shown by name, or not at all.** The Record panel used to print
`card.ownerId` — a raw Convex key like `ms767yfjnrhn1xfkt3c1stzrgs8ch435`,
which tells a human nothing. `cardParties` now resolves `ownerName` the same
way it resolves the company and contact, and `DealDetail` renders **"You"**
when `card.ownerId === profile.user.id` (an exact comparison: `auth/me` and
`deals.ownerId` both serialize the same `users._id`), the resolved name
otherwise, and **omits the row entirely** when neither is available. It never
falls back to the id.

This does expose a staff member's display name to anyone who can already see
the deal. That is a small, deliberate widening: a `sales` caller only ever sees
deals they own, and manager/admin see the whole board by design. Flagging it so
the BE owner can object rather than discover it.

**⚠ Two things a reviewer should push on.**

1. **`SalesCard` and `SalesCardDetail` grew required fields.** Any consumer
   pinned to the previous contract release will fail `additionalProperties`
   validation on the new keys. This is a contract change on *read* operations,
   not just the new create — it needs the same FE/BE owner sign-off, and the
   draft still must not be frozen or tagged (workflow § 8, § 15).
2. **The contact links live inside the drag handle.** The whole card is the
   board's drag surface, so `DealCardView` stops pointer-down propagation on
   the two anchors. The trade-off is deliberate and documented in the file: you
   cannot start a drag from those two small targets. If that turns out to annoy
   people in practice, move the links to a hover-revealed footer rather than
   removing the `stopPropagation`, which is what makes them clickable at all.

**Verified.** Backend `tsc` clean, **86/86** tests passing (12 files) including
a new `tests/sales-card-create.test.ts` covering create-both, reuse-both
(different casing and spacing), the email-or-phone rejection with nothing
partially written, the organization XOR, and a deal with no contact.
`redocly lint` clean. Frontend `tsc` clean, `next build` succeeded (64 pages).

**⚠ Correction to yesterday's entry.** The 2026-08-17 organization entry below
claims "`vitest` 27/27". That was 27 of **86**: this sandbox held only 3 of the
11 test files, so the run was a subset and the claim overstated. All 11
pre-existing files were fetched and run for this change, and
`tests/sales-routes.test.ts` did in fact fail to typecheck against yesterday's
`createCard` addition — a real defect the missing files had hidden. It is fixed
in this commit.

### 2026-08-17 — Organization is created from a typed company name

Supersedes the "paste an organization id" form shipped on 2026-08-15. The
decision and its consequences are written up in the 2026-08-15 entry below,
under "Organization and owner selection", so the whole story stays in one
place. Files touched:

| Repo | File | Change |
|---|---|---|
| BE | `convex/schema.ts` | `organizations.normalizedName` + `by_normalizedName` index |
| BE | `convex/deals.ts` | `normalizeOrganizationName`, `resolveOrganization`, reworked `createFromGateway` args |
| BE | `convex/salesGateway.ts` | `organizationName` parsed; `organizationId`/`ownerId` optional; XOR check |
| BE | `src/domain/sales/types.ts` | request shape |
| BE | `api-contracts/components.yaml`, `paths/sales-cards.yaml` | `oneOf` on the two organization inputs; clarification note removed |
| FE | `src/models/sales.ts` | request shape |
| FE | `src/components/sales/ManualDealModal.tsx` | one "Company name *" field; owner shown, not entered |
| FE | `src/services/mock/index.ts` | mock mirrors the XOR rule and find-or-create |

Files touched by the contact change:

| Repo | File | Change |
|---|---|---|
| BE | `convex/lib/cardParties.ts` | **new** — per-page company/contact/owner-name hydration |
| BE | `convex/deals.ts` | `resolveContact`, `normalizeContactEmail`, contact args on `createFromGateway`, parties on `getDetail` |
| BE | `convex/dealflow.ts` | parties on the board page |
| BE | `convex/salesGateway.ts` | contact parsing; `organizationName`/`primaryContact` serialized |
| BE | `src/domain/sales/types.ts` | `SalesCardContact`; card and create-request shapes |
| BE | `api-contracts/components.yaml` | `SalesCardContact` schema; card + create-request fields |
| BE | `tests/sales-card-create.test.ts` | **new** — 5 cases |
| BE | `tests/sales-routes.test.ts` | fixture updated; `createCard` added to the repository double |
| FE | `src/models/sales.ts` | `SalesContactDto`, `contactChannels()`, card + request shapes |
| FE | `src/components/sales/ManualDealModal.tsx` | three-section layout; contact fields and validation |
| FE | `src/components/sales/DealCardView.tsx` | company name + tap-to-call/mail on the card |
| FE | `src/components/sales/DealDetail.tsx` | Customer section; Owner shown as "You"/name, never the id |
| FE | `src/components/sales/salesAdapter.ts` | maps the two new wire fields |
| FE | `src/services/mock/salesFixtures.ts` | per-deal company/contact, incl. a `do_not_contact` case |

Verified: frontend `tsc --noEmit` clean and `next build` succeeded; backend
`tsc --noEmit` clean, `vitest` 27/27 passing, `redocly lint` clean. **No test
covers `resolveOrganization` yet** — the existing suite does not exercise
`createFromGateway`, and adding a convex-test case for find-or-create is the
obvious next commit.

### 2026-08-15 — Manual sales card creation (`POST /api/v1/sales/cards`)

Closes the gap recorded in `docs/SALES_BOARD_CONTRACT_GAP.md` § 4 Gap A. The
board's "+ Add card" button is back, and this time there is a real operation
behind it.

**Backend.** `convex/deals.ts` already contained a `create` mutation with the
full UC-004 semantics, but it authorized through `requireRoleActor(ctx)` — the
Convex auth identity — so the HMAC gateway hop could not reach it. Its body is
now a shared `insertDeal` helper, called by two entry points:

- `deals.create` — unchanged public Convex mutation.
- `deals.createFromGateway` — new `internalMutationGeneric` taking
  `clerkSubject`. It re-resolves the user and re-checks the role inside Convex;
  the gateway is a transport, not an authority (DEALFLOW § 9.1).

One mutation writes `deals` + the initial immutable `dealStageHistory` row +
`auditLogs`, so a partial create is impossible. `stageId` defaults to the seeded
`new` stage. Roles: `sales`, `manager`, `admin` (DEALFLOW § 9.2).

Wiring: `POST` export on `app/api/v1/sales/cards/route.ts` →
`handleCreateSalesCard` (201) → `SalesService.createCard` →
`ConvexGatewayRepository.createCard` → `salesCardCreate` HTTP action →
`deals.createFromGateway`. CORS already permitted `POST`.

**Frontend.** `SalesCardCreateRequest`/`Response` in `models/sales.ts`,
`createCard` on the `SalesService` port, implemented by **both** adapters, and a
rewritten `ManualDealModal`. The modal accepts a major-unit amount and converts
it with `BigInt` into the contract's minor-unit string — never through a float —
omits absent optional fields rather than sending `null`, and surfaces the
`correlationId` on failure so a defect ticket can be raised per workflow § 18.

**Design decision worth knowing.** `createCard` is deliberately **not** on the
Kanban `DataAdapter`. The library renders its own inline create affordance
whenever that method exists, and that form cannot collect the organization a
deal must be filed under, so it would always produce a 400. Creation goes
through `ManualDealModal` only. The reasoning is comment-blocked in
`salesAdapter.ts` so nobody re-adds it.

**⚠ This is a contract change.** A new operation was added to the OpenAPI draft
(`api-contracts/paths/sales-cards.yaml` + two schemas in `components.yaml`).
Per collaboration workflow § 8 and § 15 an agent may draft, lint and diff a
contract but **cannot approve or freeze it** — this needs FE owner and BE owner
sign-off before any release is tagged.

**Organization and owner selection — decided 2026-08-17 (was NEEDS
CLARIFICATION).** The earlier build asked the operator to paste raw
`organizationId` and `ownerId` values because no `GET /organizations` or
`GET /users` operation exists to populate a picker, while `API_CONTRACT.md`
§ 9.2 has the operator type a free-text company name that the accepted domain
model had no field for. That is now resolved in favour of § 9.2:

- `SalesCardCreateRequest` carries **exactly one** of `organizationId` or
  `organizationName`. Sending both, or neither, is a 400 — the rule is enforced
  twice, in `salesGateway.parseCreateFields` (shape) and in
  `deals.createFromGateway` (authorization/consistency boundary).
- `deals.resolveOrganization` normalizes the name (trim, lowercase, collapse
  runs of whitespace), looks it up through the **new**
  `organizations.by_normalizedName` index, and inserts a `customer`
  organization in `prospect` status when nothing matches. The insert writes an
  `organization.created` audit row alongside the deal's own audit row, in the
  same mutation, so a half-created organization is impossible.
- A supplied or matched organization that is `archivedAt` or `status:blocked`
  is rejected as `VALIDATION_ERROR` rather than silently reused.
- `ownerId` is now optional and defaults to the verified actor. This matters
  more than it looks: `resolveKanbanScope` gives a `sales` caller
  `{kind:"assigned"}`, so a card created with anyone else's owner would vanish
  from the creator's board the moment it was saved.
- The modal now shows one **"Company name *"** field plus a read-only line
  naming the owner. It never sends `organizationId` or `ownerId`.

**⚠ Schema change requiring a backfill — needs BE owner action.**
`organizations.normalizedName` was added as `v.optional(v.string())` with an
index, following the expand/backfill/contract pattern (and mirroring the
existing `users.normalizedEmail` convention). Consequences, stated plainly:

1. Organization rows that existed before this deploy have no `normalizedName`
   and are therefore **invisible to the lookup**. Typing the name of an already
   known company will create a second organization for it until a backfill
   runs.
2. A Convex index is not a uniqueness constraint. Two concurrent creates of the
   same new name can both miss and both insert. The window is small and the
   damage is a duplicate row rather than corruption, but it is real; a
   deduplication pass or an application-level guard is the follow-up.

Until (1) is done, treat auto-created organizations as provisional records for
a back-office reviewer, not as a clean customer master.

**Still not done, and still blocking a usable board:**

- No deal exists in the database. `convex/seed.ts` seeds only the 10
  `pipelineStages` and the DD template; there is no deal fixture.
- No customer-intake endpoint creates a card transactionally with its
  submission (`API_CONTRACT.md` § 9.2 — Gap B). Manual entry alone is not a
  production data source.
- `DELETE` remains undecided: `API_CONTRACT.md` § 9.8 allows Manager/Admin
  delete with an audit event, `KANBAN_INTEGRATION.md` argues a lost deal belongs
  in `lost` and must never be erased. Two project documents disagree; the
  backend implemented neither and CORS does not allow `DELETE`.
- A `sales` caller only sees deals they own (`resolveKanbanScope` → `assigned`).
  Set `ownerId` to your own user id or a newly created card will be invisible to
  you.

### 2026-08-14 — Clerk authentication migration (CR-003)

Driven by `PandaCloudBackend/docs/collaboration/PHASE_1_FRONTEND_AUTH_HANDOFF.md`
("Required frontend migration") and CR-003 in `docs/CONTRACT_CONFORMANCE.md`.
The full pre-implementation analysis, route protection table, customer/staff
matrix and the 14 open questions are in **`docs/CLERK_AUTH_DESIGN.md`** — read
that before touching auth.

#### What changed

- Clerk owns sign-in, sign-up, session, refresh, MFA and sign-out. PandaCloud
  issues, stores and refreshes **no token**.
- `services/tokenStore.ts` is **deleted**; the localStorage access/refresh pair
  and the `POST /auth/refresh` retry-and-replay in `services/http.ts` are gone.
- The bearer is the current Clerk session token from `getToken()` with **no**
  custom JWT template, minted through the new `services/session.ts` bridge.
- `AuthContext` no longer performs authentication. It consumes an injected
  `SessionState` and loads the PandaCloud profile from `GET /api/v1/auth/me`.
- Roles now come from `authorization.memberships[].role` in canonical
  `lower_snake_case` (`sales | compliance | legal | technical | manager | admin
  | customer`). The `USER | SALES | MANAGER | ADMIN` union is gone, and the
  frontend no longer carries a role on the user object at all.
- `config/access.ts` is keyed by membership role and evaluates the whole role
  **set**, not one "primary" role.
- `src/middleware.ts` adds the server-side **authentication** gate that section 5
  previously recorded as missing. It does not authorize — roles are not JWT
  claims.
- `PUT /auth/path` and its `choosePath` call are removed; `/choose-path` now
  routes only (see U-09 in the design doc).
- The login and sign-up screens keep their Figma design and switch to Clerk
  custom flows. Sign-up now includes the email-code step the backend requires
  before it will create a profile (`409 IDENTITY_EMAIL_REQUIRED`).

#### Dependency changes — require review

| Package | From | To | Why |
|---|---|---|---|
| `@clerk/nextjs` | — | `^6.33.4` | new dependency for CR-003 |
| `next` | `14.2.5` | `14.2.35` | forced: `@clerk/nextjs@6` peer-requires `next ^14.2.25`. Same minor, patch-level only. It also carries the Next.js middleware-bypass fix, which matters now that a middleware auth gate exists. |
| `eslint-config-next` | `14.2.5` | `14.2.35` | kept in lockstep with `next` |

`npm install` must be re-run on the developer machine. This was **not** a
unilateral upgrade of a major dependency — it is the minimum patch bump the new
peer range accepts — but it is called out here because AGENTS.md forbids
changing an important dependency silently.

#### Two manual steps required on the developer machine

1. **Delete the retired file.** File transport into this workspace can write and
   overwrite but cannot delete, so `src/services/tokenStore.ts` is still on disk
   and must be removed by hand:

   ```powershell
   git rm src/services/tokenStore.ts
   ```

   Nothing imports it any more, so the build succeeds either way, but leaving it
   invites someone to wire a PandaCloud token back in.

2. **Regenerate the lockfile.** `package-lock.json` was intentionally not
   delivered: the sandbox that verified this work substituted a stub for
   `@kanban/library`, so its lockfile is not representative. Run `npm install`
   locally after repairing the Kanban dependency (section 12).

#### Out-of-scope fix, deliberately included

`src/app/submit-request/page.tsx` passed `redirectTo={(reference) => …}` — a
function — from a Server Component to the `ContactForm` Client Component. React
cannot serialise that, and it aborted `next build` before any page was emitted.
It is unrelated to Clerk and predates this work; the build had simply never been
run (section 13, and `docs/VERIFICATION.md` section 5 warns that `tsc` cannot see
RSC boundary violations). The page is now a Client Component — the smallest fix
that changes no props and no behaviour. Turning `redirectTo` into a serialisable
value would change `ContactForm`'s public API and is an FE-owner decision.

## 1. Scope of this handoff

This document summarizes the implementation currently present after the commit
range from the initial repository (`b1f3c5b`) through `3c127eb`, plus the local
parent and nested-repository state that has not been committed.

The accumulated committed change is large: 186 files, approximately 19,730
insertions and 1,151 deletions relative to the initial commit. The application
currently exposes 66 App Router pages.

The major commits are:

| Commit | Summary |
|---|---|
| `a500e19` | Added motion, PCB/circuit, cursor, scan, HUD, and data-flow effects |
| `23f49d5` | Added the interactive global network globe |
| `5db3fd7` | Added customer flows, marketing pages, models, contexts, services, and mocks |
| `a22e059` | Corrected a projection helper |
| `2b12232` | Added the original static verification report |
| `0c7802c` | Integrated the local Kanban library and Sales dealflow API port |
| `8253273` | Added four-role workspaces, RBAC UI, shared resource pages, manual card creation, and manager deletion |
| `006d177` | Connected public product sections to API services, added images, and tightened API configuration/error handling |
| `b4ff33a` | Added the tracked `AGENTS.md` and documentation context cache |
| `3c127eb` | Corrected the repository path in `AGENTS.md`; also changed only the final newline in the conformance document |

## 2. Current product state

The repository is no longer only a marketing site. It now contains:

- the existing public Panda Cloud marketing experience;
- Customer/User workspace under `/dashboard`;
- Sales workspace under `/sales`;
- Manager workspace under `/manager`;
- Admin workspace under `/admin`;
- Land Assessment, GPU Booking, Investment, Hyperscale, and shared request
  receipt flows;
- a Sales/Manager Kanban pipeline using the separate `kaban_cloud` library;
- an HTTP/mock API abstraction intended to connect to the separate backend.

The public PCB/circuit background and interactive Globe implementation remain in
place. The role work did not replace those visual systems.

## 3. Routes implemented

### Public and authentication

- `/`
- `/gpu-renting`
- `/buy-gpu`
- `/energy-land`
- `/financing`
- `/infrastructure`
- `/login`
- `/signup`
- `/choose-path`
- `/submit-request`
- `/requests/[reference]`

### Land Assessment

- `/assessment`
- `/assessment/land-profile`
- `/assessment/power-capacity`
- `/assessment/energy-source`
- `/assessment/facilities`
- `/assessment/results`

### GPU Booking

- `/booking`
- `/booking/workload`
- `/booking/hardware`
- `/booking/scale`
- `/booking/power-cooling`
- `/booking/review`

### Investment

- `/investment`
- `/investment/intent`
- `/investment/volume`
- `/investment/payment`
- `/investment/kyc`
- `/investment/confirmation`

### Hyperscale

- `/hyperscale`
- `/hyperscale/stage`
- `/hyperscale/capacity`
- `/hyperscale/geography`
- `/hyperscale/rfp`

### Customer/User workspace

- `/dashboard`
- `/dashboard/projects`
- `/dashboard/gpu-clusters`
- `/dashboard/portfolio`
- `/dashboard/wallet`
- `/dashboard/transactions`
- `/dashboard/instances`
- `/dashboard/profile`
- `/dashboard/settings`

`/dashboard/sales` also remains as a legacy pipeline entry route.

### Sales workspace

- `/sales`
- `/sales/leads`
- `/sales/leads/[id]`
- `/sales/pipeline`
- `/sales/quotes`
- `/sales/tasks`
- `/sales/customers`
- `/sales/reports`

### Manager workspace

- `/manager`
- `/manager/sales`
- `/manager/team`
- `/manager/pipeline`
- `/manager/operations`
- `/manager/approvals`
- `/manager/reports`

### Admin workspace

- `/admin`
- `/admin/users`
- `/admin/roles`
- `/admin/permissions`
- `/admin/system`
- `/admin/audit-logs`
- `/admin/settings`

## 4. Architecture introduced

The frontend uses a React MVC-style separation:

- `src/models/`: domain and request/response types;
- `src/services/`: all network, token, endpoint, adapter, and environment access;
- `src/controllers/`: auth, form, async, and multi-step flow state;
- `src/components/` and `src/app/`: view composition;
- `src/config/`: centralized navigation, permissions, static presentation data;
- `src/lib/`: framework-independent helpers and transitional calculations.

`src/services/api.ts` selects either the HTTP adapter or mock adapter. Views are
not supposed to know which adapter is active. `src/services/http.ts` owns the
fetch boundary, auth header, timeout, refresh/replay, response unwrapping, error
normalization, and `X-Correlation-Id` behavior.

Important target boundary: the browser must call the versioned `/api/v1` gateway
only. It must not access Convex, Supabase Postgres, Storage internals, n8n, or a
database directly.

## 5. Authentication and role-based access

**Rewritten 2026-08-14.** See `docs/CLERK_AUTH_DESIGN.md` for the full flow.

Identity chain:

```text
Clerk session -> getToken() (no template) -> Authorization: Bearer <JWT>
  -> /api/v1/auth/me -> users.clerkSubject -> active organizationMemberships
  -> MembershipRole -> UI affordances
```

Canonical roles, from `api-contracts/components.yaml`:

```ts
type MembershipRole =
  | "sales" | "compliance" | "legal" | "technical"
  | "manager" | "admin" | "customer";
```

Implemented behaviour:

- `AppAuthProvider` selects `ClerkSessionProvider` (Clerk configured) or
  `StandaloneSessionProvider` (mock-only development).
- `ClerkSessionProvider` is the only file that touches Clerk client hooks. It
  registers the token provider and hands `AuthProvider` a provider-agnostic
  `SessionState`.
- `AuthProvider` loads `GET /api/v1/auth/me` whenever the session changes and
  exposes `{ profile, user, isAuthenticated, initializing, reload, signOut }`.
- `normalizeMembershipRole()` fails closed: an unrecognised role is dropped and
  grants nothing. Required by PHASE_1_FRONTEND_AUTH_HANDOFF.
- Permissions and navigation live in `src/config/access.ts`, keyed by role and
  evaluated over the identity's whole role set.
- `RoleGuard` distinguishes three outcomes: no session (redirect to `/login`),
  session without a usable profile (403 surface — suspended, disabled or
  unmapped identity), and workspace mismatch (403 surface).
- `PermissionGate` controls action visibility.
- `WorkspaceShell` provides shared navigation and Clerk sign-out.

Frontend guards are UX protection only. Every protected API operation is
authorized again by the gateway and by the Convex authorization helpers.

**Resolved:** the previous "no server middleware or server-component session
gate" limitation. `src/middleware.ts` now gates `/dashboard`, `/sales`,
`/manager`, `/admin` and `/requests` on an authenticated Clerk session. It
deliberately does not authorize: roles are resolved from Convex memberships by
the gateway, not carried as JWT claims, so middleware cannot evaluate them
without inventing a source.

**Still open (NEEDS CLARIFICATION, see the design doc):**

- U-05 — may a staff-only identity open the customer workspace? Current
  behaviour is preserved unchanged: any authenticated identity may, and `admin`
  may; `sales` and `manager` may not.
- U-06 — Admin access to Sales/Manager workspaces is still undecided
  (ROLE_PERMISSION_MATRIX § 12.3) and unchanged.
- U-07 — `technical`, `legal` and `compliance` have no workspace and no
  documented FE permissions. They are recognised, granted nothing, and land on
  `/`. Their route trees are not invented.
- U-03 — precedence among multiple active memberships affects only the landing
  route.

## 6. Shared workspace UI

The role pages reuse shared components rather than copy four dashboard systems:

- `WorkspaceShell`
- `DashboardView`
- `WorkspacePage`
- `ResourcePage`
- `DataTable`
- `StatCard`
- `StatusBadge`
- loading, empty, error, and forbidden states

`ResourcePage` currently consumes a server-driven table payload from the
transitional `/workspace/resources/{kind}` operation. The response supplies
column definitions and rows.

This endpoint and its free-form table schema must be confirmed in the released
backend OpenAPI. It must not become production contract merely because the mock
UI uses it.

Some dashboard/analytics views still contain display samples or hard-coded
values, especially:

- `src/components/workspace/DashboardView.tsx`
- `src/components/workspace/PortfolioPages.tsx`
- `src/app/manager/sales/page.tsx`
- `src/app/manager/operations/page.tsx`
- `src/app/admin/system/page.tsx`

These values must be replaced by contract-derived API data before production.

## 7. Sales and Manager pipeline

The pipeline uses `@kanban/library` from the separate local `kaban_cloud`
repository. `src/components/sales/salesAdapter.ts` is the bridge between the
library `DataAdapter` and `api.sales`; the library does not call the API
directly.

Current behavior:

- Cards and columns load through the Sales service against the pinned backend
  wire contract (5 operations, 4 paths — see `src/services/endpoints.ts`).
- Card list loads are paginated per column (`limit` 100, followed by
  `nextCursor`) and flattened into the board with a library-only visual order
  derived from backend order; that order is never sent back.
- Drag-and-drop moves POST the move operation with the card's current
  `expectedRevision`; the adapter reconciles with the fresh detail after the
  move and the library replaces the optimistic card with server truth.
- A 409/CONFLICT on move refreshes the adapter's revision cache and surfaces
  the error (no blind retry). Backend 403 (Won/Lost is manager/admin only) and
  400 (missing reason for Lost/On Hold) roll the optimistic state back and
  toast the backend message — the expected UX for an attempted transition the
  backend forbids.
- Edits (probability, expected close, description) PATCH with
  `expectedRevision`; a 409 shows "This deal changed on the server. Reloading
  the latest version." and refreshes the board without retrying.
- The board exposes **no create and no delete**: the contract has no
  `POST /sales/cards` and no `DELETE /sales/cards/{id}`, so the adapter omits
  them and the UI renders no such affordance. Customer-flow submissions create
  cards transactionally on the backend.
- The detail panel is a custom `detailPanelRender` (`DealDetail.tsx`). Deal
  value and record fields are read-only and rendered from real backend fields
  via `formatMinorUnits`; only the sales-owned fields are editable.
- Vertical filters (land/GPU/token/hyperscale) hide cards with CSS
  (`data-deal-vertical` + `.kanban-scope[data-vertical-filter=…]`) instead of
  unmounting them, so scroll and drag state survive.
- On save the board bumps `boardVersion` after ~700 ms so the panel shows
  "Saved" before the board remounts and refetches the latest revision.
- Sales and Manager pipeline routes share the same board implementation and
  vary by permissions, not by forked board code.

Wire operations in `src/services/endpoints.ts` (match the backend OpenAPI):

- `GET /sales/columns`
- `GET /sales/cards?columnId=…` (+ `limit`/`cursor`/`vertical`/`ownerId`/`priority`)
- `GET /sales/cards/{dealId}`
- `PATCH /sales/cards/{dealId}`
- `POST /sales/cards/{dealId}/move`

### Pipeline tests

Vitest was added (`npm test`) for this work — 21 tests across three files:

- `src/components/sales/salesAdapter.test.ts` — adapter mapping, paginated
  loading, update/move payloads (including that `columnId`/`order` are never
  sent), 409 no-blind-retry, and that create/delete are not exposed.
- `src/services/http-impl/httpErrors.test.ts` — 4xx/5xx are normalized to
  backend error codes, never mislabeled `NETWORK_ERROR`.
- `src/components/sales/SalesBoard.test.tsx` — board chrome: vertical filters
  render and no add/delete affordance exists.

### Pipeline risks

- Saving still bumps `boardVersion` and remounts the board, which refreshes
  data but resets the library's internal scroll and selection state. The
  delayed bump lets the panel's "Saved" state show first.
- Scroll styling targets library/Tailwind class structure and can break after a
  library update.
- The library's dist types do not re-export the `Column` interface (only the
  `Column` component value); `salesAdapter.ts` defines a structural `BoardColumn`
  twin instead. If the library regenerates dist types, prefer importing the
  real interface.
- `docs/KANBAN_INTEGRATION.md` predates the contract-accurate rewrite and may
  lag the source (e.g. it described create/delete behavior before the contract
  dropped those operations).
- `/dashboard/sales` and `/sales/pipeline` expose two entry points to the same
  feature.
- Backend authorization, card-order reconciliation, WIP-limit rejection, and
  immutable deletion audit are not proven by frontend mocks.
- Protected routes (`/sales/*`) return an HTTP 404 to a bare curl when signed
  out because Clerk's middleware rewrites unauthenticated requests to its
  interstitial route; in a browser this is the normal sign-in redirect. Use a
  real session to exercise the board.

## 8. Dynamic product data and API connection

Implemented dynamic sections:

- GPU Renting calls `api.booking.listGpuModels()` and renders loading, error,
  empty, and success states.
- Buy GPU currently calls the same GPU-model operation for model/spec discovery.
- Energy & Land calls `api.hyperscale.listRegions()` for regional power/cooling
  facts.

Fail-closed sections:

- Financing no longer presents the design's product/rate/calculator samples as
  live data. It renders a backend-connection empty state.
- Infrastructure no longer presents the hard-coded inventory table as live
  inventory. It renders a backend-connection empty state.

Important limitations:

- Buy GPU is reusing the rental/booking GPU catalog and has no approved purchase
  price, purchase configuration, or lead-time operation.
- Energy & Land is reusing Hyperscale region facts, not a dedicated land/site
  inventory operation.
- Dormant hard-coded product arrays remain in configuration files such as
  `buyGpu.ts`, `energyLand.ts`, `financing.ts`, and `infrastructure.ts`, even
  when current pages do not render them.
- The adapter defaults to `mock` unless `NEXT_PUBLIC_API_ADAPTER=http` is set.
- The full mock adapter still contains projection and quote logic that must not
  be treated as production business rules.

Required backend operations are documented in
`docs/PRODUCT_DATA_BACKEND_REQUIREMENTS.md` without inventing authoritative
paths.

## 9. API and contract conformance work

The frontend was tightened to:

- require a non-empty base URL for the HTTP adapter;
- require the gateway URL to end in `/api/v1`;
- expose a pinned `NEXT_PUBLIC_CONTRACT_VERSION` value;
- send and preserve correlation IDs;
- normalize the collaboration workflow's flat error body;
- represent 401 and 403 separately;
- add cursor-page and contract-oriented common types.

The repository is still not fully contract-conformant. Status of CR-001
through CR-008 as of 2026-08-14:

1. CR-001 — success envelope: **open**. `http.ts` still tolerates both shapes.
2. CR-002 — money in minor units plus ISO currency: **open**.
3. CR-003 — Clerk session instead of custom refresh tokens: **DONE**
   (2026-08-14). `tokenStore`, `/auth/refresh`, `/auth/login`, `/auth/signup`,
   `/auth/logout` and `PUT /auth/path` are gone from the frontend.
4. CR-004 — signed upload sessions instead of multipart: **open**. KYC and RFP
   uploads still post multipart.
5. CR-005 — role enum casing: **resolved in the frontend's favour of the
   contract**. The frontend now consumes canonical `lower_snake_case`
   membership roles. The separate `USER` vs `CUSTOMER` *wire value* question is
   moot for this repository, because the frontend no longer sends or receives a
   role on the user object — but it still needs an owner decision anywhere else
   it appears.
6. CR-006 — retire `docs/API_CONTRACT.md`: **partially done**. Its § 2 (Auth) is
   now superseded by the OpenAPI draft and should be deleted from that file once
   the owners confirm; the remaining sections stay as requirements input.
7. CR-007 — generated pinned client: **open**. No release exists to generate
   from.
8. CR-008 — Prism/MSW instead of a parallel mock implementation: **open**.

Additional implementation/documentation drift to resolve:

- Runtime requires a base URL ending in `/api/v1`, while examples in README and
  `docs/API_CONTRACT.md` still show `/v1`. `.env.example` and
  `src/services/api.ts` were corrected on 2026-08-14; README and API_CONTRACT
  were not touched.
- ~~`src/services/http.ts` calls the refresh path as a literal~~ — resolved: the
  refresh path no longer exists.
- Several files under `src/lib/api/` are placeholder exports with `unknown`
  types rather than functioning, contract-derived services.

## 10. Visual work

Committed visual work includes:

- PCB/circuit background, cursor glow, AI scan, infrastructure HUD, and
  data-flow effects;
- reduced-motion-aware reveal, count-up, spotlight, tilt, and backdrop motion;
- the existing interactive Globe and network-location adapter;
- real raster imagery under `public/assets/visuals/`:
  - `energy-land-campus.png`
  - `gpu-cluster-closeup.png`
  - `infrastructure-inventory.png`
  - `liquid-cooled-data-hall.png`
- `AssetPlaceholder` support for a real `src`, `alt`, and priority flag.

The new imagery is used across the landing page, GPU Renting, Buy GPU,
Financing, Infrastructure, Assessment Land Profile, and Booking Review.

`docs/FIGMA_ASSETS.md` still lists many brand icons and design assets as
outstanding. Generated or generic imagery must not be presented as a customer
logo, certification, testimonial, or real partnership.

## 11. Current parent worktree state

Before this handoff was added, the parent repository showed:

```text
 D .env.example
?? .vscode/settings.json
?? kaban_cloud/
```

Notes:

- `.env.example` is tracked at HEAD but deleted locally. It contains the safe
  environment template and should normally be restored or intentionally
  replaced; do not substitute the ignored `.env` file or expose its values.
- `.vscode/settings.json` only disables a Postman dotenv notification and is
  not tracked.
- The active tracked `AGENTS.md` now declares the correct audited repository
  path, `D:\Project\panda_cloud`, after commit `3c127eb`.

Do not discard these local items without confirming ownership and intent.

## 12. Nested `kaban_cloud` repository state

`kaban_cloud/` is a nested Git repository with its own origin:

`https://github.com/chungtanloi/kaban_cloud.git`

Nested state at handoff:

- branch: `main`
- HEAD: `ea9f470` (`fix 1 click`)
- modified: `src/core/types/index.ts`
- modified: `tailwind.config.js`

The local changes:

- make `KanbanConfig.columns` optional so the adapter can supply columns;
- disable Tailwind preflight so loading the library does not reset the host
  application's typography/layout.

Critical integration blocker:

- the parent repository does not track this nested repository as a submodule or
  normal files;
- `package.json` depends on `file:./kaban_cloud`;
- `node_modules/@kanban/library` is currently a junction targeting the obsolete
  `D:\panda_cloud\kaban_cloud` path;
- after the repository was moved to `D:\Project\panda_cloud`, TypeScript can no
  longer resolve `@kanban/library` through that broken junction.

A fresh clone cannot reliably reproduce the current app until the team chooses
one strategy: Git submodule, npm/package registry, monorepo workspace, or
properly vendored source/build output.

## 13. Validation status

### 2026-08-15 (manual card creation)

Run in an isolated Linux sandbox against a copy of both repositories, with
dependencies installed from the public registry:

```text
panda_cloud        tsc --noEmit ........... PASS (0 errors)
panda_cloud        next build ............. PASS (exit 0, 64 routes + middleware)
PandaCloudBackend  tsc --noEmit ........... PASS (0 errors)
PandaCloudBackend  vitest run ............. PASS (27 tests, 3 files)
PandaCloudBackend  redocly lint ........... PASS ("Your API description is valid")
```

Not verified, and it matters:

1. **No live `POST` was executed.** `deals.createFromGateway` is a new Convex
   function; it must be deployed with `npx convex dev` (or `convex deploy`)
   before the button can work at all. Until then the gateway will fail to
   resolve the internal function.
2. **No round trip through a real Clerk session or a real Convex deployment.**
   Role enforcement, the HMAC hop, the atomic three-table write and the 409
   revision behaviour are all argued from the code, not observed.
3. One backend file could not be copied into the sandbox
   (`app/api/v1/sales/cards/[dealId]/move/route.ts`) and was reconstructed
   locally for the typecheck only. The real file was neither read nor modified.

### 2026-08-15 (contract-accurate Sales pipeline)

Run in this repository with the real `@kanban/library` (local `kaban_cloud/`
`dist-lib`) installed:

```text
tsc --noEmit ............................. PASS (0 errors)
next lint ............................... PASS (0 warnings/errors) — see below
next build .............................. PASS (exit 0, routes emitted)
vitest run .............................. PASS (21/21 tests, 3 files)
```

The 2026-08-14 caveat that `@kanban/library` was a type stub no longer applies:
the board compiles and builds against the real library, and `next lint` now has
a committed `.eslintrc.json` (`next/core-web-vitals`) so the lint run is
deterministic.

Runtime smoke test (production server): `/` serves 200; the protected
`/sales/*` routes correctly intercept unauthenticated requests — Clerk's
middleware rewrites them to its interstitial route, which a bare `curl` sees as
404 (`x-clerk-auth-status: signed-out`), and a browser sees as the normal
sign-in redirect. Exercising the board itself requires a real Clerk session;
that part remains unverified here, as does everything in the runtime checklist
below.

### 2026-08-14 (Clerk migration)

Run in an isolated Linux sandbox holding a copy of `src/`, `package.json`,
`tsconfig.json`, `next.config.mjs`, `tailwind.config.ts` and `postcss.config.mjs`,
with dependencies installed from the public registry:

```text
tsc --noEmit ............................. PASS (0 errors)
next build (Clerk configured) ............ PASS (exit 0, 64 routes + middleware)
next build (standalone, no Clerk key) .... PASS (exit 0, 64 routes)
next lint ................................ NOT RUN
```

Two caveats, both material:

1. **`@kanban/library` was replaced with a local type stub for the run.** The
   real library was unavailable (section 12). The stub declares only the members
   `salesAdapter.ts` and `SalesBoard.tsx` consume. So the Sales board compiled
   against a *substitute* type surface: everything else in the repository is
   genuinely verified, the Kanban integration is not. Re-run both commands on a
   machine with the real library before trusting the board.
2. **`next lint` still has no committed ESLint configuration**, so there is no
   deterministic non-interactive lint run. Unchanged from 2026-08-13.

Nothing was executed against a live Clerk instance or a live gateway. Every item
in the runtime checklist below is therefore unverified.

Runtime checklist — **all NOT VERIFIED**, requires a configured Clerk instance
and a deployed gateway:

```text
[ ] Sign up (including the email-code step)     [ ] Backend JWT verification
[ ] Sign in                                     [ ] Webhook signature verification
[ ] Sign out                                    [ ] Webhook deduplication
[ ] Session persistence across reload           [ ] User synchronisation
[ ] User identity resolves via /auth/me         [ ] Membership synchronisation
[ ] Organization / membership context           [ ] Audit rows written
[ ] Role resolution                             [ ] Error handling (401/403/409)
[ ] Protected routes                            [ ] API Bearer JWT reaches gateway
[ ] Unauthorized access is refused
```

### 2026-08-13 (original audit)

```text
Typecheck: FAIL
```

Root cause at the time:

```text
Cannot find module '@kanban/library' or its corresponding type declarations.
```

The missing library type then caused implicit-`any` errors in
`src/components/sales/salesAdapter.ts`. That link is broken because it still
points at the old repository path — a dependency/linking failure, not evidence
about the TypeScript changes.

```text
Lint: NOT RUN
Build: NOT RUN
```

Environment constraints found during that audit:

- `node` and `npm` are not available on the normal PATH in that shell;
- the Visual Studio-bundled Node discovered locally is v16.20.0, below the
  Next.js requirement of Node 18.17 or newer;
- the root has no committed ESLint configuration.

## 14. Recommended next actions

### P0 — make the checkout reproducible

1. Decide how `kaban_cloud` is versioned and consumed.
2. Preserve and review its two local modifications before changing the nested
   repository.
3. repair/reinstall the local dependency using npm after the repository path is
   settled; do not hard-code another absolute junction target.
4. Restore or intentionally replace `.env.example` without exposing `.env`.
5. Run typecheck, lint, and production build.

### P0 — unblock and confirm the Clerk migration

1. Have the FE and BE owners approve CR-003 (ROLE_PERMISSION_MATRIX § 17 Q1
   still records it as unconfirmed).
2. Agree the Clerk instance, the PandaCloud API audience on the session token,
   and the allowed origins; set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and the
   matching backend variables.
3. Subscribe the backend webhook URL to `user.created`, `user.updated` and
   `user.deleted`.
4. Decide the 14 `NEEDS CLARIFICATION` items in `docs/CLERK_AUTH_DESIGN.md`
   section H — particularly U-04 (nothing creates organizations or memberships
   today, so no identity can ever become staff) and U-05.
5. Review the forced `next` 14.2.5 -> 14.2.35 patch bump.

### P0 — make the sales board usable

1. Deploy the new Convex function (`npx convex dev`) — `deals.createFromGateway`
   does not exist in the deployment yet, so "+ Add card" cannot work until it
   does.
2. Get FE + BE owner approval for the new `POST /sales/cards` contract
   operation. An agent may draft it but cannot approve or freeze it
   (collaboration workflow § 15).
3. Decide organization/owner selection (see § 0, 2026-08-15) so the modal can
   stop asking for raw identifiers.
4. Seed a few demo deals behind the existing `SEED_ENABLED` / `SEED_SECRET`
   guard so the board is demoable without hand-inserting rows.
5. Decide the delete question — `API_CONTRACT.md` § 9.8 and
   `KANBAN_INTEGRATION.md` currently contradict each other.
6. Implement customer-intake endpoints that create a card transactionally with
   the submission (`API_CONTRACT.md` § 9.2). Manual entry is not a production
   data source.

### P0 — establish the backend contract

1. Obtain and pin the backend OpenAPI release and generated client.
2. Verify every transitional auth, workspace, Sales, product, assessment,
   booking, investment, and hyperscale operation.
3. Ensure backend role authorization and Sales deletion audit are implemented.
4. Ensure form submission and pipeline-card creation happen transactionally on
   the backend.

### P1 — remove production placeholders

1. Replace hard-coded workspace KPI/table data with typed operations.
2. Add approved purchase, infrastructure inventory, financing product, and
   financing-calculation operations.
3. Remove dormant hard-coded product records once their API replacements exist.
4. Replace mock business formulas with backend results.

### P1 — reconcile routing, docs, and access

1. Decide whether `/dashboard/sales` remains or redirects to `/sales/pipeline`.
2. Decide the Admin cross-workspace access policy and update both frontend and
   backend permission behavior.
3. Update `docs/KANBAN_INTEGRATION.md` for manual create/delete.
4. Update stale absolute repository paths in README examples, verification, and
   Kanban documentation.
5. Align `/v1` examples with the enforced `/api/v1` gateway base path.
6. Refresh the Figma asset backlog to distinguish the four delivered PNGs from
   assets that are genuinely still missing.
7. Review visible mojibake/encoding artifacts before final UI acceptance.

## 15. Handoff guardrails

- Do not connect the frontend directly to a database.
- Do not invent backend endpoints or fields to make a page appear complete.
- Do not treat frontend permission checks as real authorization.
- Do not present mock product, inventory, finance, portfolio, or monitoring data
  as production data.
- Do not replace the PCB/circuit background, Globe, existing public routes, or
  Kanban library without an explicit product decision.
- Do not reset either the parent repository or nested `kaban_cloud` repository;
  both contain local state that must be reviewed deliberately.
- Use npm and `package-lock.json`; do not switch the repository to pnpm or Yarn.
- Do not reintroduce a PandaCloud token, refresh endpoint or localStorage
  session. Clerk owns session refresh (collaboration workflow § 7.1).
- Do not derive `isStaff` on the client. It is computed by the gateway from
  active memberships in a `cloud_panda` organization and arrives on `/auth/me`.
- Do not add `technical`, `legal` or `compliance` permissions, routes or
  workspaces until the role matrix is confirmed.

## 16. Files produced

### 2026-08-13 handoff

- `HANDOFF.md`, `docs/AGENT_CONTEXT_SUMMARY.md`. No application source file was
  changed.

### 2026-08-15 manual sales card creation

`PandaCloudBackend` (first change to that repository in this handoff series):

```text
convex/deals.ts                         insertDeal helper + createFromGateway
convex/gatewayPaths.ts                  + salesCardCreate
convex/http.ts                          + route
convex/salesGateway.ts                  + parseCreateFields, createSalesCard action
src/domain/sales/types.ts               + SalesCardCreateRequest/Response
src/domain/sales/service.ts             + createCard
src/http/sales-handlers.ts              + handleCreateSalesCard (201)
src/integrations/convex.ts              + repository createCard
app/api/v1/sales/cards/route.ts         + POST export
api-contracts/paths/sales-cards.yaml    + post operation  (DRAFT — needs owner approval)
api-contracts/components.yaml           + 2 schemas       (DRAFT — needs owner approval)
```

`panda_cloud`:

```text
src/models/sales.ts                     + create types; header comment corrected
src/services/contracts.ts               + SalesService.createCard
src/services/http-impl/index.ts         + POST implementation
src/services/mock/index.ts              + mockCreateSalesCard (both adapters stay identical)
src/components/sales/salesAdapter.ts    comment block: why createCard is NOT here
src/components/sales/ManualDealModal.tsx  recreated for the contract shape
src/components/sales/SalesBoard.tsx     + button, modal, column load
docs/SALES_BOARD_CONTRACT_GAP.md        new (rev 2 — rev 1 was wrong, see its header)
docs/INTEGRATION_DEFECT_AUTH_ME_401.md  new (401 diagnosis, separate issue)
docs/AGENT_CONTEXT_SUMMARY.md           fingerprint refresh + Sales section correction
HANDOFF.md                              this section
```

### 2026-08-14 Clerk migration

New:

```text
docs/CLERK_AUTH_DESIGN.md
.env.example                                   (restored; was tracked at HEAD, deleted locally)
src/middleware.ts
src/services/session.ts
src/components/auth/AppAuthProvider.tsx
src/components/auth/ClerkSessionProvider.tsx
src/components/auth/StandaloneSessionProvider.tsx
src/components/auth/AuthCard.tsx
```

Deleted:

```text
src/services/tokenStore.ts
```

Modified:

```text
package.json
src/app/layout.tsx
src/app/(auth)/login/page.tsx
src/app/(auth)/signup/page.tsx
src/app/(auth)/choose-path/page.tsx
src/app/dashboard/layout.tsx
src/app/dashboard/sales/page.tsx
src/app/sales/layout.tsx
src/app/manager/layout.tsx
src/app/admin/layout.tsx
src/app/submit-request/page.tsx                (pre-existing RSC defect, see section 0)
src/config/access.ts
src/controllers/AuthContext.tsx
src/models/auth.ts
src/models/platform.ts
src/components/dashboard/Sidebar.tsx
src/components/sales/SalesBoard.tsx
src/components/shared/PermissionGate.tsx
src/components/workspace/RoleGuard.tsx
src/components/workspace/WorkspaceShell.tsx
src/components/workspace/Forbidden.tsx
src/services/api.ts
src/services/config.ts
src/services/contracts.ts
src/services/endpoints.ts
src/services/http.ts
src/services/http-impl/index.ts
src/services/mock/index.ts
src/services/mock/fixtures.ts
docs/AGENT_CONTEXT_SUMMARY.md
HANDOFF.md
```

No file in `PandaCloudBackend` was modified.

### 2026-08-17 KYC/NCNDA completion pass

Frontend additions:

```text
src/components/legal/AgreementsPage.tsx       + permission-aware create entry point
src/components/legal/CreateAgreementForm.tsx  + NCNDA create form using PATCH upsert contract

docs/LEGAL_COMPLIANCE_BACKEND_REQUIREMENTS.md + backend dependency and open-decision handoff
```

The NCNDA form is deal-scoped and sends `counterpartyOrganizationId`, `ownerId`, `status`, optional `effectiveDate`, and optional `notes`. Backend ownership remains authoritative for active-agreement uniqueness and revision policy. Organization/contact selectors and document upload are intentionally not fabricated because their lookup and upload-session contracts are not yet approved. KYC remains deal-scoped with manual case creation; automatic creation from submission/deal conversion is still an open product decision.

Known integration gap: backend permissions allow Manager/Admin to mutate KYC and NCNDA, but the frontend currently has role-specific Legal/Compliance workspace guards. Resolve the role/workspace mapping before production rollout.
### 2026-08-17 NCNDA deal-context UX correction

`/legal/agreements` now renders an explicit Deal context input and Open deal action. This matches the backend contract's deal-scoped `GET/PATCH /api/v1/deals/{dealId}/ncnda` routes. The create action is shown only after a deal id is present, so users no longer see an unexplained empty state with no way to start. Organization lookup remains identifier-based until an approved backend lookup contract exists.
### 2026-08-17 Legal/compliance frontend completion

Frontend-only additions aligned to the implemented backend gateway:

- src/components/compliance/CasesPage.tsx now accepts a deal context and exposes the create action only when a deal is selected.
- src/components/compliance/CaseDocuments.tsx and the KYC documents route now list, attach and detach registered document links.
- src/components/legal/AgreementDetail.tsx now attaches and detaches immutable NCNDA document versions; current versions cannot be detached.
- src/models/kyc.ts now exports backend-defined document-role labels.
- src/components/legal/AgreementsPage.tsx keeps a single deal-scoped create entry point.

Backend gaps recorded in docs/LEGAL_COMPLIANCE_BACKEND_REQUIREMENTS.md: signed upload-session/finalize UX, lookup endpoints, e-signature/provider integration, strict KYC lifecycle policy, single-current-KYC policy, and final role/workspace alignment. These are not implemented in the frontend by guesswork.

Validation:

- npm run lint: PASS (0 warnings/errors after the hook dependency fix).
- npm run typecheck: existing unrelated src/components/sales/salesAdapter.test.ts optional createCard fixture errors remain; no errors were reported from legal/compliance changes.

- src/components/sales/SubmissionsPage.tsx and SubmissionDetail.tsx now consume the backend submissions list/detail/convert APIs; the existing /sales/leads routes are no longer static placeholders.

### 2026-08-17 Sales Workspace Phase 2 frontend alignment

Replaced Sales placeholder/submission screens with backend-owned CRM screens and adapters. Added src/models/salesWorkspace.ts, SalesWorkspaceService, HTTP/mock implementations, and live-backed Overview, Leads, Lead Detail/Qualification, Tasks, Customers and Reports pages. Endpoint mappings and open backend gaps are recorded in docs/SALES_WORKSPACE_API_CONFORMANCE.md. No backend files were modified. 


### 2026-08-18 Deal Readiness frontend redesign

Implemented a staff-only, cross-workspace Deal Readiness flow that composes the existing deal-scoped NCNDA and KYC APIs. NCNDA and KYC run as parallel lanes with presentation-only Ready/Needs Attention/Blocked states, next actions and a combined timeline. Sales Deal Detail and Sales/Legal/Compliance navigation now provide entry points.

NCNDA creation is drafting-first and document-oriented; lifecycle actions, immutable versions, OCC and activation guidance remain aligned to the backend contract. KYC is subject-first and evidence-oriented with canonical document categories, guided review decisions, approval/rejection validation and OCC conflict handling.

No backend files, routes, schema or authorization rules were changed. See `docs/DEAL_READINESS_FRONTEND_HANDOFF.md` for contract mapping and retained backend gaps.

Validation for the Deal Readiness pass:

- npm run typecheck: PASS.
- npm run lint: PASS, zero warnings/errors.
- npm test: PASS, 21/21 tests.
- npm run build: PASS, 74 routes generated.

### 2026-08-18 — Manager workspace backend alignment

The backend now exposes the Manager Phase 1 read APIs. The frontend now consumes them through `ApiClient.manager` rather than hard-coded dashboard values:

- `GET /api/v1/manager/overview`
- `GET /api/v1/manager/team`
- `GET /api/v1/manager/team/{userId}`
- `GET /api/v1/manager/projects`
- `GET /api/v1/manager/projects/{projectId}`
- `GET /api/v1/manager/reports/projects`

Overview, Team and Reports now render loading, error and empty states from backend responses. Pipeline continues to reuse the Sales Kanban API. Operations and Approvals remain explanatory because the backend handoff marks those data sources blocked/partial; the frontend does not fabricate those records.

### 2026-08-18 — Sales → Manager Deal Handoff

Added the shared `DealHandoffPanel` to Sales deal detail. It loads deal-scoped activities/tasks plus NCNDA, KYC and Due Diligence summaries through the existing service adapters and presents the backend-owned handoff states: Sales Active, Needs Readiness Attention, Ready for Project Conversion and Project Created. Readiness remains a UX summary; no client-side conversion gate was invented.

Added Manager conversion service support for `POST /api/v1/deals/{dealId}/project` with the exact request `{ expectedRevision, idempotencyKey, projectCode, projectName? }`. The idempotency key is generated per submit, stale revisions surface a conflict and trigger refresh, and only Manager/Admin UI roles see the conversion action. Sales cannot convert projects. The Manager Sales Performance page now consumes Sales overview/conversion/activity/forecast reports instead of hard-coded figures.

Backend remains the source of truth for authorization, won status, OCC, idempotency, readiness policy and audit logging. Quotes, approval gates, notifications and project status mutation remain unimplemented/blocked where the backend contract does not provide them.

### 2026-08-18 — Deal Readiness workflow and UI redesign

Replaced the ID-first readiness experience with a Deal-context handoff. Staff now enter from Sales Pipeline/Deal Detail; the selected Deal supplies organization, owner, primary contact, commercial value and revision data. The readiness view combines NCNDA, KYC and Due Diligence as three parallel workstreams, adds a four-step Sales-to-Project handoff rail, a recommended-next-action panel and a combined activity timeline.

NCNDA and KYC creation no longer expose organization/contact/user IDs. NCNDA resolves counterparty and responsible owner from the Deal. KYC presents organization and primary-contact subject cards and sends the selected backend identifier invisibly while preserving the XOR contract. Legal and Compliance deal-context forms were replaced with handoff navigation. Technical assessment entry no longer asks for a Deal ID.

The backend still lacks staff-wide Deal lookup and global Legal/Compliance/Technical queue endpoints. The frontend does not fabricate those queues; work enters through the existing Deal card and deal-scoped APIs.

### 2026-08-18 — One readiness rule, readiness on the board, and a manager conversion queue

Frontend only. No backend file, route, schema, authorization rule or OpenAPI
document was changed, and no new endpoint is required: everything below runs on
operations that already exist.

**Three defects fixed first.** The Legal and Compliance list pages were left in
a non-building state by the previous pass:

| # | Defect | Effect |
|---|---|---|
| 1 | `compliance/CasesPage.tsx` called `useRouter()` without importing it | `npm run typecheck` and `npm run build` both fail |
| 2 | `dealContext` was declared in `CasesPage` and `AgreementsPage` but `setDealContext` was never called | `context` was always `null`, so both KYC subject buttons and the submit button were permanently disabled — **creating a KYC case from `/compliance/cases` was impossible**, and `CreateAgreementForm` could not pass step 1 |
| 3 | A `dealInput` state pair nothing read, plus an unused `Input` import | lint failure |

These are gone because both list pages were replaced rather than patched — see
"one canonical URL" below.

**One readiness rule (`src/lib/readiness.ts`, new).** The same question — is this
deal clear to hand over — was previously answered in three places with three
implementations. `DealReadinessView` selected the newest record by `updatedAt`;
`DealHandoffPanel` selected `items[0]`, i.e. whatever order the backend happened
to return; the two list pages sorted by a hand-written urgency array and never
evaluated readiness at all. `newest()` and `items[0]` are not guaranteed to be
the same record, so one deal could read **Ready** in the handoff panel and
**Needs attention** one click away.

`evaluateReadiness()` is now the only implementation. It is pure — no React, no
I/O, no environment access — and fixes the record-selection rule at *newest by
`updatedAt`*, because the list endpoints do not promise an ordering and reading
`items[0]` is reading an implementation detail. It also owns the lane labels,
tones, blocker sentence and next-action text, so those stop drifting between
screens. `DealReadinessView`, `DealHandoffPanel`, the pipeline card and the new
manager queue all call it.

Two rules worth stating because they are easy to get wrong:

- **KYC needs more than `approved`.** The backend requires `verifiedAt` on
  approval, and an expired verification is not a current one, so an approved but
  lapsed case reads *attention*, never *ready*.
- **A critical failure blocks regardless of completion.** An assessment can be
  68/68 reviewed and still contain a critical non-compliance.

`missing` is kept distinct from `attention` throughout: "nobody has started
this" and "someone is working on it" call for different next actions.

**Readiness on the pipeline card.** `DealCardView` now carries an `N · K · D`
strip (NCNDA, KYC, Due diligence), a coloured left edge, and one sentence naming
what is holding the deal up. Finding stalled deals previously meant opening every
card in turn and reading the handoff panel — thirty cards, thirty panels, ninety
requests. The information was always available; it was never where the question
gets asked.

⚠ **This is a fan-out, and it is a stopgap.** There is no aggregate readiness
endpoint and no `readiness` field on `SalesCard`, so three deal-scoped calls per
deal is the only way to put this on a card today.
`controllers/ReadinessContext.tsx` (new) keeps the cost contained: each card
registers its own id so only rendered deals are fetched, each id is fetched at
most once per board version, at most four deals are in flight at a time, and the
board never awaits any of it. A card with no result yet renders a neutral
placeholder — it never guesses *ready*. A failed lane degrades to an empty list
rather than an error, because a card that cannot say "blocked" must not say
"ready" either. **Backend gap: `GET /deals/{dealId}/readiness`, or a
materialized `readiness` field on the card payload, removes this entirely.**

**Won and Lost are locked for non-managers.** `canMoveCard` was
`() => Boolean(user)`, so any signed-in staff member could drag into a terminal
column and learn about the restriction only from the 403 that followed — the
failure arrived after the effort. It is now
`Boolean(user) && (!terminalColumnIds.has(toColumnId) || manager || admin)`, and
the column header says "Manager / admin only". `isTerminal` comes from the
backend's own column payload, not a hard-coded code list, so a stage rename never
silently unlocks a column. This is **not** access control: the backend rejects
the same move independently and must keep doing so.

**One canonical URL for NCNDA and KYC.** `/legal/agreements?dealId=` and
`/compliance/cases?dealId=` rendered a second, differently-shaped view of records
that `/deal-readiness/[dealId]` already showed — two layouts over one dataset,
two places to fix each bug. Both now redirect to `/deal-readiness/[dealId]`.

Without a `dealId` they render `DealScopedLanding` (new) instead of the old
`"Deal context required"` empty state. That empty state was what a Legal reviewer
saw every time they opened their own workspace from the sidebar: a blank screen
with no route to any work. The cause is a real backend constraint, so the page
now states it rather than hiding it behind an empty table:

- NCNDA and KYC are exposed only as `GET /deals/{dealId}/ncnda` and
  `GET /deals/{dealId}/kyc`; there is no cross-deal list operation.
- Legal and Compliance identities cannot enumerate deals either —
  `resolveKanbanScope` fails closed for those roles, so the sales board answers
  `REQUIRES_RESOURCE_SCOPE` → 403.

**⚠ Legal and Compliance still have no queue of their own, and cannot until the
backend provides one.** Needed: a cross-deal read such as
`GET /ncnda?ownerId=&status=` and `GET /kyc?assignedTo=&status=`, or a
deal-enumeration scope for those roles. Until then both workspaces depend on
Sales or Manager sending a deal link. The frontend does not fabricate the queue.

`CreateCaseForm` moved to its own module, `components/compliance/CreateCaseForm.tsx`.
It is re-exported from `CasesPage` so any existing import path keeps resolving.
`CreateAgreementForm` is unchanged; both are mounted from `DealReadinessView`,
which resolves the deal before rendering them — which is what fixes defect 2.

**Manager conversion queue (`/manager/pipeline`).** The route rendered the sales
board verbatim, giving a manager the same screen as a salesperson and no answer
to the question the role actually asks. Converting a won deal was four levels
deep: pipeline → click card → detail panel → scroll past the readiness lanes to a
form that only appears when the deal is won and unconverted.

The route now defaults to a conversion queue and keeps the full board behind a
tab, so both audiences keep what they need without a new route or a navigation
change. The queue needs no new endpoint: manager and admin resolve to the whole
board, so `GET /sales/columns` → the terminal won column →
`GET /sales/cards?columnId=` → `GET /sales/cards/{dealId}` for `projectId` (the
list payload omits it) → readiness. Rows are ordered ready-first and filterable.

**Readiness is never a gate.** Converting is offered on a deal that is not ready
too, labelled "Convert anyway" and preceded by a note explaining what is
outstanding. The backend owns authorization, won status, optimistic concurrency,
idempotency, the readiness policy and the audit trail. A fresh `idempotencyKey`
is generated per submit — a retry of a failed submit must not be deduplicated
into silence, and a double-click must not create two projects. A 409 surfaces as
a conflict message and reloads the queue.

**Deferred deliberately.** A readiness filter on the Kanban board itself was not
added: the board's card markup belongs to `@kanban/library` and the existing
vertical filter works through CSS classes in `globals.css`, so filtering by
readiness needs a matching stylesheet change that should be made and verified
together. The card strip, the coloured edge and the blocker sentence deliver the
scanning value in the meantime; the queue filter exists where the markup is ours.

**Files**

| Path | Change |
|---|---|
| `src/lib/readiness.ts` | **new** — the only readiness implementation |
| `src/controllers/ReadinessContext.tsx` | **new** — lazy, bounded, per-card fan-out |
| `src/components/workspace/DealScopedLanding.tsx` | **new** — honest landing + redirect for deal-scoped workspaces |
| `src/components/compliance/CreateCaseForm.tsx` | **new** — extracted from `CasesPage`, unchanged behaviour |
| `src/components/manager/ConversionQueue.tsx` | **new** — won deals awaiting project conversion |
| `src/components/manager/ManagerPipelinePage.tsx` | **new** — queue / board tabs |
| `src/components/sales/DealCardView.tsx` | readiness strip, coloured edge, blocker line |
| `src/components/sales/SalesBoard.tsx` | readiness provider, terminal-column gating, locked header |
| `src/components/sales/DealHandoffPanel.tsx` | now calls `evaluateReadiness` |
| `src/components/readiness/DealReadinessView.tsx` | now calls `evaluateReadiness`; lanes rendered from `READINESS_LANES` |
| `src/components/compliance/CasesPage.tsx` | replaced by landing + redirect; re-exports `CreateCaseForm` |
| `src/components/legal/AgreementsPage.tsx` | replaced by landing + redirect |
| `src/app/manager/pipeline/page.tsx` | renders `ManagerPipelinePage` |

**⚠ Validation status: NOT RUN.** The Linux workspace on the authoring machine
failed to start, so `npm run typecheck`, `npm run lint`, `npm test` and
`npm run build` could not be executed against these changes. Every claim above
is from reading the code and the contract, not from a passing run. **Run
`npm run typecheck && npm run lint && npm test && npm run build` before
committing**, and record the result in section 13. The pre-existing suite
(21 tests) touches `salesAdapter` and `SalesBoard` chrome; `SalesBoard.test.tsx`
stubs `@kanban/library`, so the readiness provider mounts with no cards and
issues no requests.

**Backend gaps this pass records, none of them resolved here**

1. `GET /deals/{dealId}/readiness`, or a `readiness` field on `SalesCard` —
   removes the 3N fan-out.
2. Cross-deal NCNDA and KYC reads, or a deal-enumeration scope for the legal and
   compliance roles — the only thing that gives those workspaces a real queue.
3. Deal, organization, contact and owner lookup endpoints — still the reason a
   bookmarked deal id must be pasted by hand anywhere.

### 2026-08-18 — Legal workspace: CR-004 queue contract and the UI built on it

Two repositories, but **no backend behaviour changed and no existing contract
file was touched**. What landed is a proposal plus the frontend that runs on it.

**The problem.** NCNDA is readable only in deal scope, and the `legal` role
cannot enumerate deals (`resolveKanbanScope` fails closed → 403 on the sales
board). A legal reviewer signing in has no route from "I am here" to "here is my
work". Every existing NCNDA operation requires an identifier the caller must
already have been given.

Second, quieter problem: `PATCH /deals/{dealId}/ncnda` is the only way to change
status and it is a full upsert. Recording "this was sent today" means resending
`counterpartyOrganizationId`, `ownerId` and `status`, so a client bug in that
payload can silently reassign the counterparty of a live agreement. The backend
enforces no state machine at all (NCNDA handoff § 7.3), leaving UI code as the
only thing preventing `active → drafting`.

**CR-004 — `PandaCloudBackend/docs/collaboration/CR-004-NCNDA-LEGAL-QUEUE.md`.**
Three proposed operations:

| Operation | Purpose |
|---|---|
| `GET /api/v1/ncnda` | Cross-deal queue: status, bucket, owner, counterparty, expiry filters; cursor pagination; default sort `stalest` |
| `GET /api/v1/ncnda/summary` | Counters for the chips and a nav badge, without paging the collection |
| `POST /api/v1/ncnda/{agreementId}/transitions` | One controlled lifecycle move, against a backend-owned state machine |

The design decision that matters most: each agreement carries
**`allowedTransitions`**, computed by the backend for its current status. The
frontend renders one affordance per entry and encodes no transition table. If
the owners change the graph, add a guard, or make `expired` terminal, no
frontend file changes.

Queue rows also carry `dealTitle`, `counterpartyName`, `ownerName` (resolved
server-side — the UI must never print an id), `statusChangedAt`, `daysInStatus`
and `hasCurrentDocument`. `daysInStatus` is the column a legal queue is
actually for; sorting by `updatedAt` produces a changelog, not a queue.

⚠ **`statusChangedAt` needs a new optional field and a backfill.** Rows written
before CR-004 report `daysInStatus: null` and the UI renders an em dash rather
than `0`, which would read as a real measurement. Same expand/backfill/contract
pattern as `organizations.normalizedName`. **Do not substitute `updatedAt`** —
it moves on any edit, so it would under-report exactly the oldest stalls.

⚠ **Three decisions the owners must make, listed in the CR:** whether display
names are resolved on the queue only or on every NCNDA response; whether 422
`TRANSITION_NOT_ALLOWED` is acceptable given workflow § 7.2 does not list it;
and whether `expired` reopens as `drafting` or is terminal.

⚠ **One proposed change is breaking and is isolated in CR-004 § 6:** requiring a
current `countersigned` document before an agreement may go `active`. The
recommendation there is *not* to enforce it yet, but to expose the gap so the
queue can show how many existing agreements would have failed.

⚠ **Read scope is deliberately narrower than the existing NCNDA matrix.** Every
staff role may read `GET /deals/{dealId}/ncnda` today — but only after obtaining
a `dealId`, and `sales` can only obtain ids for deals it owns. An unscoped
cross-deal list would hand every staff role an enumeration of every counterparty
under confidential discussion. Aggregation is not the same privilege as
per-record read. The unscoped queue is legal/manager/admin; supplying `dealId`
reduces it to the existing operation and keeps the wider matrix.

**Why the draft is not in `openapi.yaml`.** An agent may draft, lint, bundle and
diff a contract; it may not add an endpoint or approve one (workflow § 8, § 15).
The fragment lives in `api-contracts/proposals/CR-004/`, `$ref`s the real
`components.yaml`, and is referenced from nothing. Linting and diffing the
current contract does not see it. Merging is the BE owner's action after
approval — `git mv` plus six lines, spelled out in that directory's README,
including the ⚠ that `/api/v1/ncnda/summary` needs a literal App Router segment
or it will be matched as an `{agreementId}`.

**Frontend, shipped and working on the mock adapter.**

| Path | Role |
|---|---|
| `src/models/legalQueue.ts` | **new** — wire types for the three proposed operations |
| `src/services/legalQueue.ts` | **new** — port + HTTP adapter + mock adapter |
| `src/components/legal/LegalQueuePage.tsx` | **new** — the queue |
| `src/components/legal/LifecycleActions.tsx` | **new** — buttons rendered from `allowedTransitions` |
| `src/components/legal/AgreementsPage.tsx` | queue, falling back to the landing on 404 |
| `src/services/endpoints.ts` | three paths added, flagged as proposed |

⚠ **The fallback is what makes this shippable today.** `GET /ncnda` answers 404
on the HTTP adapter because no route serves it. `isQueueNotDeployed()` treats
404/405/501 as "not deployed" and renders the existing honest landing page
instead of an error the user can do nothing about. No feature flag, no second
release: the day the backend deploys CR-004, the same build shows the queue.

**Why `legalQueue` is not in `ApiClient`.** `services/contracts.ts` is the file
the team reads to learn what the backend can do. Adding three unimplemented
operations to it would make that file lie. Fold it in and delete
`services/legalQueue.ts` once CR-004 is released.

The transition state machine appears once in the frontend tree, inside the
**mock adapter** — which is a local stand-in for the server, not a client, and
has to answer the same question the server will. No component, controller or
view reads it; they read `item.allowedTransitions`.

**⚠ Validation status: NOT RUN.** The Linux workspace on the authoring machine
still fails to start, so `npm run typecheck`, `npm run lint`, `npm test`,
`npm run build` and `npm run openapi:lint` were not executed. Run them before
committing and record the result in section 13. `openapi:lint` should be
unaffected — the fragment is referenced from nothing.

**Still blocking the Legal workspace, unchanged by this pass**

1. Organization lookup — `counterpartyOrganizationId` is still typed by hand on
   create. The queue surfaces the consequence but cannot fix it.
2. Document upload — attach links an already-registered document; the
   browser-facing upload-session/finalize flow has no frontend surface.
3. E-signature — `signedAt` / `countersignedAt` stay manual, outside MVP.

#### ⚠ Correction to the entry above — the 404 fallback did not fire

Found on first run at `localhost:3000/legal/agreements`: instead of the landing
page, the queue showed **"Could not reach the server."**

The fallback was written as `error.status === 404`, which is only correct
same-origin. Across origins a missing route fails earlier and differently:

1. `GET /api/v1/ncnda` matches no App Router segment, so Next.js serves its own
   404 page.
2. That page never runs `src/http/cors.ts` — CORS headers are added by the route
   handlers, and there is no handler.
3. The browser blocks the response for want of `Access-Control-Allow-Origin`,
   and `fetch` rejects with a TypeError before any JavaScript sees the status.
4. `services/http.ts` maps that to `NETWORK_ERROR` with **no** `status`.

So at the point of failure, "this endpoint does not exist yet" is
indistinguishable from "the server is unreachable". Guessing either way is
wrong: treating every network error as *not deployed* would hide a real outage
behind a tidy landing page, and treating it as an outage shows an error the user
can do nothing about.

`isQueueNotDeployed` is replaced by `async isQueueUnavailable`, which resolves
the ambiguity by asking a route that definitely exists. If `/auth/me` produces
any HTTP response at all — **including a 401** — the gateway is up and the only
explanation left is that CR-004 has not shipped. If that fails at the transport
level too, the backend really is down and the error belongs on screen. One extra
request, only on failure, only once per load.

Changed: `src/services/legalQueue.ts`, `src/components/legal/LegalQueuePage.tsx`.

**Backend recommendation, not implemented here.** A gateway-level
`middleware.ts` that attaches the CORS headers to *every* `/api/v1/*` response,
including 404s, would let the browser surface the real status and make this
probe unnecessary. It would also fix the same class of confusion for every
future unimplemented route, not just this one. That is a backend behaviour
change and needs the BE owner.

### 2026-08-18 — Frontend checklist completion pass

Audited the owner checklist in `docs/FRONTEND_CHECKLIST_AUDIT.md`. Frontend typecheck and lint are clean, Technical DD is wired to the HTTP gateway, raw identity inputs are removed from Deal Readiness, and secure document transfer now implements upload-session, signed storage PUT and finalize through the API abstraction. KYC/NCNDA document screens use the shared upload UI and wait for backend malware status before attachment.

Added six adapter contract tests covering Sales overview/reports, KYC, NCNDA, DD, Manager project conversion and document transfer. All six assertions pass. Vitest still reports an environment EPERM after execution when writing `node_modules/.vite/vitest/results.json`; this does not change the assertion results but prevents claiming a fully clean test command. Real Clerk/storage E2E, OpenAPI freeze, lifecycle policy, report formulas, global staff queues and Quotes scope remain external blockers documented in the audit.
# 2026-08-18 — Sales Deal change request workflow

Sales can no longer be expected to execute `Won` or card removal directly. The frontend now exposes request actions in Deal detail, while Manager and Admin receive a real approval queue at `/manager/approvals` and `/admin/approvals`.

The new frontend service is `api.dealRequests`, backed by `POST|GET /deals/{dealId}/change-requests`, `GET /manager/deal-change-requests`, and `POST /manager/deal-change-requests/{requestId}/decision`. Every write uses optimistic concurrency; creation also uses an idempotency key. Frontend identity/role/ownership fields are never sent.

Removal means backend soft archive, not hard delete. Pending requests and recent decisions are visible on Sales Deal detail. Manager/Admin sees the rationale, requester, owner, stage, current revision, Deal Readiness link, and approve/reject actions. Rejection requires a comment; stale requests cannot be approved.

Detailed mapping: `docs/DEAL_CHANGE_REQUESTS_API_CONFORMANCE.md`. Backend handoff: `PandaCloudBackend/docs/collaboration/DEAL_CHANGE_REQUESTS_API_HANDOFF.md`.

Validation: frontend typecheck PASS, lint PASS, tests 29/29 PASS, build PASS. Backend typecheck PASS, lint PASS with 8 pre-existing warnings, tests 207/207 PASS, build PASS. OpenAPI is valid with 2 pre-existing Sales card schema warnings. The Convex schema/functions still need the normal deployment step (`npx convex dev` for development or the approved production deployment workflow) before the new routes can operate against a deployment.
