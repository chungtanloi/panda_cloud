/**
 * Motion helpers shared by the client-side effect components.
 *
 * Every JS-driven animation must consult `prefersReducedMotion()` and jump
 * straight to its end state when it returns true. The CSS-only effects are
 * already handled by the media query in globals.css.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Ease-out cubic — matches the CSS curve used for reveals. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Splits a display figure into an animatable number plus its surrounding text.
 *
 * "10,240+"   → { prefix: "",  value: 10240, suffix: "+",   decimals: 0 }
 * "$28,500"   → { prefix: "$", value: 28500, suffix: "",    decimals: 0 }
 * "99.99%"    → { prefix: "",  value: 99.99, suffix: "%",   decimals: 2 }
 * "240 MW"    → { prefix: "",  value: 240,   suffix: " MW", decimals: 0 }
 * "Tier III+" → null (nothing to count; render the string as-is)
 */
export interface ParsedFigure {
  prefix: string;
  value: number;
  suffix: string;
  decimals: number;
  /** True when the source used thousands separators, so output should too. */
  grouped: boolean;
}

const FIGURE_RE = /^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/s;

export function parseFigure(input: string): ParsedFigure | null {
  const match = FIGURE_RE.exec(input.trim());
  if (!match) return null;

  const [, prefix = "", rawNumber = "", suffix = ""] = match;

  // Reject figures whose number is buried after letters — "Q3 2024" would
  // otherwise animate the quarter digit and read as a glitch. A symbol prefix
  // like "$28,500" is fine.
  if (/[A-Za-z]/.test(prefix)) return null;
  const grouped = rawNumber.includes(",");
  const normalized = rawNumber.replace(/,/g, "");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return null;

  const dot = normalized.indexOf(".");
  const decimals = dot === -1 ? 0 : normalized.length - dot - 1;

  return { prefix, value, suffix, decimals, grouped };
}

export function formatFigure(value: number, spec: ParsedFigure): string {
  const body = spec.grouped
    ? value.toLocaleString("en-US", {
        minimumFractionDigits: spec.decimals,
        maximumFractionDigits: spec.decimals,
      })
    : value.toFixed(spec.decimals);

  return `${spec.prefix}${body}${spec.suffix}`;
}
