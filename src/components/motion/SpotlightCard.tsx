"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Adds a cursor-following accent wash and an optional subtle 3D tilt.
 *
 * Position is written straight to CSS custom properties on the element, so
 * pointer movement never triggers a React render. Tilt is capped at 4° to stay
 * within the "subtle / enterprise" brief.
 *
 * Pointer-driven only: touch devices never fire pointermove without a press,
 * so they simply get the static card.
 */
export interface SpotlightCardProps {
  children: React.ReactNode;
  /** Adds the 4° perspective tilt on top of the spotlight. */
  tilt?: boolean;
  className?: string;
}

const MAX_TILT_DEG = 4;

export function SpotlightCard({ children, tilt = false, className }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      node.style.setProperty("--mx", `${x * 100}%`);
      node.style.setProperty("--my", `${y * 100}%`);

      if (tilt) {
        // Centre the range on 0 so the card tips away from the cursor.
        const rotateY = (x - 0.5) * 2 * MAX_TILT_DEG;
        const rotateX = -(y - 0.5) * 2 * MAX_TILT_DEG;
        node.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    },
    [tilt],
  );

  const handleLeave = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.style.removeProperty("--mx");
    node.style.removeProperty("--my");
    if (tilt) node.style.transform = "";
  }, [tilt]);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={cn("spotlight hover-lift", className)}
    >
      {children}
    </div>
  );
}
