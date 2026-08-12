"use client";

import { useEffect, useRef, useState } from "react";
import { circuitConfig } from "@/config/circuit";
import { CircuitEngine } from "@/lib/circuit/engine";

/**
 * Interactive circuit-board / PCB backdrop, mounted once in the root layout
 * so it sits behind every screen in the app.
 *
 * - Purely decorative: `pointer-events: none` and `z-index: 0`, fixed behind
 *   the whole viewport. It never intercepts clicks, drags, typing or scroll —
 *   nothing about page layout, colours or structure changes.
 * - One canvas, no per-trace/per-node DOM. All simulation and drawing lives
 *   in `lib/circuit/engine.ts`; this component only wires browser events to
 *   it and owns its lifecycle.
 * - Every tunable (colours, density, speed, intensity, the mobile cutoff) is
 *   read from `config/circuit.ts` — flip `enabled` there to remove the
 *   effect everywhere without touching this file or any page.
 * - Any element anywhere can opt into the "data pulse" treatment (traces
 *   converging on it, e.g. a Kanban card receiving data) by adding the
 *   `data-circuit-attract` attribute — no extra JS required at the call
 *   site, so the effect never has to be hard-coded into a specific page or
 *   feature.
 */
export function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Track prefers-reduced-motion live rather than only at first paint.
  useEffect(() => {
    if (typeof window === "undefined" || !circuitConfig.enabled) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!circuitConfig.enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new CircuitEngine({ canvas, config: circuitConfig, reducedMotion });

    // Cheap one-time device signal — no benchmarking, just a hint used to
    // thin out node density on low core-count hardware.
    const lowPower =
      (navigator.hardwareConcurrency || 8) <= circuitConfig.lowPowerCoreThreshold;

    // Whether the effect is currently "live" at the current viewport size.
    // Below `disableBelowWidth` (phones) the canvas is left empty and the
    // simulation loop never runs — the automatic mobile/low-power fallback.
    let active = false;

    const applySize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const shouldRun = width >= circuitConfig.disableBelowWidth;

      if (!shouldRun) {
        if (active) {
          engine.stop();
          active = false;
        }
        canvas.width = 0;
        canvas.height = 0;
        canvas.style.width = "0px";
        canvas.style.height = "0px";
        return;
      }

      const rawCount = (width * height) / circuitConfig.areaPerNode;
      const scaled = lowPower ? rawCount * circuitConfig.lowPowerDensityScale : rawCount;
      const nodeCount = Math.round(
        Math.min(circuitConfig.maxNodes, Math.max(circuitConfig.minNodes, scaled)),
      );

      engine.resize(width, height, nodeCount);
      if (!active) {
        engine.start();
        active = true;
      }
    };

    applySize();

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(applySize, 150);
    };
    window.addEventListener("resize", onResize);

    // Pointer tracking. Listeners live on `window`/`document`, never on the
    // canvas itself, so clicks and drags on real UI are completely unaffected.
    const onPointerMove = (event: PointerEvent) => {
      if (!active) return;
      engine.setPointer(event.clientX, event.clientY);
    };
    const onPointerLeave = () => engine.clearPointer();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);

    // `data-circuit-attract` opt-in: a short convergence burst runs toward
    // any element carrying the attribute when the pointer enters it — used
    // for the "card is receiving data" touch on things like Kanban cards.
    let currentAttractEl: Element | null = null;
    const onPointerOverAttract = (event: PointerEvent) => {
      if (!active) return;
      const target = event.target as Element | null;
      const attractEl = target?.closest("[data-circuit-attract]") ?? null;
      if (!attractEl || attractEl === currentAttractEl) return;
      currentAttractEl = attractEl;
      const rect = attractEl.getBoundingClientRect();
      engine.burstToward(rect.left + rect.width / 2, rect.top + rect.height / 2);
    };
    const onPointerOutAttract = (event: PointerEvent) => {
      const related = event.relatedTarget as Element | null;
      if (currentAttractEl && (!related || !currentAttractEl.contains(related))) {
        currentAttractEl = null;
      }
    };
    document.addEventListener("pointerover", onPointerOverAttract, { passive: true });
    document.addEventListener("pointerout", onPointerOutAttract, { passive: true });

    // Pause entirely when the tab is hidden — no wasted frames off-screen.
    const onVisibilityChange = () => {
      if (document.hidden) engine.stop();
      else if (active) engine.start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("pointerover", onPointerOverAttract);
      document.removeEventListener("pointerout", onPointerOutAttract);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearTimeout(resizeTimer);
      engine.dispose();
    };
  }, [reducedMotion]);

  if (!circuitConfig.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}