"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { GapNotice } from "@/components/workspace/GapNotice";
import { StatusPill } from "@/components/workspace/StatusPill";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { Select } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import { DD_ASSESSMENT_STATUS_TONES, DD_RESPONSE_STATUS_TONES } from "@/config/lifecycle";
import {
  DD_ASSESSMENT_STATUS_LABELS,
  DD_RESPONSE_STATUSES,
  DD_RESPONSE_STATUS_LABELS,
  formatRate,
  type DdAssessmentDetail as Detail,
  type DdResponse,
  type DdResponseStatus,
  type DdTemplateItem,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * `/technical/assessments/[id]` — the review surface (UC-011).
 *
 * Concurrency, stated once so every writer here follows it: the backend creates
 * one response row for every published template item, each carries its own
 * positive revision, and every write sends that `expectedRevision`.
 *
 * On 409 the row is re-read rather than retried blindly: someone else moved,
 * and overwriting their work silently is worse than making this reviewer look
 * again.
 */
export function AssessmentDetail({ assessmentId }: { assessmentId: string }) {
  const { profile } = useAuth();
  const canRespond = hasPermission(profile, "dd:respond");

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assessment, progress] = await Promise.all([
        api.dueDiligence.getAssessment(assessmentId),
        api.dueDiligence.getProgress(assessmentId),
      ]);
      setDetail({ ...assessment, metrics: progress.live });
    } catch (cause) {
      setDetail(null);
      setError(normalizeError(cause));
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const responsesByItem = useMemo(() => {
    const map = new Map<string, DdResponse>();
    for (const response of detail?.responses ?? []) map.set(response.templateItemId, response);
    return map;
  }, [detail]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const item of detail?.items ?? []) seen.add(item.category);
    return [...seen];
  }, [detail]);

  const visibleItems = useMemo(() => {
    const items = detail?.items ?? [];
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!onlyOpen) return true;
      const status = responsesByItem.get(item.id)?.status ?? "not_reviewed";
      return status === "not_reviewed" || status === "information_pending" || status === "needs_verification";
    });
  }, [detail, category, onlyOpen, responsesByItem]);

  const terminal = detail?.status === "completed" || detail?.status === "cancelled";

  async function save(item: DdTemplateItem, status: DdResponseStatus) {
    if (!detail) return;
    const response = responsesByItem.get(item.id);
    if (!response) {
      setWriteError("The assessment did not return a response revision for this requirement. Reload before editing.");
      return;
    }
    setSavingItemId(item.id);
    setWriteError(null);
    try {
      await api.dueDiligence.updateResponse(detail.assessmentId, item.id, {
        status,
        // The backend initializes every response row at assessment creation.
        expectedRevision: response.revision,
      });
      await load();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setWriteError(
        normalized.correlationId
          ? `${normalized.message} (correlation ${normalized.correlationId})`
          : normalized.message,
      );
      // A 409 means the server moved on. Re-read instead of retrying.
      if (normalized.status === 409) await load();
    } finally {
      setSavingItemId(null);
    }
  }

  if (loading) return <LoadingState label="Loading assessment" />;
  if (error) return <ErrorState error={error} onRetry={() => void load()} />;
  if (!detail) return null;

  return (
    <WorkspacePage
      eyebrow="Technical / Assessment"
      title="Due diligence assessment"
      description="Technical assessment against the server-pinned template."
      stats={[
        { label: "Completion", value: formatRate(detail.metrics?.completionRate), detail: detail.metrics ? `${detail.metrics.reviewedItems} of ${detail.metrics.totalItems} reviewed` : "Not materialized yet" },
        { label: "Compliance", value: formatRate(detail.metrics?.complianceRate), detail: "Excludes not-applicable items" },
        { label: "Critical failures", value: String(detail.metrics?.criticalFailures ?? "—") },
        { label: "Status", value: DD_ASSESSMENT_STATUS_LABELS[detail.status] },
      ]}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px]">
            <Select
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              options={[
                { value: "all", label: `All categories (${detail.items.length})` },
                ...categories.map((value) => ({ value, label: value })),
              ]}
            />
          </div>
          <label className="flex items-center gap-2 pb-[15px] text-xs text-ink-dim">
            <input
              type="checkbox"
              checked={onlyOpen}
              onChange={(event) => setOnlyOpen(event.target.checked)}
              className="size-4 accent-[color:var(--accent,#7dd3fc)]"
            />
            Only items still needing work
          </label>
        </div>
        <Link
          href={`/technical/assessments/${detail.assessmentId}/evidence`}
          className="rounded-full border border-line px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-dim hover:border-accent/40 hover:text-ink"
        >
          Evidence
        </Link>
      </div>

      {terminal ? (
        <div className="mb-6">
          <GapNotice tone="gap" title={`This assessment is ${detail.status}`} source="DD API.md — OCC section">
            <p>
              Responses can no longer be edited: the backend answers 409 CONFLICT for a
              write against a completed or cancelled assessment. The controls below are
              disabled to match.
            </p>
          </GapNotice>
        </div>
      ) : null}

      {writeError ? (
        <p role="alert" className="mb-4 text-xs leading-5 text-red-400">
          {writeError}
        </p>
      ) : null}

      <ul className="grid gap-3">
        {visibleItems.map((item) => {
          const response = responsesByItem.get(item.id);
          const status = response?.status ?? "not_reviewed";
          const saving = savingItemId === item.id;
          return (
            <li
              key={item.id}
              className={cn(
                "rounded-[20px] border bg-surface p-5",
                item.criticality === "critical" && status === "non_compliant"
                  ? "border-red-400/40"
                  : "border-line",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[1px] text-ink-faint">
                    {item.requirementCode} · {item.category}
                    {item.subcategory ? ` · ${item.subcategory}` : ""}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-ink">{item.question}</p>
                  {item.targetCriteria ? (
                    <p className="mt-1 text-xs leading-5 text-ink-dim">
                      Target: {item.targetCriteria}
                      {item.unit ? ` ${item.unit}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <StatusPill
                    label={item.criticality}
                    tone={item.criticality === "critical" ? "bad" : "neutral"}
                  />
                  <StatusPill
                    label={DD_RESPONSE_STATUS_LABELS[status]}
                    tone={DD_RESPONSE_STATUS_TONES[status]}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[220px]">
                  <Select
                    label="Response"
                    value={status}
                    disabled={!canRespond || terminal || saving}
                    onChange={(event) => void save(item, event.target.value as DdResponseStatus)}
                    options={DD_RESPONSE_STATUSES.map((value) => ({
                      value,
                      label: DD_RESPONSE_STATUS_LABELS[value],
                    }))}
                  />
                </div>
                {response?.reviewedAt ? (
                  <span className="pb-3 text-xs text-ink-dim">Reviewed by the recorded response update.</span>
                ) : null}
                {saving ? <span className="pb-3 text-xs text-ink-dim">Saving…</span> : null}
              </div>
            </li>
          );
        })}
      </ul>

      {visibleItems.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-dim">
          No requirements match this filter.
        </p>
      ) : null}
    </WorkspacePage>
  );
}
