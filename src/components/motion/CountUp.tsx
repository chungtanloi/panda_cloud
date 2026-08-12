"use client";

import { useEffect, useRef, useState } from "react";
import { easeOutCubic, formatFigure, parseFigure, prefersReducedMotion } from "@/lib/motion";

/**
 * Counts a display figure up to its final value when it scrolls into view.
 *
 * Takes the *formatted* string used elsewhere (e.g. "10,240+", "99.99%",
 * "240 MW") and animates only its numeric part, so the config files stay the
 * single source of truth. Strings with no leading number — "Tier III+",
 * "Custom Quote" — render unchanged.
 *
 * The final text is present in the DOM from the first paint for assistive
 * tech and for users with reduced motion.
 */
export function CountUp({
  value,
  durationMs = 1100,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const spec = parseFigure(value);
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    // Nothing numeric to animate, or the user opted out.
    if (!spec || prefersReducedMotion()) return;

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();

        const start = performance.now();
        setDisplay(formatFigure(0, spec));

        const tick = (now: number) => {
          if (cancelled) return;
          const progress = Math.min(1, (now - start) / durationMs);
          setDisplay(formatFigure(spec.value * easeOutCubic(progress), spec));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // `spec` is derived from `value`; depending on it directly would rebuild
    // the observer on every render because it is a fresh object each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {/* Screen readers get the final value; the animated text is decorative. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden>{display}</span>
    </span>
  );
}
