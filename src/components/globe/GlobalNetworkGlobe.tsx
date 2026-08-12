"use client"
import { useState } from "react";
import { defaultLocations, type GlobeLocation } from "./locations";
import { GlobeRenderer } from "./GlobeRenderer";
import { GlobeTooltip } from "./GlobeTooltip";
import "./globe.css";

export interface GlobalNetworkGlobeProps {
  locations?: GlobeLocation[];
  autoRotate?: boolean;
  rotationSpeed?: number;
  showConnections?: boolean;
  showPulse?: boolean;
  interactive?: boolean;
  intensity?: number;
  /** Small dot-list under the globe. Off by default — click a node on the globe instead. */
  showLocationList?: boolean;
  className?: string;
}

export function GlobalNetworkGlobe({
  locations = defaultLocations,
  autoRotate = true,
  rotationSpeed = 0.15,
  showConnections = true,
  showPulse = true,
  interactive = true,
  intensity = 0.75,
  showLocationList = false,
  className,
}: GlobalNetworkGlobeProps) {
  const [hovered, setHovered] = useState<GlobeLocation | null>(null);
  const [active, setActive] = useState<GlobeLocation | null>(null);
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(
    null
  );

  // Info only appears once the user clicks a node — hover still brightens
  // the marker on the canvas, but doesn't pop the tooltip open.
  const displayed = active;

  return (
    <div className={`global-network-globe ${className ?? ""}`}>
      <GlobeRenderer
        locations={locations}
        autoRotate={autoRotate}
        rotationSpeed={rotationSpeed}
        showConnections={showConnections}
        showPulse={showPulse}
        interactive={interactive}
        intensity={intensity}
        activeId={active?.id ?? null}
        onHover={setHovered}
        onSelect={(loc) =>
          setActive((prev) => (prev && loc && prev.id === loc.id ? null : loc))
        }
        onMarkerPosition={(_loc, pos) => setMarkerPos(pos)}
      />
      <GlobeTooltip location={displayed} position={displayed ? markerPos : null} />

      {showLocationList && (
        <ul className="global-network-globe__list">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className={
                active?.id === loc.id
                  ? "is-active"
                  : hovered?.id === loc.id
                  ? "is-hovered"
                  : ""
              }
              onMouseEnter={() => setHovered(loc)}
              onMouseLeave={() => setHovered((h) => (h?.id === loc.id ? null : h))}
              onClick={() =>
                setActive((prev) => (prev?.id === loc.id ? null : loc))
              }
            >
              <span className="dot" aria-hidden />
              {loc.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
