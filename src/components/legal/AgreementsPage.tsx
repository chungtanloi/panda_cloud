"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { StatusPill } from "@/components/workspace/StatusPill";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/states";
import { Input, Select } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { hasPermission } from "@/config/access";
import { CreateAgreementForm } from "./CreateAgreementForm";
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
  const { profile } = useAuth();
  const canManage = hasPermission(profile, "ncnda:manage");
  const [items, setItems] = useState<readonly NcndaAgreement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const dealId = searchParams.get("dealId")?.trim() ?? "";
  const [dealInput, setDealInput] = useState(dealId);
  const [status, setStatus] = useState<NcndaStatus | "all">("all");
  const [creating, setCreating] = useState(false);

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
    setDealInput(dealId);
    void load();
  }, [dealId, load]);

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
      <form className="mb-6 rounded-[20px] border border-line bg-surface-alt p-4" onSubmit={(event) => { event.preventDefault(); const next = dealInput.trim(); router.replace(next ? `/legal/agreements?dealId=${encodeURIComponent(next)}` : "/legal/agreements"); }}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1"><Input label="Deal context *" value={dealInput} onChange={(event) => setDealInput(event.target.value)} placeholder="deal_01" hint="The API lists agreements per deal." /></div>
          <button type="submit" className="rounded-full border border-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent">Open deal</button>
          {canManage && dealId ? <button type="button" onClick={() => setCreating((open) => !open)} className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg">{creating ? "Cancel" : "New agreement"}</button> : null}
        </div>
      </form>

      <div className="mb-6 max-w-[420px]">
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

      {creating && dealId ? <CreateAgreementForm dealId={dealId} onDone={() => { setCreating(false); void load(); }} /> : null}

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
