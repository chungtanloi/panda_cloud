"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SalesTransitionOptionsResponse } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

export function TransitionChecklistPanel({ dealId, revision }: { dealId: string; revision: number }) {
  const [data, setData] = useState<SalesTransitionOptionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api.sales
      .getTransitionOptions(dealId)
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((cause) => {
        if (!cancelled) setError(normalizeError(cause).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dealId, revision]);

  return (
    <section className="rounded-panel border border-line-soft bg-surface p-[14px]">
      <div className="flex items-start justify-between gap-[10px]">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[1.2px] text-accent">Stage policy</p>
          <h3 className="pt-[3px] text-[14px] font-semibold text-white">Where can this deal move?</h3>
        </div>
        <span className="rounded-full border border-line-soft px-[8px] py-[3px] font-mono text-[9px] text-ink-faint">
          rev {revision}
        </span>
      </div>

      {loading ? <p className="pt-[12px] text-[11px] text-ink-dim">Checking transition policy…</p> : null}
      {error ? <p role="alert" className="pt-[12px] text-[11px] text-red-300">Unable to load policy: {error}</p> : null}

      {data ? (
        <div className="mt-[12px] grid gap-[8px]">
          {data.options
            .filter((option) => option.columnId !== data.currentColumnId)
            .map((option) => {
              const approvalOnly = option.blockers.some((item) => item.code === "APPROVAL_REQUEST_REQUIRED");
              const requiresInput = option.blockers.every((item) =>
                ["HOLD_REASON_REQUIRED", "HOLD_FOLLOW_UP_REQUIRED", "OVERRIDE_REQUIRED"].includes(item.code),
              );
              const tone = option.allowed ? "border-emerald-300/25" : requiresInput ? "border-amber-300/25" : "border-red-300/20";
              return (
                <details key={option.columnId} className={`rounded-field border bg-deep/60 px-[11px] py-[9px] ${tone}`}>
                  <summary className="cursor-pointer list-none">
                    <span className="flex items-center justify-between gap-[10px]">
                      <span className="text-[12px] font-semibold text-ink">{option.name}</span>
                      <span className={`font-mono text-[9px] uppercase tracking-[0.7px] ${option.allowed ? "text-emerald-300" : requiresInput ? "text-amber-200" : "text-red-300"}`}>
                        {option.allowed ? "Available" : approvalOnly ? "Request approval" : requiresInput ? "Needs input" : "Blocked"}
                      </span>
                    </span>
                  </summary>
                  {option.blockers.length > 0 ? (
                    <ul className="mt-[8px] grid gap-[5px] border-t border-line-hair pt-[8px]">
                      {option.blockers.map((issue) => (
                        <li key={issue.code} className="text-[11px] leading-[17px] text-ink-dim">
                          • {issue.message}{issue.actionHref ? <> · <Link className="text-accent underline" href={issue.actionHref}>Resolve</Link></> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {option.warnings.length > 0 ? (
                    <ul className="mt-[7px] grid gap-[4px] text-[11px] leading-[17px] text-amber-100/80">
                      {option.warnings.map((issue) => <li key={issue.code}>⚠ {issue.message}</li>)}
                    </ul>
                  ) : null}
                </details>
              );
            })}
        </div>
      ) : null}
    </section>
  );
}
