# Technical, Legal and Compliance workspaces — design and backend gaps

**Date:** 2026-08-17. **Scope:** frontend only; no backend file was changed.

**Design authority:** `docs/PANDA_CLOUD_ROLE_PERMISSION_MATRIX.md` §§ 5.2, 6.2,
7.2, 10 and 11. Those route tables previously carried the note *"Technical/
Legal/Compliance route trees chưa tồn tại trong frontend hiện tại; phần trên là
page design được đề xuất… không phải các page đã implement."* They now exist,
built to exactly what those tables specify — no extra route, page or permission
was invented.

**Domain authority:** `PandaCloudBackend/convex/schema.ts`,
`convex/dueDiligence.ts`, `convex/ncnda.ts`, `convex/kyc.ts`, and
`docs/system-analysis/USE_CASES.md` UC-010, UC-011, UC-015, UC-016. Field and
enum values were copied from those files rather than reasoned about.

---

## 1. Read this first

**None of these three workspaces has a backend.** The gateway exposes ten
paths: identity, webhooks and sales. That is all.

| Domain | Convex functions | Convex **read** | Gateway path | HTTP route | OpenAPI |
|---|---|---|---|---|---|
| Due Diligence | 4 (`dueDiligence.ts`) | yes | **no** | **no** | **no** |
| NCNDA | 1 mutation (`ncnda.ts`) | **none at all** | **no** | **no** | **no** |
| KYC | 2 mutations (`kyc.ts`) | **none at all** | **no** | **no** | **no** |

NCNDA and KYC are worse off than DD: they have no query functions whatsoever,
so listing agreements or cases is not a missing gateway hop — it is a missing
backend function. Every page here works on the **mock adapter** and every one
returns 404 against a real gateway.

Nothing is stubbed to hide this. Where a screen cannot work, it says so on the
page (`components/workspace/GapNotice.tsx`) rather than rendering an empty
table that reads as "no data" when the truth is "no endpoint".

---

## 2. Routes built

| Route | Source | State |
|---|---|---|
| `/technical` | § 5.2 Overview | Explanatory — **cannot show live numbers**, see § 4.1 |
| `/technical/assessments` | § 5.2 | Working, but **needs a deal id typed in**, see § 4.1 |
| `/technical/assessments/[id]` | § 5.2 | Fully working: filter, respond, mark reviewed, OCC |
| `/technical/assessments/[id]/evidence` | § 5.2 | Placeholder — upload out of scope |
| `/legal` | § 6.2 Overview | Fully working — counts derived from the list |
| `/legal/agreements` | § 6.2 | Fully working — filter, queue-first ordering |
| `/legal/agreements/[id]` | § 6.2 | Working: lifecycle form + read-only version history |
| `/compliance` | § 7.2 Overview | Fully working — counts by status and risk |
| `/compliance/cases` | § 7.2 | Fully working — list, filter, create |
| `/compliance/cases/[id]` | § 7.2 | Working: manual review with conditional fields |
| `/compliance/cases/[id]/documents` | § 7.2 | Placeholder — schema gap, see § 4.3 |

All three are added to `middleware.ts` as authenticated prefixes. Which role may
open which workspace stays in `RoleGuard`, and the backend remains the real
control (§ 14 of the matrix).

---

## 3. Business rules encoded, and where they came from

Every rule below is mirrored in the **mock adapter as well as the form**, so a
payload that passes locally passes against the real backend. An adapter more
permissive than the backend hides integration defects until deploy.

### NCNDA — `convex/ncnda.ts#upsertAgreement`

| Rule | Effect in the UI |
|---|---|
| `active` requires `effectiveDate` (YYYY-MM-DD) | Field becomes required and is validated before the request |
| At most one `active` per (deal, counterparty) | A second one is a 409 with a message that says why |
| `expectedRevision` required on update | Sent from the loaded row; a 409 re-reads instead of retrying |
| Create and update are one operation | One `upsertAgreement` method; `agreementId` present means update |
| Roles legal / manager / admin | `ncnda:manage` disables the form for everyone else |

### KYC — `convex/kyc.ts#createCase`, `#updateCase`

| Rule | Effect in the UI |
|---|---|
| Exactly one subject (organization XOR contact) | Modelled as a **discriminated union**, so the invalid state cannot be constructed; the form uses a type selector |
| `provider` and `providerCaseId` together or neither | Validated as a pair |
| Duplicate provider case | 409, surfaced with the correlation id |
| `rejected` requires `rejectionReason` | Reason field appears only for that status and is required |
| `approved` requires `verifiedAt` | Date field appears only for that status and is required |
| `status` is non-optional on update | The form sends **every** field back — this is a full status write, not a patch, and omitting a field would clear it |
| Roles compliance / manager / admin | `kyc:manage` |

### Due Diligence — `DD API.md`

Covered in `docs/DD_API_CONFORMANCE.md`. The detail page adds one thing worth
noting: an unanswered requirement has no response row, so its
`expectedRevision` is `0`.

---

## 4. Gaps that block a screen

### 4.1 There is no cross-deal assessment list — blocks `/technical`

`DD API.md` scopes the list to one deal
(`GET /deals/{dealId}/due-diligence/assessments`) and states its five
operations are the whole surface. A Technical identity also cannot enumerate
deals: `resolveKanbanScope` fails closed for that role, so the sales board
answers 403.

So there is no path from "I am a technical reviewer" to "here are my
assessments". `/technical/assessments` therefore takes the deal id in a field
(and in the URL, so the view is shareable), and `/technical` stays explanatory
instead of rendering charts over data it cannot fetch.

**What the backend needs to add:** either a cross-deal assessment list, or a
read that returns the deals a Technical identity is assigned to.

### 4.2 Evidence upload is out of scope — blocks the evidence page

`DD API.md` line 2. The canonical six-step upload flow has no operation on any
step. Shapes are modelled under "NOT ON THE WIRE" in `models/dueDiligence.ts`,
so this becomes implementation rather than new design later.

### 4.3 `kycCases` has no document relation — blocks the documents page

ROLE_PERMISSION_MATRIX § 7.4 records this as an explicit gap and forbids
inventing a model such as `kycCaseDocuments`. Its own instruction is that the
page stay a placeholder. There is deliberately **no document type** in
`models/kyc.ts`.

### 4.4 Display names must be resolved server-side

`ncndaAgreements` stores `counterpartyOrganizationId` and `ownerId`;
`kycCases` stores `subjectOrganizationId` / `subjectContactId` and `assignedTo`.
All are opaque Convex keys. The models declare `counterpartyName`, `ownerName`,
`assignedToName` and `dealTitle` as fields the backend must resolve — the same
pattern already shipped for `SalesCard.organizationName` / `ownerName`. Until
then the UI shows an em dash; it never prints an id.

### 4.5 `providerPayload` is not rendered

`kycCases.providerPayload` is a free-form record with no documented shape.
Rendering arbitrary provider output risks exposing personal data the UI has no
policy for, so it is omitted with a note on the page.

---

## 5. ⚠ Proposed paths — not approved

No NCNDA or KYC operation exists in any contract, so
`services/endpoints.ts` proposes these, shaped like the sales operations that
do exist. **The BE owner has not agreed to them**, and they are the most likely
thing in this pass to change:

```
GET   /ncnda/agreements
GET   /ncnda/agreements/{agreementId}
POST  /ncnda/agreements              (upsert — agreementId in the body)
GET   /kyc/cases
GET   /kyc/cases/{caseId}
POST  /kyc/cases
PATCH /kyc/cases/{caseId}
```

There is deliberately no `/kyc/cases/{caseId}/documents` — see § 4.3.

---

## 6. ⚠ Permission grants

`ncnda:view` / `ncnda:manage` go to legal, manager and admin;
`kyc:view` / `kyc:manage` to compliance, manager and admin. Manager and admin
are included because `convex/ncnda.ts` and `convex/kyc.ts` accept those roles
directly — `requireRoleActor(ctx, ["legal", "manager", "admin"])` and
`["compliance", "manager", "admin"]`. ROLE_PERMISSION_MATRIX § 10 names the four
permissions but does not assign them; the assignment follows the code that
enforces them.

The related `dd:*` discrepancy is written up in `docs/DD_API_CONFORMANCE.md` § 5.

---

## 7. Not verified

- **No tests.** This repository has no frontend test harness, so nothing here is
  covered by an automated check beyond `tsc` and `next build` (70 routes, both
  clean).
- **No screen has been run against a real backend**, because there is none. Every
  interaction was exercised against the mock adapter only.
- The wire shapes in `models/ncnda.ts` and `models/kyc.ts` are derived from
  Convex row shapes plus the display fields in § 4.4. They are a **proposal for
  the contract**, not a reading of one, and need BE owner review.
