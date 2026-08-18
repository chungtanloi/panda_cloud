"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { GapNotice } from "@/components/workspace/GapNotice";
import { StatusPill } from "@/components/workspace/StatusPill";
import { DealPicker } from "@/components/shared/DealPicker";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { DD_ASSESSMENT_STATUS_TONES } from "@/config/lifecycle";
import { hasPermission } from "@/config/access";
import { useAuth } from "@/controllers/AuthContext";
import {
  DD_ASSESSMENT_STATUS_LABELS,
  formatRate,
  type DdAssessmentSummary,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * `/technical/assessments` — ROLE_PERMISSION_MATRIX § 5.2.
 *
 * ⚠ WHY THIS PAGE ASKS FOR A DEAL ID INSTEAD OF SHOWING A LIST.
 *
 * `DD API.md` scopes the list operation to one deal:
 * `GET /deals/{dealId}/due-diligence/assessments`. There is no cross-deal
 * "all assessments" operation, and none may be invented — the document is
 * explicit that its five operations are the whole surface.
 *
 * A Technical user also cannot discover deal ids on their own: `resolveKanbanScope`
 * fails closed for `technical`, so the sales board answers
 * REQUIRES_RESOURCE_SCOPE → 403 for them. So there is genuinely no path from
 * "I am a technical reviewer" to "here are my assessments" in the current
 * contract.
 *
 * Rather than fake a list, the page takes the deal id it needs. Once the
 * backend adds either a cross-deal list or a deal-enumeration read for
 * Technical, this input is replaced by that call and nothing else changes.
 */
export function AssessmentsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const params = useSearchParams();
  const dealIdFromUrl = params.get("dealId") ?? "";
  const canCreate = hasPermission(profile, "dd:respond");

  const [items, setItems] = useState<readonly DdAssessmentSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async (dealId: string) => {
    if (!dealId) {
      setItems(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const page = await api.dueDiligence.listAssessments(dealId);
      setItems(page.items);
    } catch (cause) {
      setItems(null);
      setError(normalizeError(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(dealIdFromUrl);
  }, [dealIdFromUrl, load]);

  // The deal id stays in the URL so the view is shareable and survives reload.
  const openDeal = useCallback(
    (dealId: string) =>
      router.replace(
        dealId
          ? `/technical/assessments?dealId=${encodeURIComponent(dealId)}`
          : "/technical/assessments",
      ),
    [router],
  );

  const createAssessment = useCallback(async () => {
    if (!dealIdFromUrl) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.dueDiligence.createAssessment(dealIdFromUrl, {
      });
      router.push(`/technical/assessments/${created.assessmentId}`);
    } catch (cause) {
      setCreateError(normalizeError(cause).message);
    } finally {
      setCreating(false);
    }
  }, [dealIdFromUrl, router]);

  return (
    <WorkspacePage
      eyebrow="Technical / Assessments"
      title="Due Diligence assessments"
      description="Technical Due Diligence for one deal — UC-010 initialize, UC-011 respond and review. The published template carries 68 requirements: 56 IDC and 12 DL."
    >
      <section className="mb-6 rounded-[20px] border border-line bg-surface-alt p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-dim">
            Open Due Diligence from a deal or a Manager handoff, or search for one below.
          </p>
          <Link
            href="/manager/pipeline"
            className="rounded-full border border-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent"
          >
            Open pipeline
          </Link>
        </div>

        {/*
          Replaces the raw identifier field this page used to carry. The picker
          degrades to that field on its own for roles the lookup rejects — see
          `DealPicker`, and the GapNotice at the foot of this page for why the
          technical role is one of them.
        */}
        <div className="mt-4 max-w-xl">
          <DealPicker
            label="Find a deal"
            onSelect={(deal) => openDeal(deal.dealId)}
          />
        </div>
      </section>
      {dealIdFromUrl && canCreate ? (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-line bg-surface p-4">
          <div>
            <p className="text-sm font-semibold text-ink">Initialize Technical DD</p>
            <p className="mt-1 text-xs text-ink-dim">
              The backend pins the published template and creates the response rows.
            </p>
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={() => void createAssessment()}
            className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-40"
          >
            {creating ? "Initializing…" : "Create assessment"}
          </button>
        </section>
      ) : null}
      {createError ? <p role="alert" className="mb-4 text-xs text-red-300">{createError}</p> : null}
      {loading ? <LoadingState label="Loading assessments" /> : null}

      {!loading && error ? (
        <ErrorState error={error} onRetry={() => void load(dealIdFromUrl)} />
      ) : null}

      {!loading && !error && items && items.length === 0 ? (
        <EmptyState
          title="No assessments on this deal"
          message="Nothing has been initialized for this deal yet. Creating one requires the technical, manager or admin role."
        />
      ) : null}

      {!loading && !error && items && items.length > 0 ? (
        <ul className="mb-8 grid gap-4">
          {items.map((assessment) => (
            <li key={assessment.assessmentId}>
              <Link
                href={`/technical/assessments/${assessment.assessmentId}`}
                className="block rounded-[24px] border border-line bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      Due diligence assessment
                    </p>
                    <p className="mt-1 truncate text-xs text-ink-dim">
                      Pinned template · {assessment.templateVersionId}
                    </p>
                  </div>
                  <StatusPill
                    label={DD_ASSESSMENT_STATUS_LABELS[assessment.status]}
                    tone={DD_ASSESSMENT_STATUS_TONES[assessment.status]}
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Metric label="Completion" value={formatRate(assessment.metrics?.completionRate)} />
                  <Metric label="Compliance" value={formatRate(assessment.metrics?.complianceRate)} />
                  <Metric
                    label="Reviewed"
                    value={assessment.metrics ? `${assessment.metrics.reviewedItems} / ${assessment.metrics.totalItems}` : "—"}
                  />
                  <Metric
                    label="Critical failures"
                    value={assessment.metrics ? String(assessment.metrics.criticalFailures) : "—"}
                    alarming={(assessment.metrics?.criticalFailures ?? 0) > 0}
                  />
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <GapNotice
        tone="blocked"
        title="There is no cross-deal assessment list"
        source="DD API.md (5 operations, 4 paths) · convex/lib/authorization.ts resolveKanbanScope"
      >
        <p>
          The only list operation is scoped to one deal
          (<code>GET /deals/{"{dealId}"}/due-diligence/assessments</code>), and a Technical
          identity cannot enumerate deals: the Kanban scope resolver fails closed for
          that role, so the sales board answers 403.
        </p>
        <p>
          <code>GET /api/v1/lookups/deals</code> shipped on 2026-08-18 and would solve the
          entry problem, but it resolves the same Kanban scope, so a Technical
          identity receives 403 from it too. The picker above therefore falls
          back to an identifier field for this role.
        </p>
        <p>
          Until the backend adds a cross-deal list — or grants Technical a scope
          that returns the deals they are assigned to — this page needs the deal
          id handed to it. No list was faked to hide that.
        </p>
      </GapNotice>
    </WorkspacePage>
  );
}

function Metric({
  label,
  value,
  alarming,
}: {
  label: string;
  value: string;
  alarming?: boolean;
}) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">{label}</dt>
      <dd
        className={
          alarming
            ? "mt-1 text-lg font-semibold text-red-300"
            : "mt-1 text-lg font-semibold text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}
