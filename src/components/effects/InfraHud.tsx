"use client";

import { useEffect, useRef, useState } from "react";
import { isEffectEnabled } from "@/config/effects";
import { cn } from "@/lib/cn";
import { prefersReducedMotion } from "@/lib/motion";

export interface InfraHudMetric {
  label: string;
  /** 0–100. Rendered as a small progress bar. */
  percent: number;
}

export interface InfraHudProps {
  /** Small headline, e.g. "GPU CLUSTER". */
  title?: string;
  metrics: InfraHudMetric[];
  /** Single standout figure, e.g. { label: "NETWORK", value: "8.4 Tb/s" }. */
  figure?: { label: string; value: string };
  /** Whole-number counter, e.g. { label: "ACTIVE NODES", value: 128 }. */
  counter?: { label: string; value: number };
  statusLines?: string[];
  className?: string;
}

/**
 * Decorative "infrastructure is really running back there" panel. Demo data
 * only — this renders whatever numbers it is given and does not talk to any
 * backend. Values drift by a percent or two on a slow interval so the panel
 * doesn't read as a static screenshot, and every number counts up once on
 * first scroll into view rather than on mount.
 *
 * Intentionally text/number-first rather than chart-heavy so it stays a
 * background HUD rather than turning the hero into a dashboard.
 */
export function InfraHud({ title, metrics, figure, counter, statusLines, className }: InfraHudProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [live, setLive] = useState(metrics);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!revealed || prefersReducedMotion()) return;

    const interval = setInterval(() => {
      setLive((current) =>
        current.map((metric) => {
          const drift = (Math.random() - 0.5) * 4; // ±2 points
          const next = Math.min(98, Math.max(4, metric.percent + drift));
          return { ...metric, percent: next };
        }),
      );
    }, 3200);

    return () => clearInterval(interval);
  }, [revealed]);

  if (!isEffectEnabled("infraHud")) return null;

  return (
    <div
      ref={ref}
      aria-hidden
      data-revealed={revealed ? "true" : "false"}
      className={cn(
        "infra-hud pointer-events-none flex w-full max-w-[260px] flex-col gap-[14px] rounded-field border border-accent-line bg-glass/80 p-[18px] font-mono backdrop-blur-card",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        {title ? (
          <span className="text-[10px] font-medium leading-[10px] tracking-[1.2px] text-ink-mute">
            {title}
          </span>
        ) : (
          <span />
        )}
        <span className="pulse-dot size-[6px] rounded-full bg-accent" />
      </div>

      {live.map((metric) => (
        <div key={metric.label} className="flex flex-col gap-[6px]">
          <div className="flex items-center justify-between text-[10px] leading-[10px] tracking-[1.2px] text-ink-mute">
            <span>{metric.label}</span>
            <span className="text-accent">{Math.round(metric.percent)}%</span>
          </div>
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-line-faint">
            <div
              className="infra-hud-bar h-full rounded-full bg-accent"
              style={{ width: `${revealed ? metric.percent : 0}%` }}
            />
          </div>
        </div>
      ))}

      {figure ? (
        <div className="flex items-center justify-between border-t border-line-faint pt-[12px] text-[10px] leading-[10px] tracking-[1.2px] text-ink-mute">
          <span>{figure.label}</span>
          <span className="text-[13px] font-semibold leading-[13px] tracking-normal text-accent">
            {figure.value}
          </span>
        </div>
      ) : null}

      {counter ? (
        <div className="flex items-center justify-between text-[10px] leading-[10px] tracking-[1.2px] text-ink-mute">
          <span>{counter.label}</span>
          <span className="text-[13px] font-semibold leading-[13px] tracking-normal text-white">
            {revealed ? counter.value : 0}
          </span>
        </div>
      ) : null}

      {statusLines?.length ? (
        <div className="flex flex-col gap-[6px] border-t border-line-faint pt-[12px]">
          {statusLines.map((line) => (
            <div
              key={line}
              className="flex items-center gap-[8px] text-[10px] leading-[10px] tracking-[1.2px] text-ink-mute"
            >
              <span aria-hidden className="pulse-dot size-[5px] shrink-0 rounded-full bg-accent" />
              {line}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
