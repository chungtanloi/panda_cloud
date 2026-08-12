/**
 * Central configuration for the site-wide "AI infrastructure" visual layer.
 *
 * This is the ONLY place these enhancements are tuned. Every effect
 * component reads its flag from here instead of hard-coding a boolean, so
 * the whole layer can be switched off (or turned down for a slower device)
 * without touching individual components.
 *
 * None of this changes layout, copy, color tokens, or component behavior —
 * it only controls decorative overlays layered on top of the existing UI.
 * See src/config/circuit.ts for the pre-existing PCB background, which is
 * untouched and simply consumed by CircuitBackground.tsx.
 */

export interface EffectConfig {
  /** Master switch — false disables every effect in this file. */
  enabled: boolean;

  /** Full-viewport interactive circuit-board canvas (src/lib/circuit). */
  circuitBackground: boolean;
  /** Card lift / glow / mouse-follow highlight (SpotlightCard + hover-lift). */
  cardHover: boolean;
  /** "System boot" reveal sequence for sections entering the viewport. */
  scrollReveal: boolean;
  /** Decorative connector strips between major sections. */
  dataFlow: boolean;
  /** Periodic subtle scan-line sweep on key sections. */
  aiScan: boolean;
  /** Small glow ring trailing the cursor on desktop. */
  cursorGlow: boolean;
  /** Slow ambient radial glow behind hero/CTA-adjacent sections. */
  ambientGlow: boolean;
  /** Hero / GPU page infrastructure HUD (GPU cluster, compute, network). */
  infraHud: boolean;

  /** 0–1 global opacity/strength multiplier for every effect above. */
  intensity: number;
  /** 0–2 multiplier applied to animation durations (1 = default speed). */
  speed: number;
  /** Respect prefers-reduced-motion — should stay true outside of testing. */
  reducedMotion: boolean;
  /** Additional intensity multiplier applied at the `md` breakpoint and below. */
  mobileIntensity: number;

  /** Minimum ms between AI-scan sweeps, before random jitter is added. */
  aiScanIntervalMs: number;
  /** Random jitter window added on top of aiScanIntervalMs. */
  aiScanJitterMs: number;
}

export const effectConfig: EffectConfig = {
  enabled: true,

  circuitBackground: true,
  cardHover: true,
  scrollReveal: true,
  dataFlow: true,
  aiScan: true,
  cursorGlow: true,
  ambientGlow: true,
  infraHud: true,

  intensity: 0.75,
  speed: 1,
  reducedMotion: true,
  mobileIntensity: 0.35,

  aiScanIntervalMs: 7000,
  aiScanJitterMs: 5000,
};

/** True when a given effect should run at all, honoring the master switch. */
export function isEffectEnabled(key: keyof Omit<EffectConfig, "enabled" | "intensity" | "speed" | "reducedMotion" | "mobileIntensity" | "aiScanIntervalMs" | "aiScanJitterMs">): boolean {
  return effectConfig.enabled && Boolean(effectConfig[key]);
}
