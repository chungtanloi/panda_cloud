import { useEffect, useRef } from "react";
import type { GlobeLocation } from "./locations";
import { buildConnections } from "./locations";
import {
  buildArcPoints,
  latLngToVector3,
  mapRange,
  project,
  rotateX,
  rotateY,
  type Vec3,
} from "./globe-math";

export interface GlobeRendererProps {
  locations: GlobeLocation[];
  autoRotate?: boolean;
  rotationSpeed?: number; // radians per second, small e.g. 0.05
  showConnections?: boolean;
  showPulse?: boolean;
  interactive?: boolean;
  intensity?: number; // 0..1 overall glow/opacity multiplier
  activeId?: string | null;
  onHover?: (location: GlobeLocation | null) => void;
  onSelect?: (location: GlobeLocation | null) => void;
  /** Screen-space position (relative to the canvas box) of the hovered/active marker, for the tooltip. */
  onMarkerPosition?: (
    location: GlobeLocation,
    pos: { x: number; y: number }
  ) => void;
}

const TILT = -0.22; // fixed camera tilt, radians (~-12.6deg)
const MARKER_HIT_RADIUS = 16; // px, scaled by dpr internally

export function GlobeRenderer({
  locations,
  autoRotate = true,
  rotationSpeed = 0.15,
  showConnections = true,
  showPulse = true,
  interactive = true,
  intensity = 0.75,
  activeId = null,
  onHover,
  onSelect,
  onMarkerPosition,
}: GlobeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Mutable render state kept out of React state so the RAF loop never
  // triggers re-renders.
  const state = useRef({
    rotation: 0,
    hovering: false,
    hoveredId: null as string | null,
    pointer: { x: -9999, y: -9999 },
    pointerNorm: { x: 0, y: 0 }, // -1..1 within canvas
    markerScreen: new Map<string, { x: number; y: number; z: number }>(),
    reduceMotion: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    state.current.reduceMotion = mql.matches;
    const onMqlChange = () => (state.current.reduceMotion = mql.matches);
    mql.addEventListener?.("change", onMqlChange);

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = 0; // css px, square

    function resize() {
      if (!wrap || !canvas) return;
      const box = wrap.getBoundingClientRect();
      size = Math.max(0, Math.min(box.width, box.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const connections = buildConnections(locations);
    const cyan = (a: number) => `rgba(103, 232, 249, ${a})`;
    const cyanSoft = (a: number) => `rgba(56, 189, 248, ${a})`;

    function handlePointerMove(e: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      state.current.pointer = { x, y };
      state.current.pointerNorm = {
        x: mapRange(x, 0, rect.width, -1, 1),
        y: mapRange(y, 0, rect.height, -1, 1),
      };
      state.current.hovering = true;
    }
    function handlePointerLeave() {
      state.current.hovering = false;
      state.current.pointer = { x: -9999, y: -9999 };
      if (state.current.hoveredId !== null) {
        state.current.hoveredId = null;
        onHover?.(null);
      }
    }
    function handleClick(e: MouseEvent) {
      if (!interactive || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const hit = findNearestMarker(pt);
      onSelect?.(hit);
    }

    function findNearestMarker(pt: { x: number; y: number }) {
      let best: GlobeLocation | null = null;
      let bestDist = MARKER_HIT_RADIUS;
      for (const loc of locations) {
        const p = state.current.markerScreen.get(loc.id);
        if (!p || p.z < -0.35) continue; // hidden behind globe
        const d = Math.hypot(p.x - pt.x, p.y - pt.y);
        if (d < bestDist) {
          bestDist = d;
          best = loc;
        }
      }
      return best;
    }

    if (interactive) {
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerleave", handlePointerLeave);
      canvas.addEventListener("click", handleClick);
    }

    let raf = 0;
    let last = performance.now();
    let pulseClock = 0;

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(frame);
      if (!ctx || !canvas || size <= 0) return;

      const s = state.current;

      // hover state derived from nearest marker each frame (cheap, few nodes)
      if (interactive && s.hovering) {
        const near = findNearestMarker(s.pointer);
        const nearId = near?.id ?? null;
        if (nearId !== s.hoveredId) {
          s.hoveredId = nearId;
          onHover?.(near);
        }
      }

      // rotation: slows on hover, nudged slightly toward cursor x
      const speedFactor = s.hovering ? 0.18 : 1;
      if (autoRotate && !s.reduceMotion) {
        s.rotation += rotationSpeed * speedFactor * dt;
      }
      const cursorNudge =
        interactive && s.hovering ? s.pointerNorm.x * 0.12 : 0;
      const rotation = s.rotation + cursorNudge;

      const glow = s.hovering ? Math.min(1, intensity + 0.25) : intensity;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // --- atmospheric glow behind the globe ---
      const grad = ctx.createRadialGradient(
        size / 2,
        size / 2,
        size * 0.28,
        size / 2,
        size / 2,
        size * 0.55
      );
      grad.addColorStop(0, cyanSoft(0.18 * glow));
      grad.addColorStop(1, cyanSoft(0));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      const radius = size * 0.38;

      function place(v: Vec3) {
        const r = rotateX(rotateY(v, rotation), TILT);
        const p = project(r, radius * 2, 2.6);
        return {
          x: p.x + (size - radius * 2) / 2,
          y: p.y + (size - radius * 2) / 2,
          z: p.z,
        };
      }

      // Depth → line opacity. Front hemisphere reads clearly; back is nearly
      // invisible so the mesh reads as a rounded volume, not a flat grid.
      function depthOpacity(z: number) {
        return z > 0
          ? mapRange(z, 0, 1, 0.12, 0.5) * glow
          : mapRange(z, -1, 0, 0.015, 0.06) * glow;
      }

      // Draws a poly-line where each segment gets its own opacity, so the
      // ring visibly fades as it curves around the back of the sphere.
      function strokeGradientPath(points: { x: number; y: number; z: number }[]) {
        ctx.lineWidth = 1;
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1];
          const b = points[i];
          const avgZ = (a.z + b.z) / 2;
          if (avgZ < -0.75) continue; // skip the far side entirely
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = cyan(depthOpacity(avgZ));
          ctx.stroke();
        }
      }

      // --- soft filled sphere body for a sense of volume ---
      const sphereGrad = ctx.createRadialGradient(
        size / 2 - radius * 0.3,
        size / 2 - radius * 0.35,
        radius * 0.1,
        size / 2,
        size / 2,
        radius
      );
      sphereGrad.addColorStop(0, cyanSoft(0.1 * glow));
      sphereGrad.addColorStop(0.7, cyanSoft(0.045 * glow));
      sphereGrad.addColorStop(1, cyanSoft(0.02 * glow));
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // --- wireframe latitude / longitude lines ---
      for (let lat = -60; lat <= 60; lat += 30) {
        const pts: { x: number; y: number; z: number }[] = [];
        for (let lng = 0; lng <= 360; lng += 5) {
          pts.push(place(latLngToVector3(lat, lng)));
        }
        strokeGradientPath(pts);
      }
      for (let lng = 0; lng < 360; lng += 30) {
        const pts: { x: number; y: number; z: number }[] = [];
        for (let lat = -90; lat <= 90; lat += 5) {
          pts.push(place(latLngToVector3(lat, lng)));
        }
        strokeGradientPath(pts);
      }

      // equator, drawn slightly brighter as an anchor line
      const equatorPts: { x: number; y: number; z: number }[] = [];
      for (let lng = 0; lng <= 360; lng += 4) {
        equatorPts.push(place(latLngToVector3(0, lng)));
      }
      ctx.lineWidth = 1;
      for (let i = 1; i < equatorPts.length; i++) {
        const a = equatorPts[i - 1];
        const b = equatorPts[i];
        const avgZ = (a.z + b.z) / 2;
        if (avgZ < -0.6) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = cyan(depthOpacity(avgZ) * 1.4);
        ctx.stroke();
      }

      // outer rim highlight
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
      ctx.strokeStyle = cyan(0.3 * glow);
      ctx.lineWidth = 1.25;
      ctx.stroke();

      // --- connection arcs + data pulses ---
      if (showConnections) {
        if (!s.reduceMotion) pulseClock += dt;
        for (const [a, b] of connections) {
          const va = latLngToVector3(a.lat, a.lng);
          const vb = latLngToVector3(b.lat, b.lng);
          const arcPts = buildArcPoints(va, vb, 40, 0.32).map(place);

          const isActiveArc =
            activeId && (activeId === a.id || activeId === b.id);

          ctx.beginPath();
          arcPts.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          const baseOp = isActiveArc ? 0.55 : 0.28;
          ctx.strokeStyle = cyan(baseOp * glow);
          ctx.lineWidth = isActiveArc ? 1.6 : 1;
          ctx.stroke();

          if (showPulse && !s.reduceMotion) {
            const t = ((pulseClock * 0.18 + hashId(a.id + b.id)) % 1 + 1) % 1;
            const idx = Math.min(arcPts.length - 1, Math.round(t * arcPts.length));
            const pp = arcPts[idx];
            if (pp && pp.z > -0.3) {
              const r = 2.4;
              ctx.beginPath();
              ctx.arc(pp.x, pp.y, r * 2.2, 0, Math.PI * 2);
              ctx.fillStyle = cyan(0.12 * glow);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(pp.x, pp.y, r, 0, Math.PI * 2);
              ctx.fillStyle = cyan(0.9 * glow);
              ctx.fill();
            }
          }
        }
      }

      // --- markers ---
      s.markerScreen.clear();
      for (const loc of locations) {
        const v = latLngToVector3(loc.lat, loc.lng);
        const p = place(v);
        s.markerScreen.set(loc.id, p);

        const isActive = activeId === loc.id;
        const isHovered = s.hoveredId === loc.id;
        const front = p.z > -0.35;
        const baseOp = mapRange(p.z, -1, 1, 0.25, 1);
        const pulseR = loc.isHub ? 6.5 : 5.5;
        const highlight = isActive || isHovered;

        // outer glow ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseR * (highlight ? 3.6 : 2.6), 0, Math.PI * 2);
        ctx.fillStyle = cyan((highlight ? 0.22 : 0.12) * baseOp * glow);
        ctx.fill();

        // slow pulse ring
        if (!s.reduceMotion && front) {
          const pulseT = ((pulseClock * 0.35 + hashId(loc.id)) % 1 + 1) % 1;
          const ringR = pulseR + pulseT * pulseR * 3.2;
          const ringOp = (1 - pulseT) * 0.35 * baseOp * glow;
          ctx.beginPath();
          ctx.arc(p.x, p.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = cyan(ringOp);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, highlight ? pulseR * 1.25 : pulseR, 0, Math.PI * 2);
        ctx.fillStyle = highlight
          ? `rgba(224, 250, 255, ${baseOp})`
          : cyan(0.85 * baseOp * glow);
        ctx.fill();
        if (highlight) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseR * 1.25 + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = cyan(0.8 * baseOp);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        if ((highlight) && front) {
          onMarkerPosition?.(loc, { x: p.x, y: p.y });
        }
      }
    }

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mql.removeEventListener?.("change", onMqlChange);
      if (interactive) {
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerleave", handlePointerLeave);
        canvas.removeEventListener("click", handleClick);
      }
    };
    // Re-run only when structural props change; per-frame values are read
    // live from the closures above via props captured at effect-setup time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locations,
    autoRotate,
    rotationSpeed,
    showConnections,
    showPulse,
    interactive,
    intensity,
    activeId,
  ]);

  return (
    <div ref={wrapRef} className="globe-canvas-wrap">
      <canvas ref={canvasRef} className="globe-canvas" />
    </div>
  );
}

/** Deterministic 0..1 offset per id so pulses on different arcs/markers desync. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
