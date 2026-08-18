# Assessment report — 2026-08-18

| Field | Value |
|---|---|
| Scope | `D:\Project\panda_cloud` (frontend) and `D:\Project\PandaCloudBackend` (backend), frontend-weighted |
| Baseline | The twelve "Suggested Tasks for Tomorrow" carried over from 2026-08-17 |
| Method | Static audit — git refs, `api-contracts/`, App Router tree, source, conformance and handoff docs |
| Author | Agent session, working through the device file bridge |

> ## ⚠ Read this first: nothing in this report was verified by running it
>
> The Linux workspace on the authoring machine failed to start at the beginning
> of the session and did not recover. `npm run typecheck`, `npm run lint`,
> `npm test`, `npm run build` and `npm run openapi:lint` were **never executed**
> against any change described here.
>
> Every claim below comes from reading code and contracts. Every test written
> today is written, not passing. The verification checklist in § 8 is not a
> formality — it is the step that turns this report from a set of arguments into
> a set of facts.

---

## 1. Executive summary

Of the twelve carried-over tasks, **three are now complete, four are partial,
and five have not started**. The most consequential change during the day came
from outside the checklist: the backend shipped the lookup API, closing the gap
that had been ranked first in three consecutive handoffs.

The audit also found work in a materially worse state than the handoff recorded.
Two Legal/Compliance screens had been left non-building, and one Technical screen
had lost its only means of input. Those were not visible from the documentation;
they were visible only by reading the files.

The single largest structural risk is unchanged and grew during the day: **there
is still no end-to-end test of any kind**, against roughly 74 frontend routes,
~55 backend endpoints, Clerk authentication, an HMAC gateway hop, optimistic
concurrency and idempotency. Everything is covered by in-process unit tests
using doubles.

---

## 2. Checklist evaluation

| # | Owner | Task | Start of day | End of day |
|---|---|---|---|---|
| 1 | Backend | Synchronise `main` with `origin/main` | ✅ Done | ✅ Done (with an incident — § 4.3) |
| 2 | Frontend | Fix `createCard` fixture typecheck errors | ✅ Done | ✅ Done |
| 3 | FE + BE | E2E for Sales Overview/Leads/Tasks/Customers/Reports | ❌ Not started | ❌ Not started |
| 4 | FE + BE | E2E for KYC and NCNDA | ❌ Not started | ❌ Not started |
| 5 | Product + FE + BE | Review and freeze the OpenAPI Integration candidate | ❌ Not started | ❌ Not started |
| 6 | Frontend | Connect the Technical DD workspace to the live backend | 🟡 Partial | 🟢 Substantially done |
| 7 | Backend | Browser-facing signed upload and finalize | 🟡 BE done, FE not | 🟡 Unchanged |
| 8 | Backend | Lookup APIs for deals, organizations, contacts, owners | ❌ Not started | ✅ **BE and FE done** |
| 9 | Product | KYC/NCNDA lifecycle and case uniqueness | ❌ Open | 🟡 Proposed (CR-004), undecided |
| 10 | Product + BE | Lead ownership and reporting formulas | ❌ Open | ❌ Open |
| 11 | FE + BE | Full regression and handoff update | 🟡 Partial | 🟡 Tests written, not run |
| 12 | Product | Quotes schema and MVP scope | ❌ Blocked | ❌ Blocked |

### Evidence for the four that changed

**#6 — Technical DD.** The frontend calls the live service
(`api.dueDiligence.listAssessments`), and the backend routes exist
(`app/api/v1/deals/[dealId]/due-diligence/assessments`, `.../[assessmentId]`,
`/progress`, `/responses`). The `DD_API_CONFORMANCE.md` claim that "every DD call
answers 404 today" is stale. What remained was that the page had no way to
receive a deal; that is fixed in § 5.2. Two caveats stand: the default adapter is
still `mock` unless `NEXT_PUBLIC_API_ADAPTER=http`, and four DD response shapes
are still the frontend's reading of a document that never specified them.

**#8 — Lookups.** `GET /api/v1/lookups/{deals,organizations,contacts,owners}`
are implemented, tested backend-side, and present in `openapi.yaml`. `q` requires
two characters, `limit` is 1–50, cursor pagination throughout. The frontend now
consumes them (§ 5.2). **The authorization caveat in § 6.1 is important and
reduces the practical value of this considerably.**

**#9 — Lifecycle.** Still an open product question. CR-004 (§ 5.3) proposes a
concrete state machine and a controlled transition endpoint, but an agent may not
approve a contract; three decisions in that document are explicitly unresolved.

**#11 — Regression.** Four test files were added today, the first automated
coverage of any of today's work. None has been executed.

### Evidence for the two most often mis-read as done

**#5 — Contract freeze.** `openapi.yaml` still reads `version: 0.1.0-draft`. Its
own description now says "Backend-owned Integration Candidate v1 … **not an
owner-approved contract release, tag, or production freeze**". The backend's
context summary still lists "Contract not frozen/released" under open questions.

A contract-completeness check run during the audit found operations serving
traffic that the contract does not describe:

| Route present in `app/api/v1/` | In `openapi.yaml` |
|---|---|
| `deals/{dealId}/due-diligence/assessments` | ❌ |
| `due-diligence/assessments/{id}` and `/progress`, `/responses` | ❌ (only the `/evidence` branch) |
| `manager/reports/projects` | ❌ |
| `manager/team/{userId}`, `manager/projects/{projectId}` | ❌ |

Freezing before these are reconciled would tag an incomplete contract.

**#3 and #4 — E2E.** Neither `package.json` contains Playwright, Cypress or any
browser runner; there is no `e2e/` directory and no `playwright.config.*`. The
frontend has vitest with jsdom; the backend has vitest with `convex-test`. Every
existing test replaces its dependencies with doubles. No test has ever exercised
a real Clerk session, the HMAC gateway hop, or a real 409 from the database.

---

## 3. What the audit found that the documentation did not

The handoff described work as complete that could not build or could not be used.
These were found by reading files whose modification time was newer than
`.git/index` — that is, uncommitted work in progress.

### 3.1 The repository did not build (frontend)

`src/components/compliance/CasesPage.tsx` called `useRouter()` while importing
only `useSearchParams` from `next/navigation`. `npm run typecheck` and
`npm run build` both fail on it.

### 3.2 Creating a KYC case was impossible

In both `CasesPage.tsx` and `legal/AgreementsPage.tsx`:

```tsx
const [dealContext, setDealContext] = useState<SalesCardDetailDto | null>(null);
// setDealContext is never called anywhere in either file
```

The consequence chain: `context` is permanently `null` → both subject buttons in
`CreateCaseForm` are disabled → the submit button is disabled. **KYC creation
from the Compliance workspace could not be performed at all.**
`CreateAgreementForm` was blocked at step 1 the same way.

This is the kind of defect a screenshot does not reveal — the page renders, the
form appears, and nothing is clickable.

### 3.3 The Technical assessments page had no input at all

`technical/AssessmentsPage.tsx` retained `input`, `setInput`, a `submit` handler
and the `Input` import, but the form itself had been removed in an earlier pass.
Without a `?dealId=` query parameter the page could do nothing, and the orphaned
symbols also failed lint.

### 3.4 One readiness question had three answers

The same question — is this deal clear to hand over — was implemented three
times with two different record-selection rules:

| Location | Which record it judged |
|---|---|
| `DealReadinessView` | newest by `updatedAt` |
| `DealHandoffPanel` | `items[0]`, i.e. whatever order the backend returned |
| `AgreementsPage` / `CasesPage` | sorted by a hand-written urgency list, never evaluated |

The list endpoints promise no ordering, so these are not guaranteed to be the
same record. One deal could read **Ready** in the handoff panel and **Needs
attention** one click away.

### 3.5 Terminal-column drags failed after the effort

`canMoveCard: () => Boolean(user)` allowed any signed-in staff member to drag a
card into Won or Lost. The backend restricts those transitions to manager and
admin and answers 403. The user learned about the restriction only after
completing a deliberate drag — the failure arrived after the effort, which is the
worst available ordering.

### 3.6 Legal and Compliance had no queue, and said nothing about why

Opening `/legal/agreements` or `/compliance/cases` from the sidebar produced
`"Deal context required"`. The cause is real and not a frontend oversight: NCNDA
and KYC are exposed only per deal, and `resolveKanbanScope` fails closed for
those roles, so they cannot enumerate deals either. But the screen did not say
so; it looked like an empty list.

---

## 4. Incidents handled during the session

### 4.1 A fallback that never fired (self-inflicted)

The Legal queue was written to fall back to a landing page when `GET /ncnda`
returns 404. In development the frontend and gateway are on different origins,
and a missing App Router segment is served by Next.js's own 404 page, which never
runs `src/http/cors.ts` because CORS headers are added by route handlers and
there is no handler. The browser blocks the response, `fetch` rejects with a
TypeError, and `http.ts` maps that to `NETWORK_ERROR` **with no status**. The
status check could not fire.

At the point of failure, "this endpoint does not exist yet" and "the server is
unreachable" are indistinguishable. Guessing either way is wrong: treating every
network error as *not deployed* hides a real outage behind a tidy page; treating
it as an outage shows an error the user cannot act on. Resolved by probing
`/auth/me` — any HTTP response, including a 401, proves the gateway is up.

**Recommendation for the backend owner:** a gateway-level `middleware.ts`
attaching CORS headers to every `/api/v1/*` response, including 404s, would let
the browser surface the real status and make the probe unnecessary — for every
future unimplemented route, not just this one.

### 4.2 The status quo of the Legal workspace

The audit's recommendation — that Legal cannot have a queue without new backend
operations — was turned into a formal Change Request rather than either
fabricating a queue or leaving the workspace empty. See § 5.3.

### 4.3 Merge conflict markers committed to the backend

`src/bootstrap.ts` contained four unresolved conflict hunks and would not
compile. Reconstructed from the reflog:

```
fb0b479 → commit 6406be0   "Add Deal Change Requests API & NCNDA draft"
        → reset to fb0b479          (commit undone, work kept in the tree)
        → pull --ff to c546d69      (origin brings Lookups)
        → reset to HEAD
        → commit aaf2be2            ← committed WITH the conflict markers
        → commit ec08519
```

`src/integrations/convex.ts` had been resolved correctly; `bootstrap.ts` was
missed. Both sides were additive and independent (Deal Change Requests vs
Lookups), so the resolution is to keep both. Every file both features touch —
`convex/gatewayPaths.ts`, `convex/http.ts`, `src/integrations/convex.ts`,
`api-contracts/openapi.yaml` — was checked and is clean. The file was resolved on
the device before the fix could be written; the two resolutions were compared and
are identical.

---

## 5. Work delivered

All frontend. **No backend behaviour, route, schema, authorization rule or
existing contract file was changed at any point today.**

### 5.1 One readiness rule

`src/lib/readiness.ts` (new) is now the only implementation. Pure — no React, no
I/O, no environment access. The record-selection rule is fixed at *newest by
`updatedAt`*, because reading `items[0]` is reading an implementation detail of
an endpoint that promises no ordering.

Three rules in it are stricter than a status equality check, and each exists for
a reason:

- **KYC needs more than `approved`.** The backend requires `verifiedAt` on
  approval, and an expired verification is not a current one.
- **A critical failure blocks regardless of completion.** An assessment can be
  68/68 reviewed and still contain a critical non-compliance.
- **`missing` is distinct from `attention`.** "Nobody started this" and "someone
  is working on it" call for different next actions.

Consumed by four surfaces: the pipeline card, the handoff panel, the readiness
page and the manager conversion queue. They can no longer disagree.

### 5.2 Screens

| Change | Why |
|---|---|
| `N · K · D` readiness strip, coloured edge and a one-line blocker on every pipeline card | Finding stalled deals previously meant opening thirty cards and reading thirty panels — ninety requests. The information existed; it was never where the question gets asked. |
| Won/Lost locked for non-managers, with the reason in the column header | Removes the affordance instead of punishing its use. `isTerminal` comes from the backend's column payload, so a stage rename cannot silently unlock a column. Not access control — the backend still rejects independently. |
| One canonical URL: `/legal/agreements?dealId=` and `/compliance/cases?dealId=` redirect to `/deal-readiness/[dealId]` | Two layouts over one dataset meant two places to fix each bug. |
| `DealScopedLanding` replaces the empty state | States the backend constraint plainly instead of showing a blank table. |
| Manager conversion queue at `/manager/pipeline`, board behind a tab | Converting a won deal was four levels deep and there was no view answering "which deals are waiting on me". Needs no new endpoint: manager and admin resolve to the whole board. |
| `DealPicker` wired into the Technical assessments page and the deal-scoped landing | Replaces pasting an opaque Convex key. Debounced at 250 ms, starts at two characters because a shorter `q` is a 400 on the wire, drops out-of-order responses with a request ticket. |

`DealPicker` detects a 403 once, explains in one line that the role has no deal
scope, and falls back to the identifier field. When the backend widens the scope
the fallback disappears on its own and no frontend file changes.

### 5.3 CR-004 — a contract proposal for the Legal workspace

`PandaCloudBackend/docs/collaboration/CR-004-NCNDA-LEGAL-QUEUE.md`, with a draft
OpenAPI fragment in `api-contracts/proposals/CR-004/`.

| Proposed operation | Purpose |
|---|---|
| `GET /api/v1/ncnda` | Cross-deal queue; filters, cursor pagination, default sort `stalest` |
| `GET /api/v1/ncnda/summary` | Counters, without paging the collection |
| `POST /api/v1/ncnda/{id}/transitions` | One controlled lifecycle move |

The design decision that matters most: each agreement carries
**`allowedTransitions`**, computed by the backend for its current status. The
frontend renders one affordance per entry and encodes no transition table. If
the owners change the graph, no frontend file changes.

**The fragment is deliberately not in `openapi.yaml`.** An agent may draft, lint
and diff a contract but may not add an endpoint or approve one (collaboration
workflow § 8, § 15). Writing these paths into the shared draft would place three
unapproved operations in front of every consumer. Merging is the BE owner's
action after approval — one `git mv` and six lines, documented in the fragment's
README, including the warning that `/api/v1/ncnda/summary` needs a literal App
Router segment or it will be matched as an `{agreementId}`.

The frontend built on it ships today and degrades honestly on the HTTP adapter,
so no feature flag and no second release are needed.

### 5.4 Test coverage

Four files, the first automated coverage of anything shipped today. No new
dependency — vitest and testing-library were already installed.

| File | Covers |
|---|---|
| `src/lib/readiness.test.ts` | Record selection; the three stricter guards; lane percentage; next-action text |
| `src/services/legalQueue.test.ts` | CR-004 mock adapter — buckets, ordering, row shape, transition guards, `isQueueUnavailable` |
| `src/models/legalQueue.test.ts` | The pure helpers the transition form uses |
| `src/services/lookup.test.ts` | Query guard, role-rejection detection, the four mock lookups |

These pin what is cheap to break and expensive to have broken: that the newest
record decides the verdict; that an approved-but-unverified or lapsed KYC is not
ready; that a prohibited risk blocks whatever the status says; that a 68/68
assessment with one critical failure blocks; and that a row with no measurable
stall reports `null` rather than `0`, because zero would read as "changed today",
a measurement the backend never made.

⚠ `legalQueue.test.ts` is order-dependent within the file — the mock keeps rows
in module state so a transition is visible on the next read, as a server would.
Stated at the top of that file.

---

## 6. Open risks

### 6.1 The lookup API excludes the roles that needed it most

Read from `convex/lookups.ts`, not from a document:

| Lookup | Who may call it |
|---|---|
| `deals` | sales (own deals), manager, admin — **legal, compliance and technical receive 403** |
| `contacts` | same, and `organizationId` is required |
| `organizations` | manager, admin only |
| `owners` | manager, admin only |

`deals` and `contacts` resolve the Kanban scope, which fails closed with
`REQUIRES_RESOURCE_SCOPE` for legal, compliance and technical. A deal picker in
those three workspaces still cannot work.

There is a sharper mismatch inside that: **NCNDA writes are legal/manager/admin,
but the organization lookup that would populate a counterparty selector is
manager/admin.** A legal user can create an agreement and cannot choose who it is
with.

### 6.2 Legal and Compliance still have no queue

Unchanged, and not solvable from the frontend. Needs either a cross-deal read
(`GET /ncnda?ownerId=&status=`, `GET /kyc?assignedTo=&status=`) or a
deal-enumeration scope for those roles. Both workspaces depend on Sales or
Manager sending a link.

### 6.3 The 3N readiness fan-out is a stopgap

Putting readiness on a pipeline card costs three deal-scoped calls per deal,
because no aggregate exists. It is bounded — lazy per rendered card, at most four
deals in flight, cached per board version, never awaited by the board — but the
correct fix is `GET /deals/{dealId}/readiness` or a `readiness` field on the card
payload.

### 6.4 Nothing shipped today has been executed

Restated because it is the largest risk in this report. Roughly 1,900 lines of
frontend code and four test files were written without a single compilation.

---

## 7. Decisions required

| # | Decision | Owner |
|---|---|---|
| 1 | Should `lookups/deals` return a defined scope for legal, compliance and technical instead of failing closed? | BE + Product |
| 2 | Should `lookups/organizations` be readable by `legal`, to match who may write an NCNDA? | BE |
| 3 | CR-004: are display names resolved on the queue only, or on every NCNDA response? | FE + BE |
| 4 | CR-004: is `422 TRANSITION_NOT_ALLOWED` acceptable, given workflow § 7.2 does not list it? | BE |
| 5 | CR-004: does `expired` reopen as `drafting`, or is it terminal? | Product |
| 6 | CR-004 § 6: enforce, report, or drop the "active requires a countersigned document" rule? *(Recommendation: report — no breaking change, and the queue will show how many existing agreements would have failed.)* | Product + BE |
| 7 | KYC lifecycle state machine, approval/rejection semantics, and the duplicate-case policy | Product |
| 8 | Lead ownership and the conversion/forecast formulas — the `_open` fields | Product + BE |
| 9 | Quotes: implement or remain blocked | Product |
| 10 | Should the gateway attach CORS headers to 404s? *(Removes the need for a client-side probe on every future unimplemented route.)* | BE |

---

## 8. Verification checklist — run before committing

```powershell
# Frontend
cd D:\Project\panda_cloud
npm run typecheck
npm run lint
npm test          # expect roughly 60 tests, up from 21
npm run build

# Backend
cd D:\Project\PandaCloudBackend
npm run verify    # fixture:verify + typecheck + test
npm run openapi:lint   # unaffected: the CR-004 fragment is referenced from nothing
```

Then record the result in `HANDOFF.md` § 13, which has had no validation entry
for 2026-08-18.

If anything fails, the most likely causes, in order: a type mismatch in the new
`readiness.ts` consumers; the `DealPicker` prop pass-through on the shared
`Input`; and the order-dependent transition test in `legalQueue.test.ts`.

---

## 9. Recommended sequence

1. **Run the verification checklist.** Nothing else is worth doing until the code
   is known to compile.
2. **Answer decisions 1 and 2.** They are cheap and they unblock the deal and
   counterparty selectors across four screens.
3. **Reconcile the contract with the routes**, then freeze (#5). Freezing an
   incomplete contract is worse than not freezing.
4. **Introduce one E2E path** — sign in with a real Clerk session, open a deal,
   move a card, hit a 409. One path proves the harness; the rest can follow.
5. **Answer the remaining product decisions** (7, 8, 9). None costs engineering
   time, and each blocks a screen that currently displays a caveat instead of a
   number.
6. **Review and approve or reject CR-004.** The frontend is already written
   against it and degrades safely either way.
