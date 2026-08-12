# Cloud Panda — API Contract

Contract between the **frontend** (this repo) and the **backend** (separate team).

The frontend is written against this document. Implement these endpoints and the
UI connects with no code changes — only `NEXT_PUBLIC_API_BASE_URL` and
`NEXT_PUBLIC_API_ADAPTER=http` in `.env.local`.

- **Base URL:** value of `NEXT_PUBLIC_API_BASE_URL`, e.g. `https://api.cloudpanda.example/v1`
- **Content type:** `application/json; charset=utf-8` (except file upload)
- **Auth:** `Authorization: Bearer <accessToken>` on every endpoint not marked _public_
- **Source of truth for paths:** `src/services/endpoints.ts`
- **Source of truth for types:** `src/models/*.ts`

---

## 1. Conventions

### 1.1 Success envelope

Every 2xx response wraps its payload in `data`:

```json
{
  "data": { "...": "..." },
  "meta": { "requestId": "req_01H8XQ", "timestamp": "2026-08-12T06:30:00Z" }
}
```

`meta` is optional. The client also tolerates a bare payload (no `data` key), but
the envelope is preferred.

### 1.2 Error format

Every 4xx/5xx response uses:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please check the highlighted fields.",
    "details": { "email": ["Enter a valid email address."] }
  }
}
```

`details` is required for `422` and maps **field name → list of messages**. The
frontend renders `details[field][0]` beneath the matching input, so field names
must match the request body keys exactly.

| `code` | HTTP | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing/expired token, or bad credentials |
| `FORBIDDEN` | 403 | Authenticated but not permitted |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | e.g. email already registered |
| `VALIDATION_FAILED` | 422 | Field-level validation failure |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL` | 500 | Unhandled server error |

### 1.3 Token refresh

On any `401`, the client calls `POST /auth/refresh` **once**, then replays the
original request. If the refresh also fails, the session is cleared and the user
is sent to `/login`. Refresh must therefore be idempotent and must not itself
return `401` for a valid refresh token.

### 1.4 Types

All timestamps are ISO-8601 UTC (`2026-08-12T06:30:00Z`). Money is a **number in
USD**, not a string, and not in cents. Percentages are numbers `0–100`.

---

## 2. Auth

### `POST /auth/signup` — _public_

Request:
```json
{ "fullName": "Jane Cooper", "email": "jane@company.com", "password": "s3cret-pass", "company": "Northwind Energy" }
```

`201 Created`:
```json
{
  "data": {
    "user": {
      "id": "usr_01H8XQ", "email": "jane@company.com", "fullName": "Jane Cooper",
      "company": "Northwind Energy", "path": null, "createdAt": "2026-08-12T06:30:00Z"
    },
    "tokens": { "accessToken": "ey...", "refreshToken": "ey...", "expiresIn": 3600, "tokenType": "Bearer" }
  }
}
```

Errors: `409` email taken · `422` field validation.

### `POST /auth/login` — _public_

Request: `{ "email": "jane@company.com", "password": "s3cret-pass" }`

`200 OK`: same shape as signup.

Errors: `401` bad credentials · `422` malformed fields.

> Return `401` with a **generic** message for both unknown-email and wrong-password
> so the endpoint cannot be used to enumerate accounts.

### `POST /auth/refresh` — _public_

Request: `{ "refreshToken": "ey..." }`

`200 OK`:
```json
{ "data": { "accessToken": "ey...", "refreshToken": "ey...", "expiresIn": 3600, "tokenType": "Bearer" } }
```

Errors: `401` invalid/revoked refresh token.

### `GET /auth/me`

`200 OK`: `{ "data": { "id": "...", "email": "...", "fullName": "...", "company": "...", "path": "land_owner", "createdAt": "..." } }`

Errors: `401`.

### `PUT /auth/path`

Records the "Choose Your Path" selection.

Request: `{ "path": "land_owner" }`
`path` ∈ `land_owner` | `gpu_renter` | `investor` | `hyperscaler`

`200 OK`: the updated `User`. Errors: `401` · `422` unknown path.

### `POST /auth/logout`

`204 No Content`. Should revoke the refresh token. The client clears local state
regardless of the response.

---

## 3. Land Owner Assessment

> ⚠ **BREAKING CHANGE — 2026-08-12.** This section was rewritten after the full
> screen set became available. The flow is **five steps**, not three.
>
> | Change | Detail |
> |---|---|
> | Added | Step 4 `facilities` — was missing entirely |
> | Added | `powerCapacity.substationDistance`, `powerCapacity.voltage` |
> | Renamed | `landProfile.areaHectares` → `areaAcres` (the UI asks for acres) |
> | Removed | `landProfile.hasGridAccess`, `powerCapacity.availableMw`, `powerCapacity.hasSubstation`, `powerCapacity.leadTimeMonths` — none appear in the design |
> | Reshaped | `/assessments/preview` now accepts a **partial** draft and returns a **partial** result |
> | Reshaped | `AssessmentResult` — see § 3.3 |
>
> The five steps are: Land Profile → Power Capacity → Energy Source →
> Facilities & Infrastructure → Assessment Report.

### 3.0 Enums

| Field | Values |
|---|---|
| `landUse` | `greenfield` · `brownfield` · `industrial` · `agricultural` |
| `gridTier` | `sub_10mw` · `10_50mw` · `50_200mw` · `over_200mw` |
| `substationDistance` | `on_site` · `under_1km` · `1_5km` · `over_5km` |
| `voltage` | `under_66kv` · `66_138kv` · `138_345kv` · `over_345kv` |
| `energyMix` | `standard_grid` · `renewable_100` · `hybrid` |
| `buildingClassification` | `none` · `warehouse` · `industrial` · `office` · `purpose_built` |
| `fiberProximity` | `on_site` · `under_1km` · `1_5km` · `over_5km` · `unknown` |

### 3.1 `POST /assessments/preview` — _public_

Drives the **Live Output** panel on **every** step. Called (debounced 350ms) on
each change, so it must be fast, cacheable and side-effect free.

The request is a **partial draft** — whatever the user has filled in so far:

```json
{
  "landProfile": { "areaAcres": 455, "landUse": "industrial" },
  "powerCapacity": { "gridTier": "10_50mw", "substationDistance": "under_1km", "voltage": "138_345kv" },
  "energySource": { "energyMix": "renewable_100", "ppaAvailable": true },
  "facilities": { "buildingSqft": 0, "buildingClassification": "none", "fiberProximity": "under_1km" }
}
```

The response is **also partial**. Return a metric **only** once its step has
enough input; omit it otherwise.

```json
{
  "data": {
    "landViabilityScore": 87,
    "landFactors": [
      { "label": "Size Factor", "value": "+42" },
      { "label": "Zoning Multiplier", "value": "1.5x" }
    ],
    "mwDensity": 0.07,
    "infrastructureCapexUsd": 41400000,
    "capexBreakdown": { "substation": "estimated", "transmission": "pending" },
    "esgScore": "A-",
    "esgPercent": 82,
    "carbonFootprintTco2e": 12.4,
    "renewableRatioPercent": 100,
    "facilityReadiness": 48,
    "projectedPue": 1.2,
    "rackDensityKw": 40,
    "networkCapacity": "400 Gbps"
  }
}
```

| Field | Step | Notes |
|---|---|---|
| `landViabilityScore` | 1 | 0–100 |
| `landFactors[]` | 1 | Pre-formatted labels/values for the two contribution bars |
| `mwDensity` | 2 | Megawatts per acre |
| `infrastructureCapexUsd` | 2 | Raw USD; the UI formats it as `$41.4M` |
| `capexBreakdown` | 2 | Per-component: `pending` · `estimated` · `confirmed` |
| `esgScore` / `esgPercent` | 3 | Letter grade inside the ring; percent drives the arc |
| `facilityReadiness` | 4 | 0–100 |
| `projectedPue` | 4 | e.g. `1.15` |
| `rackDensityKw` | 4 | kW per rack |
| `networkCapacity` | 4 | Pre-formatted, e.g. `"400 Gbps"` |

> **Omission is meaningful.** The UI renders an em-dash for any absent metric.
> Do not send `0` or `null` as a placeholder — that would display as a real
> measurement of zero.

**The calculation model is yours.** The mock adapter
(`src/services/mock/index.ts`) contains plausible placeholder formulas purely so
the wizard is demonstrable; they carry no engineering authority and should be
replaced, not ported.

### 3.2 `POST /assessments`

Request — all five input steps, complete:

```json
{
  "landProfile": { "areaAcres": 455, "landUse": "industrial", "location": "Can Tho, Vietnam" },
  "powerCapacity": { "gridTier": "10_50mw", "substationDistance": "under_1km", "voltage": "138_345kv" },
  "energySource": { "energyMix": "renewable_100", "ppaAvailable": true },
  "facilities": { "buildingSqft": 120000, "buildingClassification": "warehouse", "fiberProximity": "under_1km" }
}
```

`location` is optional; every other field is required.

`201 Created` → an `AssessmentResult` (§ 3.3).

Errors: `422` field validation.

> **No authentication required.** Per the product decision on 2026-08-12 the
> assessment is open to anonymous visitors; sign-up is prompted only when the
> PDF report is downloaded. Rate-limit this endpoint accordingly.

### 3.3 `GET /assessments/{id}`

`200 OK`:
```json
{
  "data": {
    "id": "asm_7f21c",
    "status": "complete",
    "viabilityScore": 78,
    "viabilityLabel": "Status: Favorable",
    "mwDensityRange": "10-50",
    "timelineMonths": "14-18",
    "capexEstimateUsd": 42000000,
    "risks": [
      {
        "title": "Grid Interconnection Delays",
        "body": "Local utility grid required for loads exceeding 20MW…",
        "severity": "high"
      }
    ],
    "reportUrl": "https://…/asm_7f21c.pdf",
    "createdAt": "2026-08-12T06:30:00Z"
  }
}
```

| Field | Notes |
|---|---|
| `viabilityScore` | 0–100, rendered as `78/100` |
| `viabilityLabel` | Chip text under the score, e.g. `"Status: Favorable"` |
| `mwDensityRange` | Pre-formatted range string, e.g. `"10-50"` |
| `timelineMonths` | Pre-formatted range in months, e.g. `"14-18"` |
| `capexEstimateUsd` | Raw USD; the UI formats it as `$42M` |
| `risks[].severity` | `low` · `medium` · `high` — drives the badge colour |
| `reportUrl` | **Omit until the PDF exists.** The download button stays disabled while absent, rather than downloading an empty file. |

Errors: `403` not owner · `404`.

---

## 4. GPU Cluster Booking

### `GET /gpu-models` — _public_

Catalogue for the GPU Hardware step.

`200 OK`:
```json
{ "data": [ { "id": "h100_sxm", "name": "NVIDIA H100 SXM", "vramGb": 80, "hourlyRateUsd": 3.25, "available": true } ] }
```

### `POST /bookings/quote`

Live cost estimate while the wizard is in progress. Accepts a **partial**
submission — any step may still be empty.

Request:
```json
{
  "gpuHardware": { "gpuModelId": "h100_sxm", "gpuCount": 64 },
  "scaleDeployment": { "region": "apac_southeast", "commitment": "annual", "startDate": "2026-10-01", "durationMonths": 12 }
}
```

`200 OK`:
```json
{
  "data": {
    "id": "qte_9f21", "monthlyCostUsd": 118456, "totalCostUsd": 1421472,
    "effectiveHourlyRateUsd": 2.535, "discountPercent": 22,
    "lineItems": [ { "label": "64 × NVIDIA H100 SXM", "amountUsd": 151840 },
                   { "label": "Commitment discount (22%)", "amountUsd": -33384 } ],
    "validUntil": "2026-09-12T00:00:00Z"
  }
}
```

### `POST /bookings`

Request: full `{ workloadType, gpuHardware, scaleDeployment, contact }`.

Enums: `workload` ∈ `training`|`inference`|`fine_tuning`|`rendering` ·
`region` ∈ `us_east`|`us_west`|`eu_central`|`apac_southeast` ·
`commitment` ∈ `on_demand`|`monthly`|`annual`

`201 Created`:
```json
{ "data": { "id": "bkg_11a", "reference": "CP-GPU-1190", "status": "received", "quote": { "…": "…" }, "createdAt": "…" } }
```

`status` ∈ `received`|`in_review`|`approved`|`rejected`

### `GET /bookings/{id}`

`200 OK`: `BookingRequestResult`. Errors: `401` · `403` · `404`.

---

## 5. AI Token Investment

### `GET /investments/rate` — _public_

`200 OK`: `{ "data": { "priceUsd": 2.418, "change24hPercent": 3.62, "updatedAt": "…" } }`

### `POST /investments/kyc-documents`

`multipart/form-data`, single field `file`. Max 10 MB, `image/jpeg`,
`image/png`, `application/pdf`.

`201 Created`:
```json
{ "data": { "id": "doc_88f", "fileName": "passport.pdf", "sizeBytes": 482913, "uploadedAt": "…" } }
```

Errors: `413` too large · `415` unsupported type · `422`.

### `POST /investments`

Request:
```json
{
  "volume": { "amountUsd": 25000, "tokenQuantity": 10339 },
  "paymentMethod": { "method": "bank_transfer" },
  "kyc": { "fullName": "Jane Cooper", "dateOfBirth": "1990-04-12", "country": "VN",
           "documentType": "passport", "documentNumber": "P1234567",
           "documentUploadIds": ["doc_88f"] }
}
```

Enums: `method` ∈ `bank_transfer`|`card`|`crypto` ·
`documentType` ∈ `passport`|`national_id`|`drivers_license`

`201 Created`:
```json
{ "data": { "id": "inv_44c", "reference": "CP-INV-2210", "status": "processing",
            "amountUsd": 25000, "tokenQuantity": 10339, "kycStatus": "pending", "createdAt": "…" } }
```

`status` ∈ `pending_payment`|`processing`|`confirmed`|`failed` ·
`kycStatus` ∈ `not_started`|`pending`|`approved`|`rejected`

> The frontend never handles a full card number. If card payment is enabled, the
> backend must return a hosted-checkout URL or a client secret; only `cardLast4`
> is ever stored in frontend state.

### `GET /investments/{id}`

`200 OK`: `InvestmentResult`.

---

## 6. Hyperscale Data Center

### `POST /hyperscale-requests`

Request:
```json
{
  "projectStage": { "stage": "site_selected" },
  "capacityCooling": { "itLoadMw": 80, "cooling": "liquid_immersion", "targetPue": 1.15 },
  "geographyTimeline": { "country": "VN", "region": "Mekong Delta", "targetOnlineDate": "2028-01-01", "latencyCritical": true },
  "rfpConsultation": { "fullName": "Jane Cooper", "email": "jane@company.com", "company": "Northwind",
                       "role": "Head of Infrastructure", "requirements": "…", "requestConsultation": true }
}
```

Enums: `stage` ∈ `concept`|`site_selected`|`permitted`|`under_construction` ·
`cooling` ∈ `air`|`liquid_immersion`|`direct_to_chip`|`hybrid`

`201 Created`:
```json
{ "data": { "id": "hyp_02b", "reference": "CP-HYP-0302", "status": "received",
            "consultationAt": null, "createdAt": "…" } }
```

`status` ∈ `received`|`in_review`|`scheduled`

### `GET /hyperscale-requests/{id}`

`200 OK`: `HyperscaleResult`.

---

## 7. Dashboard

### `GET /dashboard/summary`

Backs the Overview screen. The design (Figma node 2:1480) shows a welcome block
and exactly three KPI cards, so the response is shaped to those three cards
rather than a generic list.

`200 OK`:
```json
{
  "data": {
    "greetingName": "Jane",
    "systemMessage": "System optimal. Your compute clusters are operating at peak efficiency.",
    "activeProjects": { "count": 3, "statusLabel": "Active", "detail": "Across 2 regions" },
    "gpuUsage": { "percent": 64 },
    "tokenBalance": { "amount": 12400, "symbol": "CPT", "weeklyDelta": 450 }
  }
}
```

| Field | Notes |
|---|---|
| `greetingName` | First name only — rendered in accent inside "Welcome back, {name}" |
| `systemMessage` | Free-text status line; the frontend does not compose it |
| `activeProjects.statusLabel` | Text of the accent chip, e.g. "Active" |
| `activeProjects.detail` | Dim caption beside the chip |
| `gpuUsage.percent` | `0–100`; drives both the figure and the progress bar |
| `tokenBalance.amount` | Raw number — the frontend applies thousands separators |
| `tokenBalance.symbol` | Ticker, rendered smaller and dimmed |
| `tokenBalance.weeklyDelta` | Signed; rendered as "+450 this week" |

Errors: `401`.

### `GET /requests/{reference}/receipt`

Backs the shared "Request Received" screen for all four flows.

`200 OK`:
```json
{
  "data": {
    "reference": "CP-GPU-1190", "kind": "booking", "title": "Request Received",
    "message": "Your cluster request is queued for capacity review.",
    "nextSteps": ["Capacity confirmed within 1 business day.", "…"],
    "submittedAt": "…"
  }
}
```

Errors: `401` · `403` · `404`.

---

## 8. Leads (marketing contact forms)

Not part of the original Figma file — added with the extended marketing
sections. Used by the contact form on Energy & Land and Buy GPU.

### `POST /leads` — _public_

Request:
```json
{
  "fullName": "Jane Cooper",
  "email": "jane@company.com",
  "company": "Northwind Energy",
  "interest": "land_owner",
  "message": "120ha parcel in Can Tho, grid agreement in place.",
  "source": "/energy-land"
}
```

`interest` ∈ `land_owner` | `gpu_renter` | `investor` | `hyperscaler` —
the same enum as `PUT /auth/path`. `company`, `message` and `source` are
optional; `source` is the route the form was submitted from, for attribution.

`201 Created`:
```json
{
  "data": {
    "id": "lead_9f2a",
    "reference": "CP-LEAD-4417",
    "status": "received",
    "createdAt": "2026-08-12T06:30:00Z"
  }
}
```

`reference` is shown back to the user on the success screen, so it must be
human-readable and safe to quote over email.

Errors: `422` field validation · `429` rate limited.

> This endpoint is public and unauthenticated, so it **must** be rate limited
> and spam-protected server-side. The frontend deliberately ships no captcha —
> tell us which provider you use and we will wire it in.

---

## 9. Sales pipeline — _staff only_

Backs the internal Kanban board at `/dashboard/sales`.

> ⚠ **Every endpoint in this section must reject non-staff tokens with `403`.**
> The frontend hides the UI from customers, but that is a convenience, not a
> control — anyone can call these paths directly with a valid customer token.
> Authorise on `role`, server-side, on every request.

### 9.1 Role on the user object

`User` gained an optional `role` (§ 2):

```json
{ "id": "usr_01H8XQ", "email": "…", "fullName": "…", "role": "sales" }
```

`role` ∈ `customer` | `sales` | `admin`. **Omit it, or send `customer`, for
customer accounts** — the frontend treats a missing role as `customer`, never
as staff.

`path` (the product track) and `role` are independent: a sales rep has a role
and no path.

### 9.2 Cards are created by you, not by the client

There is **no create endpoint**, deliberately.

When a customer completes a flow, create the deal card **in the same
transaction** that stores the submission:

| Flow | Trigger |
|---|---|
| Land Owner Assessment | `POST /assessments` |
| GPU Cluster Booking | `POST /bookings` |
| AI Token Investment | `POST /investments` |
| Hyperscale | `POST /hyperscale-requests` |
| Lead form / Submit Request | `POST /leads` |

Two separate writes would let the submission succeed while the card fails,
leaving a real customer that no one in sales can see. New cards start in the
`lead` column.

### 9.3 `GET /sales/columns`

```json
{
  "data": [
    { "id": "lead", "title": "Lead", "order": 0, "color": "#94a3b8" },
    { "id": "negotiation", "title": "Negotiation", "order": 3, "color": "#fb923c", "cardLimit": 8 }
  ]
}
```

Served from the database rather than hard-coded so sales ops can change the
pipeline without a deploy. `id` ∈ `lead` | `qualified` | `proposal` |
`negotiation` | `won` | `lost`. `cardLimit` is an optional WIP cap.

### 9.4 `GET /sales/cards`

Returns every card the caller may see. List payload — keep it light; notes and
full submission answers belong in § 9.5.

```json
{
  "data": [
    {
      "id": "deal_01",
      "title": "Northwind Energy — 120ha greenfield",
      "columnId": "lead",
      "order": 0,
      "createdAt": "…", "updatedAt": "…",
      "source": "assessment",
      "reference": "CP-ASM-4821",
      "companyName": "Northwind Energy",
      "contactName": "Jane Cooper",
      "email": "jane@northwind.example",
      "phone": "+1 555-0142",
      "dealValueUsd": 4820000,
      "probability": 45,
      "closeDate": "2026-11-30",
      "ownerId": "usr_sales_02",
      "submissionId": "asm_7f21c",
      "highlights": [
        { "label": "Viability", "value": "78/100" },
        { "label": "Capacity", "value": "10-50 MW" }
      ]
    }
  ]
}
```

| Field | Notes |
|---|---|
| `columnId` | The stage. Named this way because the board library requires the key. |
| `order` | Position within the column. Sent by the client on move; you own the reconciliation. |
| `source` | `assessment` · `booking` · `investment` · `hyperscale` · `lead_form`. Drives the badge and the filter. |
| `reference` | The same human-readable reference the customer sees. |
| `dealValueUsd` | Raw USD. Omit when the flow produced no figure — do **not** send `0`, which displays as a real zero-value deal. |
| `probability` | 0–100. Owned by sales, not by the wizard. Omit until set. |
| `submissionId` | Lets sales open the original answers instead of re-asking the customer. |
| `highlights` | Pre-formatted key figures lifted from the submission. Three are shown on the card; the rest appear in the panel. |

### 9.5 `GET /sales/cards/{id}`

The full record, including `notes` and any heavier fields the list omits. Same
shape as § 9.4.

### 9.6 `PATCH /sales/cards/{id}`

Sales-owned fields only:

```json
{ "probability": 60, "closeDate": "2026-11-30", "notes": "Call booked for Thursday." }
```

Also accepts `title`, `ownerId` and `dealValueUsd`. Returns the updated card.

**Reject attempts to modify customer-submitted data** (`contactName`, `email`,
`source`, `reference`, `submissionId`) — the board is a working surface, not a
place to rewrite what a customer told us.

### 9.7 `POST /sales/cards/{id}/move`

```json
{ "toColumnId": "qualified", "order": 2 }
```

Separate from `PATCH` so sibling reordering happens in one transaction. Returns
the updated card.

Errors: `409` when the destination column is at its `cardLimit` — the board
surfaces this as a rejected drop and reverts the card.

### 9.8 Deletion

Not implemented, and it should stay that way. A deal that came from a real
submission belongs in `lost`, not erased — deleting it destroys the audit trail
linking a customer's request to its outcome.

---

## 10. Notes for the backend team

1. **CORS** — allow the frontend origin with `Authorization` on the allowed-headers
   list, and permit `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
2. **Field names in `details` must match request body keys** or inline validation
   messages will not attach to the right input.
3. **Enum values are contractual.** They map to radio cards in the UI; adding a
   value requires a matching design change, so please raise it before shipping.
4. **`/assessments/preview` and `/bookings/quote` are called on keystroke/toggle.**
   Keep them cheap, cache-friendly, and free of writes.
5. **Pagination** is not yet used by any screen. When a list grows, the client
   expects `{ items, page, pageSize, total, hasNext }` (see `models/common.ts`).
6. If you must change a path or shape, update `src/services/endpoints.ts` and the
   matching interface in `src/models/` — nothing else in the app needs to change.
