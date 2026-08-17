"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Select } from "@/components/ui/Field";
import { NCNDA_STATUS_TONES } from "@/config/lifecycle";
import {
  NCNDA_STATUSES,
  NCNDA_STATUS_LABELS,
  type NcndaAgreement,
  type NcndaStatus,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

function shortDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * `/legal/agreements` — ROLE_PERMISSION_MATRIX § 6.2.
 *
 * Sorting is deliberate rather than by date: the agreements that need a human
 * are the ones mid-flight, so `sent` / `received` / `under_review` float to the
 * top and the settled ones (active, and the three terminal states) sink. A
 * Legal reviewer opening this page should see their queue, not a changelog.
 */
export function AgreementsPage() {
  const [items, setItems] = useState<readonly NcndaAgreement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
  const searchParams = useSearchParams();
  const dealId = searchParams.get("dealId");
  const [status, setStatus] = useState<NcndaStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!dealId) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const page = await api.legal.listAgreements(dealId);
      setItems(page.items);
    } catch (cause) {
      setItems(null);
      setError(normalizeError(cause));
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const rows = (items ?? []).filter((row) => status === "all" || row.status === status);
    const needsAttention: readonly NcndaStatus[] = ["sent", "received", "under_review", "drafting"];
    return [...rows].sort((a, b) => {
      const aUrgent = needsAttention.includes(a.status) ? 0 : 1;
      const bUrgent = needsAttention.includes(b.status) ? 0 : 1;
      if (aUrgent !== bUrgent) return aUrgent - bUrgent;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [items, status]);

  return (
    <WorkspacePage
      eyebrow="Legal / Agreements"
      title="NCNDA agreements"
      description="One agreement per deal and counterparty. At most one may be active at a time, and each carries a single current document version — every earlier version is immutable."
    >
      <div className="mb-6 max-w-[280px]">
        <Select
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value as NcndaStatus | "all")}
          options={[
            { value: "all", label: "All statuses" },
            ...NCNDA_STATUSES.map((value) => ({ value, label: NCNDA_STATUS_LABELS[value] })),
          ]}
        />
      </div>

      {loading ? <LoadingState label="Loading agreements" /> : null}
      {!loading && error ? <ErrorState error={error} onRetry={() => void load()} /> : null}
      {!loading && !error && visible.length === 0 ? (
        <EmptyState
          title={dealId ? "No agreements" : "Deal context required"}
          message={dealId
            ? status === "all"
              ? "Nothing has been drafted yet."
              : `No agreement is currently ${NCNDA_STATUS_LABELS[status].toLowerCase()}.`
            : "Open this page with ?dealId=<deal-id> to load agreements for a deal."}
        />
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <ul className="grid gap-3">
          {visible.map((agreement) => (
            <li key={agreement.agreementId}>
              <Link
                href={`/legal/agreements/${agreement.agreementId}`}
                className="block rounded-[20px] border border-line bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {agreement.counterpartyName ?? "Unnamed counterparty"}
                    </p>
                    <p className="mt-1 truncate text-xs text-ink-dim">
                      {agreement.dealTitle ?? agreement.dealId}
                    </p>
                  </div>
                  <StatusPill
                    label={NCNDA_STATUS_LABELS[agreement.status]}
                    tone={NCNDA_STATUS_TONES[agreement.status]}
                  />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                  <Field label="Effective" value={agreement.effectiveDate ?? "—"} />
                  <Field label="Expires" value={shortDate(agreement.expiresAt)} />
                  <Field label="Owner" value={agreement.ownerName ?? "—"} />
                  <Field label="Updated" value={shortDate(agreement.updatedAt)} />
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </WorkspacePage>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[9px] uppercase tracking-[1.2px] text-ink-mute">{label}</dt>
      <dd className="mt-1 truncate text-ink">{value}</dd>
    </div>
  );
}
