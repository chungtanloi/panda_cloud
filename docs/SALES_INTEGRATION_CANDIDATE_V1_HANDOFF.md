# Sales Integration Candidate v1 — Frontend Handoff

**Backend authority:** `PandaCloudBackend` at
`c546d69972323108a0650bc05e2e58c2fa81b3cf`.

This frontend implementation consumes the backend's Integration Candidate v1
through the public `/api/v1` gateway only. The candidate is authoritative for
this integration work, but is not an owner-approved released contract tag.

## Sales route status

| Frontend route | Status | Backend operations |
|---|---|---|
| `/sales` | LIVE_BACKEND | `GET /sales/overview` |
| `/sales/leads`, `/sales/leads/{id}` | LIVE_BACKEND | list/detail/qualify Sales lead operations |
| `/sales/pipeline` | LIVE_BACKEND | columns, cursor-paginated cards, detail, PATCH, and move |
| `/sales/tasks` | LIVE_BACKEND | cursor-paginated Sales tasks and task PATCH; deal lookup selector |
| `/sales/customers`, `/sales/customers/{id}` | LIVE_BACKEND | cursor-paginated customer 360 list/detail |
| `/sales/reports` | LIVE_BACKEND / policy caveat | conversion, activity, and forecast reports |
| `/sales/quotes` | BLOCKED | No quote endpoint or canonical quote domain exists |

## Transport and authentication

All Sales calls use the typed `ApiClient` methods in `src/services/api.ts`:

```text
Clerk session -> getToken() -> Authorization: Bearer <session JWT>
              -> backend /api/v1 -> canonical response/error
```

`src/services/http.ts` obtains the current token for every request from the
Clerk bridge. It does not persist a PandaCloud bearer token, does not use a
refresh token, and has no fallback from an HTTP failure to fixtures. It forwards
an `X-Correlation-Id` and retains the returned id in normalized errors.

Canonical `401`, `403`, `404`, `409`, and validation errors remain distinct.
The UI shows safe messages and a support correlation id where useful; it never
renders provider stacks.

## Selectors and identifiers

Typed `lookup` client methods are available for all frozen operations:

- `GET /lookups/deals`
- `GET /lookups/organizations`
- `GET /lookups/contacts`
- `GET /lookups/owners`

The Tasks screen uses the authorized Deal lookup for its optional task filter:
the UI displays the title and organization name, then forwards only the selected
opaque `dealId` to `GET /sales/tasks`. Lookup results are not permission grants.

The manual pipeline-card workflow preserves canonical free-text find-or-create
for a Sales caller: it sends `organizationName` and a new contact group when
needed. A Manager/Admin is additionally offered authorized Organization,
Contact, and Owner selectors. On selection, the form sends only the resulting
opaque `organizationId`, `primaryContactId`, or `ownerId`; no display name is
treated as an identifier or authorization proof. Leaving Owner empty assigns
the current caller under the backend's existing rule. There is no new frontend
Lead ownership or assignment UI.

## Pagination, OCC, money, and dates

- Leads, Tasks, and Customers preserve opaque `continueCursor` values and use
  **Load more**. No page numbers or decoded cursors are introduced.
- The existing pipeline adapter keeps server revisions and sends
  `expectedRevision` for card update/move. On `409 CONFLICT`, it refreshes the
  card rather than overwriting it; the user must retry intentionally.
- `formatMinorUnits` now uses `BigInt` string-safe arithmetic. Currency buckets
  are rendered individually in Overview, Customers, and Reports; no currencies
  are summed. Compact money output deliberately uses the same exact formatter
  until a string-safe compact display policy is approved.
- API timestamps remain ISO UTC values and are only localized for presentation.

## Product boundaries retained

- **Quotes:** blocked. The page is an explicit no-API notice, not a mock table.
- **Lead ownership:** open; no owner picker or assignment mutation was added.
- **Conversion rate and weighted forecast:** open formulas. Reports display the
  raw `_open.note` supplied by the backend and do not present it as final KPI
  policy.
- No direct browser-to-Convex request, no password endpoint, and no custom
  PandaCloud token lifecycle were added.

## Automated evidence

`npm test` currently passes **35 tests in 7 files**.

- `src/services/http-impl/authenticatedSalesClient.test.ts`: Clerk bearer
  attachment, no-session behavior, and typed lookup query forwarding.
- `src/components/sales/SalesWorkspacePages.test.tsx`: overview currency
  buckets/error state, lead pagination/qualification, task update/deal lookup,
  customer list/detail, and report policy/currency rendering.
- Existing `salesAdapter.test.ts` and `SalesBoard.test.tsx` retain pipeline
  pagination, revision/OCC, and board chrome coverage.
- `src/models/common.test.ts`: large minor-unit values do not round through a
  JavaScript number.
- `src/components/sales/ManualDealModal.test.tsx`: Manager/Admin authorized
  Organization, Contact, and Owner selector choices are forwarded only as
  opaque identifiers on manual card creation.

## Real Clerk E2E status

**NOT RUN.** No live provider or backend request was made by this integration
task. A bounded local/dev smoke test requires all of the following before it is
safe to run:

1. A local/dev backend gateway at the configured `/api/v1` base URL using the
   matching Convex HMAC configuration.
2. Clerk frontend and backend configuration with a normal session token carrying
   the API audience accepted by the gateway.
3. A non-production active Sales identity with owned test deals, tasks, leads,
   and customer records; optionally a Manager test identity for all-deal scope.
4. A non-destructive test plan: view Overview/Leads/Pipeline/Tasks/Customers/
   Reports, run one Deal lookup, and only update an isolated task or move an
   isolated non-terminal deal after recording its current revision.

Browser DevTools should show privileged calls only to the backend `/api/v1`
gateway. It must show neither direct Convex calls nor legacy password/access/
refresh-token endpoints.
