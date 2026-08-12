/**
 * Energy & Land page content — transcribed verbatim from Figma node 2:405.
 *
 * As on Buy GPU, the headline is genuinely 16px (node 2:410) — this page leads
 * with a statement line rather than a display heading.
 */

export const ENERGY_HERO = {
  titleLead: "Site your next campus with power ",
  titleAccent: "already secured",
  body:
    "Access prime global locations engineered for extreme high-density AI computing. " +
    "Ready to deploy with pre-secured megawatts.",
  cta: { label: "DISCUSS SITE REQUIREMENTS", href: "/assessment" },
} as const;

export interface SiteSpec {
  label: string;
  value: string;
  /** Energization dates are accented when the site is available. */
  accent?: boolean;
}

export interface SiteRegion {
  id: string;
  region: string;
  location: string;
  /** "LIVE" renders as an accent chip with a dot; anything else is neutral. */
  status: "LIVE" | "COMING SOON";
  specs: readonly SiteSpec[];
}

/** Node 2:415 — three region cards, left to right. */
export const SITE_REGIONS: readonly SiteRegion[] = [
  {
    id: "taiwan",
    region: "Taiwan",
    location: "Hsinchu Science Park",
    status: "LIVE",
    specs: [
      { label: "Substation MW", value: "150 MW" },
      { label: "Land", value: "12 Acres" },
      { label: "Cooling Type", value: "Direct-to-Chip" },
      { label: "Energization", value: "Q3 2024", accent: true },
    ],
  },
  {
    id: "us",
    region: "United States",
    location: "Dallas, TX",
    status: "COMING SOON",
    specs: [
      { label: "Substation MW", value: "300 MW" },
      { label: "Land", value: "45 Acres" },
      { label: "Cooling Type", value: "Hybrid Air/Liquid" },
      { label: "Energization", value: "Q1 2025" },
    ],
  },
  {
    id: "europe",
    region: "Europe",
    location: "Oslo, Norway",
    status: "LIVE",
    specs: [
      { label: "Substation MW", value: "80 MW" },
      { label: "Land", value: "8 Acres" },
      { label: "Cooling Type", value: "Free Cooling/Air" },
      { label: "Energization", value: "Immediate", accent: true },
    ],
  },
] as const;
