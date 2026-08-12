"use client";

import { useEffect, useRef, useState } from "react";
import { effectConfig, isEffectEnabled } from "@/config/effects";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

/**
 * Absolute-positioned overlay that periodically sweeps a faint horizontal
 * scan line down through its nearest positioned ancestor. Meant to be
 * dropped inside a section that already has `position: relative`
 * (`className="relative"` or similar) — it never adds layout size itself.
 *
 * Fires on a randomized interval (never continuously) so it reads as an
 * occasional system check rather than a looping animation.
 */
export function AIScan({ className }: { className?: string }) {
  const [key, setKey] = useState(0);
  const [running, setRunning] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEffectEnabled("aiScan")) return;
    if (prefersReducedMotion()) return;

    const schedule = () => {
      const jitter = Math.random() * effectConfig.aiScanJitterMs;
      const delay = (effectConfig.aiScanIntervalMs + jitter) / effectConfig.speed;
      timeoutRef.current = setTimeout(() => {
        setRunning(true);
        setKey((k) => k + 1);
        schedule();
      }, delay);
    };

    // First sweep arrives a little sooner so the effect isn't invisible on
    // short page visits.
    timeoutRef.current = setTimeout(() => {
      setRunning(true);
      setKey((k) => k + 1);
      schedule();
    }, 1800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!isEffectEnabled("aiScan")) return null;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {running ? (
        <span
          key={key}
          className="ai-scan-line absolute inset-x-0 top-0"
          onAnimationEnd={() => setRunning(false)}
        />
      ) : null}
    </div>
  );
}
