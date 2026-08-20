# Site Inspection Frontend Documentation Map

**Status:** Proposed frontend documentation entry point

**Suite revision:** 1.2

## 1. Frontend-owned sources

| Document | Frontend authority |
|---|---|
| [SITE_INSPECTION_UX_FRONTEND_SPEC.md](SITE_INSPECTION_UX_FRONTEND_SPEC.md) | Routes, guards, components, state ownership, responsive behavior, accessibility, customer/reviewer/admin UX, and customer-safe language. |
| [SITE_INSPECTION_MOCK_DEMO_SPEC.md](SITE_INSPECTION_MOCK_DEMO_SPEC.md) | Deterministic full-journey mock, local evidence preview, scenario controls, persistence, latency, disclosure, and mock-to-HTTP compatibility. |
| [SITE_INSPECTION_FE_DEVELOPMENT_GUIDE.md](SITE_INSPECTION_FE_DEVELOPMENT_GUIDE.md) | Executable FE demo and HTTP-integration tasks, dependencies, estimates, acceptance and handoff evidence. |

These documents may describe required data and proposed service interfaces, but they do not authorize HTTP endpoints or response shapes.

## 2. Backend-owned sources

The following authoritative documents live in the sibling `PandaCloudBackend` repository:

| Backend path | Authority |
|---|---|
| `docs/business/AI_ASSISTED_SITE_INSPECTION_SPEC.md` | Canonical product scope, claims, actors, lifecycle, verdict rules, and stable requirement IDs. |
| `docs/architecture/SITE_INSPECTION_BACKEND_API_DATA_SPEC.md` | Proposed backend services, HTTP operations, authorization, transactions, jobs, events, and data dictionary. |
| `docs/architecture/SITE_INSPECTION_AI_STANDARDS_EVALUATION_SPEC.md` | AI provider boundary, standards governance, output validation, safety, and evaluation. |
| `docs/architecture/SITE_INSPECTION_SECURITY_PRIVACY_OPERATIONS.md` | Security, privacy, evidence lifecycle, observability, incidents, capacity, and SLA controls. |
| `docs/collaboration/SITE_INSPECTION_QA_ACCEPTANCE_PLAN.md` | Cross-system traceability, integration/security/AI gates, and pilot acceptance. |
| `docs/collaboration/SITE_INSPECTION_DELIVERY_RUNBOOK.md` | Cross-repository dependency order, demo schedule, production phases, and handoff. |
| `docs/collaboration/SITE_INSPECTION_DOCUMENTATION_MAP.md` | Full ownership, change-routing, and anti-drift rules. |
| `docs/collaboration/SITE_INSPECTION_DEVELOPMENT_WORKFLOW.md` | Shared board states, WIP, task readiness, daily coordination, contract handoff and completion gates. |
| `docs/collaboration/SITE_INSPECTION_BE_DEVELOPMENT_GUIDE.md` | Executable backend task backlog, dependency chain, transaction/recovery expectations and acceptance. |

The released backend-owned OpenAPI artifact is the only production HTTP contract authority. Proposed API descriptions are requirements input.

## 3. Frontend implementation order

1. Confirm product requirement IDs and customer-safe terminology from the backend canonical specification.
2. Follow [the FE Development Guide](SITE_INSPECTION_FE_DEVELOPMENT_GUIDE.md) and backend master workflow for task readiness, order and handoff.
3. Implement models and `SiteInspectionService`, `InspectionReviewService`, and `InspectionProfileAdminService` boundaries.
4. Implement both mock and HTTP adapters against identical frontend interfaces; HTTP work waits for a pinned generated client.
5. Build routes and controller-owned state from the UX specification.
6. Build the disclosed deterministic demo from the mock specification.
7. Run frontend component, accessibility, responsive, and mock scenario tests.
8. Switch to Integration only through the pinned client; do not add component-level transport code.

## 4. Change routing

- UI-only behavior changes start in the frontend UX specification.
- Mock-only behavior changes start in the frontend mock/demo specification.
- Endpoint, DTO, authorization, data, AI, security, retention, or server verdict changes start in the backend repository.
- Any change that affects both repositories follows the backend collaboration workflow and requires FE/BE owner review.
- Never copy backend OpenAPI or data dictionaries into this repository; link by repository-qualified path and pin released artifacts.
