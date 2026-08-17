# Sales board — why every column shows "No cards", and why there is no "Add card" button

**Date:** 2026-08-14 (rev 2)
**Scope:** `panda_cloud` sales pipeline ↔ `PandaCloudBackend` `/api/v1/sales/*`

> **Correction to rev 1.** The first version of this document claimed the
> frontend had not been migrated to the backend contract. That was wrong — it
> was written against a stale snapshot. The frontend **has** been migrated:
> `services/contracts.ts`, `components/sales/salesAdapter.ts` and
> `components/sales/SalesBoard.tsx` now match the backend wire shapes, with
> tests. Everything below is re-derived from the files currently on disk.

---

## 1. Both symptoms are correct, and neither is a frontend bug

| Symptom | Verdict |
|---|---|
| No "+ Add card" button | **Intentional and correct** — see § 2 |
| Every column shows "No cards" / `0` | **The board is working. The database has no deals.** — see § 3 |

The board itself is healthy: it rendered all ten backend-seeded stages (New,
Contacted, Qualified, Due Diligence, Evaluation, Proposal, …), the vertical
filter chips, and resolved the signed-in user as role `sales`. That means
`GET /api/v1/auth/me`, `GET /api/v1/sales/columns`, the Clerk session, the
membership lookup and the `RoleGuard` are all working end to end.

---

## 2. The "Add card" button was removed on purpose

`src/components/sales/SalesBoard.tsx` states it in its own doc comment:

> *"There is deliberately no 'Add card' or 'Delete card' surface: the backend
> contract has no create or delete operation, so the adapter does not expose
> them and the board must not either."*

That is the right call, and it matches the project rule "do not invent backend
endpoints to make a page look complete" (`HANDOFF.md` § 15).

### Confirmed at three layers

**1. The Convex transport layer** — `convex/gatewayPaths.ts` is the complete
list of internal operations the gateway can reach:

```ts
resolveIdentity, upsertIdentity,
processClerkWebhook, recordClerkWebhookFailure,
salesColumns, salesCards, salesCardDetail, salesCardUpdate, salesCardMove
```

No create. No delete.

**2. The HTTP routes** — `app/api/v1/sales/cards/route.ts` exports only `GET`
and `OPTIONS`; `app/api/v1/sales/cards/[dealId]/route.ts` exports only `GET`,
`PATCH` and `OPTIONS`. A `POST /api/v1/sales/cards` would return **405**.

**3. CORS** — `src/http/cors.ts` allows `GET, POST, PATCH, OPTIONS`. `POST` is
there for `/cards/{dealId}/move`, not for creation. `DELETE` is not allowed at
all.

So the button is absent because there is nothing for it to call. Putting it back
without a backend operation would just produce a 405 behind a spinner.

---

## 3. Why the columns are empty

### 3.1 Nothing creates a deal — anywhere

`convex/seed.ts` inserts exactly two things:

- the **10 `pipelineStages`** (`new` … `on_hold`) — which is why the columns
  render correctly;
- the **`data_center_technical_dd` v1 template** and its 68 items.

It does **not** insert any `deals`, `organizations`, `contacts` or `leads`.

And there is no runtime path to create one either:

| Expected source of a deal | Status |
|---|---|
| Manual staff entry (`POST /sales/cards`) | not implemented |
| Customer form submissions creating a card transactionally (`API_CONTRACT.md` § 9.2 — assessment, booking, investment, hyperscale, lead form) | **none of those endpoints exist**; the backend HTTP surface is `auth/me`, `sales/*` read+update+move, and the Clerk webhook |
| Seed / fixture | not seeded |

**Conclusion: the `deals` collection is empty, so "No cards" is the truthful
answer.** The only way to get a card on the board today is to insert a `deals`
document directly through the Convex dashboard or a one-off mutation.

### 3.2 A second reason that will bite even after deals exist

`convex/dealflow.ts` → `getBoard` applies role scoping:

```ts
const scope = await resolveKanbanScope(ctx, user._id);
…
const ownerId = scope.kind === "assigned" ? scope.ownerId : args.ownerId;
```

A caller with role `sales` is scoped to **`assigned`** — they see only deals
where `ownerId` is their own user id. This is correct per
`DEALFLOW_MVP_DATABASE_DESIGN` § 9.2 ("View Kanban — Sales: Assigned;
Manager/Admin: All").

So when you do create a test deal, set `ownerId` to **your own** `users._id`,
or the board will still show nothing. Signing in as `manager` or `admin` would
show all deals.

---

## 4. What is actually missing — a product decision, not a bug fix

Two documented capabilities have no implementation. Both are backend work.

### Gap A — manual card creation

`API_CONTRACT.md` § 9.2 describes `POST /sales/cards` for outbound/offline
leads, restricted to Sales/Manager/Admin, with the backend generating `id`,
`reference`, `order`, `createdAt`, `updatedAt`.

`ROLE_PERMISSION_MATRIX` § 4.2 also grants Sales "Tạo Deal — Có".

Neither the OpenAPI paths (`api-contracts/paths/sales-*.yaml`) nor the routes
implement it.

**Needed to restore the "+ Add card" button:** an OpenAPI path, a
`salesCardCreate` gateway path, a Convex `deals.create` mutation writing
`deals` + initial `dealStageHistory` + `auditLogs` atomically (UC-004), and a
`POST` export on the cards route.

### Gap B — automatic card creation from customer submissions

This is the more important one. `API_CONTRACT.md` § 9.2 is explicit:

> *"When a customer completes a flow, create the deal card in the same
> transaction that stores the submission. Two separate writes would let the
> submission succeed while the card fails, leaving a real customer that no one
> in sales can see."*

None of the five intake endpoints exist yet, so in production the pipeline would
stay permanently empty regardless of Gap A.

### Gap C — delete

`API_CONTRACT.md` § 9.8 allows Manager/Admin delete with an immutable audit
event. `KANBAN_INTEGRATION.md` argues the opposite — a real deal belongs in
`lost`, never erased. The backend implemented neither, and CORS forbids DELETE.

**This contradiction between two project documents needs an owner decision**
before anyone builds it. Recording "Lost" instead of deleting is the more
defensible default and is already supported by the `move` operation.

---

## 5. How to verify the board works, right now

Insert one deal through the Convex dashboard with:

- `stageId` = the `_id` of the `new` stage from `pipelineStages`
- `ownerId` = **your own** `users._id` (see § 3.2)
- `organizationId` = any `organizations._id`
- `title`, `vertical` (`land|gpu|token|hyperscale`), `priority`
  (`low|normal|high|urgent`), `status: "open"`, `revision: 1n`,
  `updatedAt: Date.now()`, `createdBy` = your user id

Reload `/sales/pipeline`. The card should appear in **New**, be draggable
between columns, and the detail panel should save through
`PATCH /sales/cards/{dealId}` with `expectedRevision`.

If it appears, the whole read/update/move path is proven and the only remaining
work is the creation gaps in § 4.

---

## 6. Recommended order

1. **Seed a handful of demo deals** behind the existing `SEED_ENABLED` /
   `SEED_SECRET` guard so the board is testable and demoable today. Cheapest
   possible unblock, no contract change.
2. **Decide Gap C** (delete vs Lost-only) and write the decision down — two
   documents currently disagree.
3. **Implement Gap A** (`POST /sales/cards`) if manual entry is in scope. Then,
   and only then, restore the "+ Add card" button and `ManualDealModal`.
4. **Implement Gap B** (intake → transactional deal creation). This is what
   makes the pipeline real; without it the board has no production data source.
5. Every one of these changes the OpenAPI surface, so each needs FE + BE owner
   approval before the contract is frozen (collaboration workflow § 8).
