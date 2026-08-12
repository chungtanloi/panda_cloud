"use client";

import { useEffect, useRef, useState } from "react";
import { isEffectEnabled } from "@/config/effects";
import { cn } from "@/lib/cn";

/**
 * A short vertical connector dropped between two sections: a hairline with a
 * single node and an optional label (e.g. "DATA", "COMPUTE"). Purely
 * decorative — it takes a fixed, small height so it never meaningfully
 * changes page rhythm, and the trace/node styling matches the existing PCB
 * accent colour so it reads as part of the same system rather than a new
 * motif.
 *
 * The node lights up once when it scrolls into view (one IntersectionObserver
 * per instance, disconnected after firing) rather than animating forever.
 */
export function DataFlowConnector({ label, className }: { label?: string; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    if (!isEffectEnabled("dataFlow")) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLit(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!isEffectEnabled("dataFlow")) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      data-lit={lit ? "true" : "false"}
      className={cn(
        "data-flow-connector pointer-events-none relative mx-auto flex h-[40px] w-full max-w-[1440px] items-center justify-center lg:h-[56px]",
        className,
      )}
    >
      <span className="data-flow-line" />
      <span className="data-flow-node" />
      {label ? (
        <span className="data-flow-label font-mono text-[10px] font-medium leading-[10px] tracking-[1.2px] text-accent">
          {label}
        </span>
      ) : null}
    </div>
  );
}
