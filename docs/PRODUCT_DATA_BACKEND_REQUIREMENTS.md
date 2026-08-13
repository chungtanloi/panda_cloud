# Product data backend requirements

This file records frontend integration needs only. It is **not** an API contract
and does not define endpoint paths. The pinned backend OpenAPI artifact remains
the sole source of truth.

## Data ownership

Static frontend configuration may contain headings, explanatory marketing copy,
CTA labels and layout metadata. It must not contain production catalog records,
prices, stock, capacity, lead times, financing rates, limits or regional site
availability.

The browser calls the versioned HTTPS gateway. The gateway reads the database;
the frontend never connects to the database directly.

## Operations already consumed

- GPU rental and purchase model/spec/stock discovery: backend `listGpuModels`
  operation (`GET /gpu-models` in the transitional operation map).
- Energy and land regional capacity: backend `listRegions` operation
  (`GET /hyperscale/regions` in the transitional operation map).

## OpenAPI operations still required

The backend must publish approved operations and schemas for these UI sections
before they can display production data:

- GPU purchase catalog: purchase price or quote mode, currency, purchasable
  configurations, stock, lead time and availability status.
- Infrastructure inventory: component identity, category, specifications,
  availability, lead-time value, quote eligibility and pagination/filter fields.
- Financing catalog: product identity, description, status, applicable terms,
  currency/limits and eligibility metadata.
- Financing calculator inputs/results: backend-provided bounds, rate/fee inputs,
  repayment estimate and disclaimer/version metadata. The frontend must not
  invent or independently own financial calculations.

Until those operations exist in the pinned OpenAPI release, the affected UI must
fail closed with a clear unavailable state instead of presenting design samples
as live product data.

## Production safety

Deployment configuration must use `NEXT_PUBLIC_API_ADAPTER=http` and a
`NEXT_PUBLIC_API_BASE_URL` ending in `/api/v1`. The mock adapter is retained only
for local UI development and automated frontend tests.
