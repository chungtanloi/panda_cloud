"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Fades and lifts its children into place the first time they enter the
 * viewport. One IntersectionObserver per instance, disconnected immediately
 * after firing, so there is no ongoing scroll cost.
 *
 * The offset/duration live in the `.reveal` class (globals.css) and are
 * disabled by prefers-reduced-motion.
 */
export interface RevealProps {
  children: React.ReactNode;
  /** Stagger in ms — use small multiples for sibling lists (0, 60, 120…). */
  delay?: number;
  /** Fraction of the element that must be visible before firing. */
  threshold?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}

export function Reveal({
  children,
  delay = 0,
  threshold = 0.15,
  as = "div",
  className,
}: RevealProps) {
  // Widening to ElementType keeps the ref assignable across the tag union —
  // TypeScript otherwise intersects the per-element ref types down to `never`.
  const Tag = as as React.ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer support (or SSR-hydrated into an old browser): show at once.
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      data-revealed={revealed ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
