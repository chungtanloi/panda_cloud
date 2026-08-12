/**
 * Marketing navigation — transcribed from Figma nodes 1:180 (top bar) and
 * 1:159 (footer). Both use the same five destinations, so they share one list.
 */
export interface NavLink {
  label: string;
  href: string;
}

export const MARKETING_NAV: readonly NavLink[] = [
  { label: "Platform", href: "/" },
  { label: "GPU Renting", href: "/gpu-renting" },
  { label: "Buy GPU", href: "/buy-gpu" },
  { label: "Energy & Land", href: "/energy-land" },
  { label: "Financing", href: "/financing" },
  { label: "Infrastructure", href: "/infrastructure" },
] as const;

/** The footer omits "Platform" and appends the Get Started link (node 1:159). */
export const FOOTER_NAV: readonly NavLink[] = MARKETING_NAV.filter(
  (link) => link.label !== "Platform",
);
