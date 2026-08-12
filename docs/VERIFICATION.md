# Verification report

Static audit of the codebase, 2026-08-12.

**What this is not:** the build was never executed in the session that produced
this code — no shell was available — so nothing below is evidence that
`npm run build` succeeds. Everything here was verified by reading the source.
Run the commands in § 5 before trusting the result.

---

## 1. Architecture rules — PASS

The three rules that make the mock/real adapter swap work were checked by
searching the whole of `src/`:

| Rule | Result |
|---|---|
| `process.env` read in exactly one file | ✅ only `services/config.ts` |
| `fetch` called in exactly one file | ✅ only `services/http.ts` |
| No hard-coded API URL outside `services/endpoints.ts` | ✅ the single match is a comment in `services/api.ts` |

Both adapters satisfy `ApiClient`; TypeScript enforces this, so a method added
to one and not the other fails the build rather than failing at runtime.

## 2. Routing — 2 defects found and fixed

All 35 `page.tsx` routes were listed and cross-checked against every internal
`href` in components and config.

**Fixed during this audit:**

| Location | Problem |
|---|---|
| `booking/review` → `/gpu-renting#enquiry` | The GPU Renting page has no `#enquiry` anchor. The "Expert Call" button scrolled nowhere. Now points at `/submit-request`. |
| `assessment/results` → `/energy-land#enquiry` | The anchor did not exist on Energy & Land. Added `id="enquiry"` to its contact section. |

Both were on **primary CTAs**, so they would have failed silently for users
rather than throwing.

**Verified sound:** every other route reference, and the four in-page anchors
(`#calculator`, `#inventory`, `#sites`, `#enquiry` on Financing).

## 3. Next.js App Router constraints — PASS

`useSearchParams` forces a build error without a `Suspense` boundary. All four
call sites are wrapped:

- `(auth)/login`, `(auth)/signup`
- `assessment/results`, `investment/confirmation`

## 4. Dead code — present, not removed

Superseded during the build and never deleted. None of it is imported, so it
costs nothing at runtime, but it will mislead the next reader.

| Path | Why it is dead |
|---|---|
| `src/controllers/useWizard.ts` | Index-based wizard controller. Replaced by route-driven contexts (`AssessmentContext`, `BookingContext`, `createFlowContext`). |
| `src/components/wizard/WizardShell.tsx` | Superseded by `AssessmentChrome` and `FlowChrome`. |
| `src/components/ui/states.tsx` → `EmptyState` | Written for list screens that ended up not existing. |
| `src/config/assessment.ts` → `ASSESSMENT_STEPS` | Only referenced by its own doc comment. |
| `src/models/investment.ts` → `VolumeTier`, `KycProgress` | Modelled, then the screens used simpler shapes. |
| `src/models/hyperscale.ts` → `RfpProcessingLog` | Same. |

Removing them:

```powershell
Remove-Item D:\panda_cloud\src\controllers\useWizard.ts
Remove-Item D:\panda_cloud\src\components\wizard\WizardShell.tsx
```

The unused types and `EmptyState` are single declarations — delete in place.
`npm run typecheck` will confirm nothing referenced them.

## 5. Not verified — you must run these

```powershell
npm run typecheck   # types only
npm run lint        # unused imports, hook dependency rules
npm run build       # the real check: RSC boundaries, prerender, route conflicts
```

`typecheck` passing does **not** imply `build` passing. The build additionally
catches server/client component boundary violations and prerender failures,
neither of which `tsc` sees.

## 6. Design fidelity — known gaps

| Gap | Detail |
|---|---|
| 21 icons and 6 images unexported | Rendered as labelled placeholders. See `docs/FIGMA_ASSETS.md`. |
| Assessment step 4 | Built from the written system report; no design exists. |
| Request Received | Designed here; Figma node 2:1809 was never exported. |
| Hyperscale landing | Not exported. `/hyperscale` redirects to step 1 rather than showing an invented page. |
| Step-header treatments differ | Assessment steps 1, 2 and 3 each use a different header in Figma. Implemented as designed; flagged in `docs/FIGMA_SCREEN_MAP.md` in case it was unintentional drift. |

## 7. Design inconsistencies not copied

Four places where the design contradicted itself. In each, the implementation
does the arithmetically correct thing and the deviation is commented in code.

| Screen | Design showed | Implemented |
|---|---|---|
| Financing calculator | $45,227/mo for $1M over 36mo at "8% APR" — implies ~35% APR | Real amortisation from the stated APR |
| Booking step 3 | $245.60 + $13.00 − $65.00 displayed as $288.48; discount labelled "1y" while the term read "On-demand" | Total equals the sum of its line items; the discount row only appears when a term is selected |
| Investment steps | "1 of 4", "Phase 02/03", "Step 03/04" on consecutive screens | Normalised to 5, per the product owner |
| Hyperscale steps | "STEP 2 OF 4" then "STEP 3 OF 5"; two buttons pointed at a Networking screen that does not exist | Normalised to 4; labels renamed to their real destinations |

## 8. Content deliberately left empty

`SocialProof` renders a visible "pending real content" placeholder instead of
customer logos or testimonials, because none were supplied. Inventing an
endorsement is a legal and trust risk, so the component refuses to fabricate
one. Fill `SOCIAL_PROOF` in `src/config/marketingSections.ts` when the approved
customer list exists.

Financial figures are similarly constrained: no rate, term or residual value is
stated anywhere that the design did not already state it.
