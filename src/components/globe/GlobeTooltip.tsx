import type { GlobeLocation } from "./locations";

export interface GlobeTooltipProps {
  location: GlobeLocation | null;
  position: { x: number; y: number } | null;
}

export function GlobeTooltip({ location, position }: GlobeTooltipProps) {
  if (!location || !position) return null;

  return (
    <div
      className="globe-tooltip"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="tooltip"
    >
      <div className="globe-tooltip__name">{location.name}</div>
      <div className="globe-tooltip__type">{location.type}</div>
      {location.detail && (
        <div className="globe-tooltip__detail">{location.detail}</div>
      )}
    </div>
  );
}
