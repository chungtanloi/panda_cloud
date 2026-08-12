import type { GlobeLocation } from "./locations";

/**
 * Fallback coordinates for known regions. Extend this if NETWORK.nodes in
 * config/landing.ts introduces a region not listed here.
 */
const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  Taiwan: { lat: 23.6978, lng: 120.9605 },
  "United States": { lat: 37.0902, lng: -95.7129 },
  Europe: { lat: 50.1109, lng: 10.4515 },
  Norway: { lat: 60.472, lng: 8.4689 },
  Germany: { lat: 51.1657, lng: 10.4515 },
  Singapore: { lat: 1.3521, lng: 103.8198 },
  Japan: { lat: 36.2048, lng: 138.2529 },
};

export interface NetworkNode {
  region: string;
  tier: string;
  primary?: boolean;
}

/**
 * Converts the existing NETWORK.nodes shape into GlobeLocation[].
 *
 * Accepts a readonly array because the source (`NETWORK.nodes` in
 * config/landing.ts) is declared `as const` and must stay immutable.
 */
export function networkNodesToGlobeLocations(
  nodes: readonly NetworkNode[],
): GlobeLocation[] {
  const locations: GlobeLocation[] = [];

  for (const node of nodes) {
    const coords = REGION_COORDS[node.region];
    if (!coords) {
      console.warn(
        `[GlobalNetworkGlobe] No coordinates for region "${node.region}" — add it to REGION_COORDS in networkAdapter.ts.`,
      );
      continue;
    }

    locations.push({
      id: node.region.toLowerCase().replace(/\s+/g, "-"),
      name: node.region,
      lat: coords.lat,
      lng: coords.lng,
      type: node.tier,
      isHub: node.primary,
    });
  }

  return locations;
}
