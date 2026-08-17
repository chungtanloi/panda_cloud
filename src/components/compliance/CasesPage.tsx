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
import { KYC_RISK_TONES, KYC_STATUS_TONES } from "@/config/lifecycle";
import {
  KYC_RISK_LABELS,
  KYC_STATUSES,
  KYC_STATUS_LABELS,
  subjectLabel,
  type KycCase,
  type KycStatus,
} from "@/models";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * `/compliance/cases` — ROLE_PERMISSION_MATRIX § 7.2, "Danh sách và tạo KYC cases".
 *
 * The create form encodes the backend's subject rule as a **choice**, not two
 * optional fields: `convex/kyc.ts` requires exactly one of an organization or a
 * contact, so a radio makes the invalid state unreachable instead of merely
 * rejected. Same reasoning behind pairing provider and provider case id.
 */
export function CasesPage() {
  const params = useSearchParams();
  const router = useRouter();
  const dealId = params.get("dealId")?.trim() ?? "";
  const { profile } = useAuth();
  const canManage = hasPermission(profile, "kyc:manage");

  const [items, setItems] = useState<readonly KycCase[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);
  const [status, setStatus] = useState<KycStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [dealInput, setDealInput] = useState(dealId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!dealId) { setItems([]); return; }
      const page = await api.compliance.listCases(dealId);
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
    // Blocked and errored cases first — those are the ones that stall a deal.
    const urgent: readonly KycStatus[] = ["provider_error", "rejected", "pending_documents", "under_review"];
    return [...rows].sort((a, b) => {
      const aRank = urgent.indexOf(a.status);
      const bRank = urgent.indexOf(b.status);
      if (aRank !== bRank) return (aRank === -1 ? 99 : aRank) - (bRank === -1 ? 99 : bRank);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [items, status]);

  return (
    <WorkspacePage
      eyebrow="Compliance / Cases"
      title="KYC cases"
      description="One subject per case — an organization or a contact, never both. Status and risk are materialized onto the deal so the other workspaces can read them."
    >
      <form className="mb-6 rounded-[20px] border border-line bg-surface-alt p-4" onSubmit={(event) => {
        event.preventDefault();
        const next = dealInput.trim();
        router.replace(next ? "/compliance/cases?dealId=" + encodeURIComponent(next) : "/compliance/cases");
      }}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1"><Input label="Deal context *" value={dealInput} onChange={(event) => setDealInput(event.target.value)} placeholder="deal_01" hint="The API lists KYC cases per deal." /></div>
          <button type="submit" className="rounded-full border border-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent">Open deal</button>
          {canManage && dealId ? <button type="button" onClick={() => setCreating((open) => !open)} className="rounded-full bg-accent px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg">{creating ? "Cancel" : "New case"}</button> : null}
        </div>
      </form>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-[280px] max-w-[320px] flex-1">
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value as KycStatus | "all")}
            options={[
              { value: "all", label: "All statuses" },
              ...KYC_STATUSES.map((value) => ({ value, label: KYC_STATUS_LABELS[value] })),
            ]}
          />
        </div>
      </div>

      {!dealId ? <EmptyState title="Deal context required" message="Open this workspace with ?dealId=... to load KYC cases." /> : null}
      {creating && dealId ? (
        <CreateCaseForm
          dealId={dealId}
          onDone={() => {
            setCreating(false);
            void load();
          }}
        />
      ) : null}

      {loading ? <LoadingState label="Loading cases" /> : null}
      {!loading && error ? <ErrorState error={error} onRetry={() => void load()} /> : null}
      {!loading && !error && visible.length === 0 ? (
        <EmptyState title="No cases" message="Nothing matches this filter." />
      ) : null}

      {!loading && !error && visible.length > 0 ? (
        <ul className="grid gap-3">
          {visible.map((kycCase) => (
            <li key={kycCase.caseId}>
              <Link
                href={`/compliance/cases/${kycCase.caseId}`}
                className="block rounded-[20px] border border-line bg-surface p-5 transition-colors hover:border-accent/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {subjectLabel(kycCase.subject)}
                    </p>
                    <p className="mt-1 truncate text-xs text-ink-dim">
                      {kycCase.subject.kind === "organization" ? "Organization" : "Contact"} ·{" "}
                      {kycCase.dealTitle ?? kycCase.dealId}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {kycCase.riskLevel ? (
                      <StatusPill
                        label={`Risk: ${KYC_RISK_LABELS[kycCase.riskLevel]}`}
                        tone={KYC_RISK_TONES[kycCase.riskLevel]}
                      />
                    ) : null}
                    <StatusPill
                      label={KYC_STATUS_LABELS[kycCase.status]}
                      tone={KYC_STATUS_TONES[kycCase.status]}
                    />
                  </div>
                </div>
                {kycCase.rejectionReason ? (
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-red-300">
                    {kycCase.rejectionReason}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </WorkspacePage>
  );
}

function CreateCaseForm({ dealId, onDone }: { dealId: string; onDone: () => void }) {
  const [subjectKind, setSubjectKind] = useState<"organization" | "contact">("organization");
  const [subjectId, setSubjectId] = useState("");
  const [provider, setProvider] = useState("");
  const [providerCaseId, setProviderCaseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!subjectId.trim()) {
      setError("A subject id is required.");
      return;
    }
    // Mirrors the backend: both together or neither.
    if (Boolean(provider.trim()) !== Boolean(providerCaseId.trim())) {
      setError("Provider and provider case id must be filled in together, or both left empty.");
      return;
    }

    setSaving(true);
    try {
      await api.compliance.createCase(dealId, {
        ...(subjectKind === "organization"
          ? { subjectOrganizationId: subjectId.trim() }
          : { subjectContactId: subjectId.trim() }),
        ...(provider.trim()
          ? { provider: provider.trim(), providerCaseId: providerCaseId.trim() }
          : {}),
      });
      onDone();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(
        normalized.correlationId
          ? `${normalized.message} (correlation ${normalized.correlationId})`
          : normalized.message,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-8 rounded-[24px] border border-line bg-surface-alt p-6"
    >
      <h2 className="text-sm font-semibold text-ink">New KYC case</h2>
      <p className="mt-1 text-xs leading-5 text-ink-dim">
        Exactly one subject. Ids are entered directly — there is no organization or
        contact lookup operation in the contract yet.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          label="Deal id"
          value={dealId}
          readOnly
        />

        <Select
          label="Subject type *"
          value={subjectKind}
          onChange={(event) => setSubjectKind(event.target.value as "organization" | "contact")}
          options={[
            { value: "organization", label: "Organization" },
            { value: "contact", label: "Contact" },
          ]}
        />

        <div className="sm:col-span-2">
          <Input
            label={subjectKind === "organization" ? "Organization id *" : "Contact id *"}
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            hint="Exactly one subject per case — the backend rejects both or neither."
          />
        </div>

        <Input
          label="Provider"
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          placeholder="sumsub"
          hint="Optional, but paired with the case id below."
        />

        <Input
          label="Provider case id"
          value={providerCaseId}
          onChange={(event) => setProviderCaseId(event.target.value)}
          hint="A duplicate provider case is rejected as a conflict."
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-xs leading-5 text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create case"}
        </button>
      </div>
    </form>
  );
}
