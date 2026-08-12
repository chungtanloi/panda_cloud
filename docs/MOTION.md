# Motion

Visual effects added on top of the Figma design at the client's request. They
change **no** colour, size or spacing token — only how elements arrive and
respond to the pointer. If a design update conflicts with anything here, the
design wins.

Brief: **subtle / enterprise** — short durations, small displacement, calm
enough to sit behind repeated daily use.

## Implementation

No animation library. Everything is CSS transitions/keyframes plus
`IntersectionObserver`. Bundle cost is ~2 KB of component code and zero
dependencies.

| Piece | File |
|---|---|
| Keyframes + utility classes | `src/app/globals.css` (motion layer) |
| Reduced-motion helper, figure parser | `src/lib/motion.ts` |
| Scroll reveal | `src/components/motion/Reveal.tsx` |
| Number count-up | `src/components/motion/CountUp.tsx` |
| Cursor spotlight + tilt | `src/components/motion/SpotlightCard.tsx` |
| Drifting orbs + starfield | `src/components/motion/AnimatedBackdrop.tsx` |

## The effects

| Effect | Where | Spec |
|---|---|---|
| Scroll reveal | every marketing section, dashboard KPIs | 12px rise + fade, 400ms, `cubic-bezier(.16,1,.3,1)`, stagger 60–80ms |
| Count-up | landing metrics, Buy GPU prices, Energy & Land specs | 1100ms, ease-out-cubic, fires at 40% visibility |
| Card hover | bento, GPU, hardware, region, KPI cards | 2px lift + accent border + 24px glow, 200ms |
| Cursor spotlight | bento, GPU, hardware, region cards | 320px radial `rgba(0,242,255,.08)`, follows pointer |
| 3D tilt | GPU and hardware cards only | max 4°, 900px perspective |
| Drifting orbs | hero sections | 18s / 26s loops, ±18px, scale 1→1.06 |
| Starfield | hero sections | CSS radial-gradient tile, 90s linear drift |
| Gradient sweep | hero headlines | 200% background, 6s loop |
| Pulse dot | LIVE chips, status badges | 2.4s opacity + ring |
| Shimmer | loading skeletons | 1.8s sweeping highlight |

## Rules

1. **`prefers-reduced-motion` is honoured everywhere.** The media query at the
   bottom of `globals.css` disables CSS animation; `CountUp` checks
   `prefersReducedMotion()` and renders the final value immediately. `.reveal`
   is explicitly forced visible so content can never be stranded at
   `opacity: 0`.
2. **Reveal must not hide content on failure.** If `IntersectionObserver` is
   missing, `Reveal` shows its children at once.
3. **Pointer effects write CSS variables, not React state.** `SpotlightCard`
   sets `--mx` / `--my` directly on the node, so pointer movement never causes
   a re-render.
4. **Count-up is decorative.** The real value is always in the DOM inside an
   `.sr-only` span; the animated text is `aria-hidden`.
5. **Observers disconnect after firing.** Nothing stays subscribed to scroll.
6. **Animate only `transform` and `opacity`** where possible — both are
   compositor-friendly. The two exceptions are the progress-bar widths, which
   are short and infrequent.

## Adding a new effect

Prefer a CSS class in the motion layer. Reach for a client component only when
the effect needs to observe or measure something. Keep durations under 450ms
for anything the user triggers, and under 1200ms for anything ambient.
