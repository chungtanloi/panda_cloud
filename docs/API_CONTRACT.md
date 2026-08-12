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

### `POST /assessments/preview`

Drives the **Live Output** panel on step 3. Called on every change to the energy
mix or PPA toggle, so it must be fast and side-effect free.

Request:
```json
{ "energyMix": "renewable_100", "ppaAvailable": true, "availableMw": 48.2 }
```
`energyMix` ∈ `standard_grid` | `renewable_100` | `hybrid`

`200 OK`:
```json
{
  "data": {
    "esgScore": "A-", "esgPercent": 82,
    "carbonFootprintTco2e": 12.4, "renewableRatioPercent": 100
  }
}
```

`esgScore` is a letter grade shown inside the ring. `esgPercent` (0–100) drives
the arc length.

### `POST /assessments`

Request:
```json
{
  "landProfile": { "location": "Can Tho, Vietnam", "areaHectares": 120, "landUse": "greenfield", "hasGridAccess": true },
  "powerCapacity": { "availableMw": 48.2, "gridTier": "10_50mw", "hasSubstation": true, "leadTimeMonths": 14 },
  "energySource": { "energyMix": "renewable_100", "ppaAvailable": true }
}
```

Enums: `landUse` ∈ `greenfield`|`brownfield`|`industrial`|`agricultural` ·
`gridTier` ∈ `sub_10mw`|`10_50mw`|`50_200mw`|`over_200mw`

`201 Created`:
```json
{
  "data": {
    "id": "asm_7f21c", "status": "complete",
    "esgScore": "A-", "esgPercent": 82,
    "carbonFootprintTco2e": 12.4, "renewableRatioPercent": 100,
    "estimatedAnnualRevenueUsd": 4820000,
    "recommendations": ["Secure a long-term PPA…"],
    "createdAt": "2026-08-12T06:30:00Z"
  }
}
```

Errors: `401` · `422`.

### `GET /assessments/{id}`

`200 OK`: same `AssessmentResult`. Errors: `401` · `403` not owner · `404`.

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

## 9. Notes for the backend team

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
