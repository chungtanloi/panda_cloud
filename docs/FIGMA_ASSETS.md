# Figma assets — pending export

Icons and imagery in this design are **exported SVG/PNG assets**, not an icon
font. Figma's MCP asset URLs expire after roughly 7 days, and the session that
generated this code had no shell access, so those files could not be downloaded
and committed automatically.

Anything listed below currently renders a clearly-marked placeholder or is
omitted. Redrawing these by hand would produce the wrong glyph, so they are
tracked here instead of guessed at.

## How to export

1. Open the node in Figma (`https://www.figma.com/design/pCxGT1lfFqO2CiDXEmrTk7/Untitled?node-id=<id>`,
   replacing `:` with `-` in the id).
2. Select the frame → Export → SVG (PNG for photographic assets).
3. Save to the path in the table.
4. Replace the placeholder with
   `<img src="/assets/…" alt="" className="…" />`, keeping the explicit width
   and height already present on the container.

Always size icons with **both** width and height on a fixed container — `auto`
lets the intrinsic size blow the layout out.

## Outstanding

| Node | What it is | Save as | Used by |
|---|---|---|---|
| `1:177` | Cloud brand mark (nav, 25.7×18.7) | `public/assets/brand/logo.svg` | `components/layout/BrandMark.tsx` |
| `1:70` | Hero globe visual (552px) | `public/assets/marketing/hero-globe.png` | Landing hero |
| `1:74` | Data center photo (4:3) | `public/assets/marketing/about.png` | Landing about |
| `1:152` | Financing orb (128px) | `public/assets/marketing/financing-orb.png` | Landing bento |
| `1:132` | GPU Renting card icon (27px) | `public/assets/icons/svc-gpu.svg` | `config/landing.ts` |
| `1:105` | Buy Hardware card icon (30×27) | `public/assets/icons/svc-hardware.svg` | `config/landing.ts` |
| `1:118` | Energy & Land card icon (24×30) | `public/assets/icons/svc-energy.svg` | `config/landing.ts` |
| `1:146` | Financing card icon (30px) | `public/assets/icons/svc-financing.svg` | `config/landing.ts` |
| `2:27` | Cluster showcase photo | `public/assets/marketing/cluster.png` | GPU Renting showcase |
| `2:231` | Server racks photo | `public/assets/marketing/server-racks.png` | Buy GPU hero |
| `2:406` | Energy & Land backdrop (20% opacity) | `public/assets/marketing/energy-bg.png` | Energy & Land page |
| `2:237`, `2:256`, `2:275` | Buy GPU card icons (~22px) | `public/assets/icons/buy-*.svg` | `config/buyGpu.ts` |
| `2:52` | H100 card icon (18px) | `public/assets/icons/gpu-h100.svg` | `config/gpuRenting.ts` |
| `2:88` | H200 card icon (20×16) | `public/assets/icons/gpu-h200.svg` | `config/gpuRenting.ts` |
| `2:120` | B200 card icon (20px) | `public/assets/icons/gpu-b200.svg` | `config/gpuRenting.ts` |
| `2:154`, `2:159`, `2:164`, `2:169` | Platform advantage icons | `public/assets/icons/adv-*.svg` | GPU Renting advantages |
| `2:967` | Brand mark beside the wordmark | `public/assets/brand/logo.svg` | `components/layout/Logo.tsx` |
| `2:888` | Starfield / atmospheric photo | `public/assets/backgrounds/atmospheric.png` | Sign Up (currently CSS-only) |
| `2:1442` | Overview nav icon (18px) | `public/assets/icons/nav-overview.svg` | `components/dashboard/Sidebar.tsx` |
| `2:1447` | Projects nav icon (20×16) | `public/assets/icons/nav-projects.svg` | `components/dashboard/Sidebar.tsx` |
| `2:1452` | GPU Clusters nav icon (18px) | `public/assets/icons/nav-clusters.svg` | `components/dashboard/Sidebar.tsx` |
| `2:1457` | Portfolio nav icon (20px) | `public/assets/icons/nav-portfolio.svg` | `components/dashboard/Sidebar.tsx` |
| `2:1462` | Wallet nav icon (19×18) | `public/assets/icons/nav-wallet.svg` | `components/dashboard/Sidebar.tsx` |
| `2:1467` | Transactions nav icon (18×20) | `public/assets/icons/nav-transactions.svg` | `components/dashboard/Sidebar.tsx` |
| `2:1474` | Default user avatar | `public/assets/brand/avatar-default.png` | `components/dashboard/Sidebar.tsx` |
| `2:1506` | Active Projects KPI icon (21.5×16) | `public/assets/icons/kpi-projects.svg` | `components/dashboard/KpiCard.tsx` |
| `2:1520` | GPU Usage KPI icon (18px) | `public/assets/icons/kpi-gpu.svg` | `components/dashboard/KpiCard.tsx` |
| `2:1533` | Token Balance KPI icon (22×16) | `public/assets/icons/kpi-token.svg` | `components/dashboard/KpiCard.tsx` |
| `2:1540` | Trend arrow (11.7×7) | `public/assets/icons/trend-up.svg` | Dashboard token card |
| `2:1055` | Energy Mix card icon (16×20) | `public/assets/icons/energy-mix.svg` | Assessment step 3 |
| `2:1065` | Standard Grid option icon | `public/assets/icons/grid-standard.svg` | Assessment step 3 |
| `2:1076` | 100% Renewable option icon | `public/assets/icons/grid-renewable.svg` | Assessment step 3 |
| `2:1087` | Hybrid Mix option icon | `public/assets/icons/grid-hybrid.svg` | Assessment step 3 |
| `2:1097` | PPA card icon (18×20) | `public/assets/icons/ppa.svg` | Assessment step 3 |
| `2:1111` | Live Output icon (10.5px) | `public/assets/icons/live-output.svg` | Assessment preview panel |
| `2:1130` | Carbon footprint icon | `public/assets/icons/carbon.svg` | Assessment preview panel |
| `2:1138` | Renewable ratio icon | `public/assets/icons/renewable.svg` | Assessment preview panel |

## Deliberately hand-drawn

These are plain geometric strokes, not brand glyphs, so they are inlined as SVG
and need no export:

- Back / forward arrows — `components/wizard/WizardShell.tsx`
- Log In and Sign Up submit arrows — auth pages
- Search magnifier and notification bell — `components/dashboard/DashboardHeader.tsx`
- Loading spinners — `components/ui/states.tsx`
