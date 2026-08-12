/**
 * Configuration for the interactive circuit-board background.
 *
 * This is the ONLY place the effect is tuned. No page or UI component contains
 * effect logic, and nothing here changes layout, copy, or the design tokens —
 * the canvas is a decorative layer painted behind the interface.
 *
 * Colours intentionally reuse the existing accent (#00f2ff) so the effect reads
 * as part of the product rather than an add-on.
 */

export interface CircuitConfig {
  /** Master switch. Set false to remove the effect everywhere. */
  enabled: boolean;

  /** Trace and node colours, as "r, g, b" so alpha can be applied per draw. */
  traceRgb: string;
  nodeRgb: string;
  pulseRgb: string;

  /**
   * Approximate screen area (px²) allotted to each node. Larger = sparser.
   * Node count is derived from viewport size, then clamped.
   */
  areaPerNode: number;
  minNodes: number;
  maxNodes: number;

  /** How far from the cursor the interaction reaches, in CSS pixels. */
  influenceRadius: number;

  /** Resting opacity of traces and nodes when the cursor is far away. */
  baseTraceAlpha: number;
  baseNodeAlpha: number;
  /** Peak opacity directly under the cursor. */
  activeTraceAlpha: number;
  activeNodeAlpha: number;

  pulse: {
    /** Hard cap on concurrent pulses — the main FPS guard. */
    maxActive: number;
    /** CSS pixels per second. */
    speed: number;
    /** Minimum ms between pulses spawned by cursor movement. */
    spawnIntervalMs: number;
    /** How many edges a pulse may traverse before fading out. */
    maxHops: number;
    /** Length of the glowing head, in CSS pixels. */
    trailLength: number;
  };

  /** Burst fired when the cursor enters a [data-circuit-attract] element. */
  attractBurst: number;

  /** Below this viewport width the effect is disabled entirely. */
  disableBelowWidth: number;
  /** Reduce density when the device reports few CPU cores. */
  lowPowerCoreThreshold: number;
  /** Multiplier applied to node count on low-power devices. */
  lowPowerDensityScale: number;
}

export const circuitConfig: CircuitConfig = {
  enabled: true,

  traceRgb: "0, 242, 255",
  nodeRgb: "0, 242, 255",
  pulseRgb: "180, 255, 255",

  areaPerNode: 24_000,
  minNodes: 36,
  maxNodes: 170,

  influenceRadius: 260,

  baseTraceAlpha: 0.05,
  baseNodeAlpha: 0.1,
  activeTraceAlpha: 0.5,
  activeNodeAlpha: 0.95,

  pulse: {
    maxActive: 22,
    speed: 260,
    spawnIntervalMs: 90,
    maxHops: 5,
    trailLength: 46,
  },

  attractBurst: 3,

  disableBelowWidth: 768,
  lowPowerCoreThreshold: 4,
  lowPowerDensityScale: 0.55,
};
