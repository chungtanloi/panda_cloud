export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Projected {
  x: number;
  y: number;
  z: number; // world-space depth after rotation, used for opacity/scale
  scale: number;
}

/** Converts lat/lng (degrees) into a point on a unit sphere. */
export function latLngToVector3(lat: number, lng: number, radius = 1): Vec3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

export function rotateY(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos + v.z * sin, y: v.y, z: -v.x * sin + v.z * cos };
}

export function rotateX(v: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x, y: v.y * cos - v.z * sin, z: v.y * sin + v.z * cos };
}

/**
 * Projects a 3D point (sphere radius ~1) onto a `size`×`size` canvas with a
 * simple perspective camera looking down the -z axis from z = perspective.
 */
export function project(v: Vec3, size: number, perspective = 2.6): Projected {
  const scale = perspective / (perspective - v.z);
  return {
    x: v.x * scale * (size / 2) + size / 2,
    y: -v.y * scale * (size / 2) + size / 2,
    z: v.z,
    scale,
  };
}

/** Spherical linear interpolation between two unit vectors. */
export function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
  const theta = Math.acos(dot) * t;
  const relX = b.x - a.x * dot;
  const relY = b.y - a.y * dot;
  const relZ = b.z - a.z * dot;
  const relLen = Math.sqrt(relX * relX + relY * relY + relZ * relZ) || 1;
  const rx = relX / relLen;
  const ry = relY / relLen;
  const rz = relZ / relLen;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  return {
    x: a.x * cosT + rx * sinT,
    y: a.y * cosT + ry * sinT,
    z: a.z * cosT + rz * sinT,
  };
}

/** Builds an arched arc of unit-ish vectors between two lat/lng points. */
export function buildArcPoints(
  from: Vec3,
  to: Vec3,
  segments = 32,
  arcHeight = 0.35
): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const base = slerp(from, to, t);
    const lift = 1 + Math.sin(Math.PI * t) * arcHeight;
    pts.push({ x: base.x * lift, y: base.y * lift, z: base.z * lift });
  }
  return pts;
}

/** Maps a value from one range to another, clamped. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
  return outMin + t * (outMax - outMin);
}
