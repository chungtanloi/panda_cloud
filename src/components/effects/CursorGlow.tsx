"use client";

import { useEffect, useRef } from "react";
import { isEffectEnabled } from "@/config/effects";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Tiny glow ring that trails the cursor, on top of the existing PCB pointer
 * interaction (which lights up nearby circuit traces). This never replaces
 * the system cursor and never touches click handling — it writes position
 * straight to a transform via a ref, so pointer movement causes zero React
 * renders.
 *
 * Desktop pointer devices only: touch input never fires plain `pointermove`,
 * so phones and tablets simply render nothing.
 */
export function CursorGlow() {
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEffectEnabled("cursorGlow")) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;

    const ring = ringRef.current;
    if (!ring) return;

    let raf = 0;
    let targetX = -100;
    let targetY = -100;
    let x = -100;
    let y = -100;
    let active = false;

    const loop = () => {
      // Light easing so the ring reads as a trailing glow, not a 1:1 dot.
      x += (targetX - x) * 0.28;
      y += (targetY - y) * 0.28;
      ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;

      if (!active) {
        active = true;
        ring.dataset.active = "true";
      }

      const target = (event.target as HTMLElement | null)?.closest(
        "a, button, [role='button'], input, textarea, select, [data-cursor-glow]",
      );
      ring.dataset.variant = target ? "interactive" : "default";
    };

    const handleLeave = () => {
      active = false;
      ring.dataset.active = "false";
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  if (!isEffectEnabled("cursorGlow")) return null;

  return (
    <div
      ref={ringRef}
      aria-hidden
      data-active="false"
      data-variant="default"
      className="cursor-glow-ring pointer-events-none fixed left-0 top-0 z-[60] hidden md:block"
    />
  );
}
