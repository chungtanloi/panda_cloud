export interface GlobeLocation {
  /** Unique key, also used for React keys and hit-testing */
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Short label shown under the name, e.g. "Core Node" */
  type: string;
  /** Third line in the tooltip, e.g. "GPU Infrastructure" */
  detail?: string;
  /** Core nodes render slightly larger / brighter and act as connection hubs */
  isHub?: boolean;
}

export const defaultLocations: GlobeLocation[] = [
  {
    id: "taiwan",
    name: "Taiwan",
    lat: 23.6978,
    lng: 120.9605,
    type: "Core Node",
    detail: "GPU Infrastructure",
    isHub: true,
  },
  {
    id: "united-states",
    name: "United States",
    lat: 37.0902,
    lng: -95.7129,
    type: "Expansion Node",
    detail: "GPU Infrastructure",
  },
  {
    id: "europe",
    name: "Europe",
    lat: 50.1109,
    lng: 10.4515,
    type: "Edge Node",
    detail: "GPU Infrastructure",
  },
];

/**
 * Builds the connection pairs used to draw network arcs.
 * If any location is flagged `isHub`, all other locations connect to the
 * hub(s) only (hub-and-spoke). Otherwise every location connects to every
 * other one (mesh) — fine for small lists like the default 3 nodes.
 */
export function buildConnections(
  locations: GlobeLocation[]
): [GlobeLocation, GlobeLocation][] {
  const hubs = locations.filter((l) => l.isHub);
  const pairs: [GlobeLocation, GlobeLocation][] = [];

  if (hubs.length > 0) {
    for (const hub of hubs) {
      for (const loc of locations) {
        if (loc.id === hub.id) continue;
        pairs.push([hub, loc]);
      }
    }
    return pairs;
  }

  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      pairs.push([locations[i], locations[j]]);
    }
  }
  return pairs;
}
