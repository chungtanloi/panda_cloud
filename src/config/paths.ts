import type { UserPath } from "@/models/auth";

/**
 * The four product tracks offered on "Choose Your Path" (Figma node 2:975).
 * Copy is transcribed verbatim from the design — do not reword it.
 *
 * Centralised here because the same mapping drives the path cards, the
 * post-login redirect, and the dashboard's request grouping.
 */
export interface PathOption {
  id: UserPath;
  /** Accent chip above the title. */
  badge: string;
  /** Two-line heading, kept as separate lines to match the design's wrap. */
  title: string;
  description: string;
  /** Where the user lands after choosing this path. */
  route: string;
}

export const PATH_OPTIONS: readonly PathOption[] = [
  {
    id: "land_owner",
    badge: "Asset Owners",
    title: "Land Owner Assessment",
    description: "Discover the value of your land for an AI data center.",
    route: "/assessment",
  },
  {
    id: "gpu_renter",
    badge: "GPU Leasing",
    title: "GPU Cluster Booking",
    description: "Rent enterprise GPUs instantly.",
    route: "/booking",
  },
  {
    id: "investor",
    badge: "Token Buyers",
    title: "AI Token Investment",
    description: "Earn passive income from AI infrastructure.",
    route: "/investment",
  },
  {
    id: "hyperscaler",
    badge: "Hyperscaler EPC",
    title: "Hyperscale Data Center",
    description: "Expert guidance for turnkey AI infrastructure.",
    route: "/hyperscale",
  },
] as const;

export function routeForPath(path: UserPath | undefined): string {
  return PATH_OPTIONS.find((option) => option.id === path)?.route ?? "/choose-path";
}
