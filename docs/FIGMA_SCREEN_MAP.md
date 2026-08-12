# Figma → Route map

Source file: `pCxGT1lfFqO2CiDXEmrTk7` ("Untitled")
Open a node directly: `https://www.figma.com/design/pCxGT1lfFqO2CiDXEmrTk7/Untitled?node-id=<id>`
(replace `:` with `-` in the node id, e.g. `2:1020` → `2-1020`)

**Status legend:** ✅ built · 🟡 foundation only · ⬜ not started

## Marketing / public

| Screen | Node | Route | Status |
|---|---|---|---|
| Home (Html → Body) | `1:2` | `/` | ✅ images pending export |
| GPU Renting | `2:2` | `/gpu-renting` | ✅ images pending export |
| Buy GPU | `2:218` | `/buy-gpu` | ✅ images pending export |
| Energy & Land | `2:379` | `/energy-land` | ✅ backdrop photo pending export |
| Financing | `2:531` | `/financing` | ⬜ |
| Infrastructure | `2:700` | `/infrastructure` | ⬜ |
| Html → Body (variant) | `2:2397` | — to identify | ⬜ |
| Html → Body (variant) | `2:2932` | — to identify | ⬜ |

## Auth

| Screen | Node | Route | Status |
|---|---|---|---|
| Log In | `2:930` | `/login` | ✅ |
| Sign Up | `2:887` | `/signup` | ✅ |
| Choose Your Path | `2:961` | `/choose-path` | ✅ |

## Land Owner Assessment

| Screen | Node | Route | Status |
|---|---|---|---|
| Intro | `2:1152` | `/assessment` | ⬜ |
| Step 1 — Land Profile | `2:1325` | `/assessment/land-profile` | ⬜ |
| Step 2 — Power Capacity | `2:1207` | `/assessment/power-capacity` | ⬜ |
| Step 3 — Energy Source | `2:1020` | `/assessment/energy-source` | 🟡 tokens + shell extracted |
| Results | `2:1545` | `/assessment/results` | ⬜ |

## GPU Cluster Booking

| Screen | Node | Route | Status |
|---|---|---|---|
| Intro | `2:1969` | `/booking` | ⬜ |
| Step 1 — Workload Type | `2:1664` | `/booking/workload` | ⬜ |
| Step 2 — GPU Hardware | `2:2041` | `/booking/hardware` | ⬜ |
| Step 3 — Scale & Deployment | `2:2547` | `/booking/scale` | ⬜ |
| Step 4 — Submit Request | `2:2242` | `/booking/submit` | ⬜ |
| Step 5 — Quote & Next Steps | `2:2697` | `/booking/quote` | ⬜ |

## AI Token Investment

| Screen | Node | Route | Status |
|---|---|---|---|
| Intro | `2:2824` | `/investment` | ⬜ |
| Step 2 — Volume | `2:3143` | `/investment/volume` | ⬜ |
| Step 3 — Payment Method | `2:3010` | `/investment/payment` | ⬜ |
| Step 4 — KYC Verification | `2:3237` | `/investment/kyc` | ⬜ |
| Step 5 — Confirmation | `2:3383` | `/investment/confirmation` | ⬜ |

> Step 1 of this flow was not found as a separate top-level frame — it may be
> part of the intro screen (`2:2824`). Confirm before building.

## Hyperscale Data Center

| Screen | Node | Route | Status |
|---|---|---|---|
| Intro | `2:3520` | `/hyperscale` | ⬜ |
| Step 1 — Project Stage | `2:3769` | `/hyperscale/stage` | ⬜ |
| Step 2 — Capacity & Cooling | `2:3681` | `/hyperscale/capacity` | ⬜ |
| Step 3 — Geography & Timeline | `2:3901` | `/hyperscale/geography` | ⬜ |
| Step 4 — RFP & Consultation | `2:4122` | `/hyperscale/rfp` | ⬜ |

## Dashboard / shared

| Screen | Node | Route | Status |
|---|---|---|---|
| Dashboard Overview | `2:1434` | `/dashboard` | ✅ icons pending export |
| Request Received | `2:1809` | `/requests/[reference]` | ⬜ |

---

## Shared components observed in the design

| Component | Example node | Implemented as |
|---|---|---|
| TopNavBar | `1:174`, `2:195`, `2:844` | `components/layout/TopNavBar.tsx` ✅ |
| Footer | `1:153`, `2:173`, `2:866` | `components/layout/Footer.tsx` ✅ |
| Marketing bento card | `1:103`, `1:129`, `1:143` | `components/marketing/BentoCard.tsx` ✅ |
| Progress header + stepper | `2:1033` | `components/wizard/ProgressHeader.tsx` ✅ |
| Wizard page frame | `2:1031` | `components/wizard/WizardShell.tsx` ✅ |
| Glass section card | `2:1052` | `components/ui/Card.tsx` ✅ |
| Radio option card | `2:1061`, `2:1072` | `components/ui/SelectableCard.tsx` ✅ |
| Toggle switch | `2:1103` | `components/ui/Toggle.tsx` ✅ |
| Text input + label | `2:944` | `components/ui/Field.tsx` ✅ |
| Primary / secondary button | `2:1148`, `2:1144`, `2:954` | `components/ui/Button.tsx` ✅ |
| ESG score ring | `2:1122` | `components/ui/ScoreGauge.tsx` ✅ |
| Metric chip | `2:1128` | `components/ui/StatRow.tsx` ✅ |
| Ambient background | `2:931`, `2:932` | `components/layout/AmbientBackground.tsx` ✅ |

## Icons

Icons in the design are exported SVG assets, not an icon font. Figma asset URLs
expire after ~7 days, so each screen's icons must be downloaded and committed to
`public/assets/icons/` as that screen is built. Do not hand-author replacement
SVG paths — the glyphs will not match. The two arrows in `WizardShell` and the
Log In button are the sole exception: they are plain geometric strokes.
