"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import type { SalesCardDetailDto } from "@/models/sales";
import { api, normalizeError } from "@/services/api";

/**
 * KYC case creation, scoped to one deal.
 *
 * The backend requires **exactly one** subject — an organization or a contact,
 * never both (`convex/kyc.ts`). That is modelled as a choice between two cards
 * rather than two optional fields, so the invalid state cannot be constructed
 * in the first place. Provider and provider reference are paired for the same
 * reason: the backend rejects one without the other.
 *
 * ⚠ `context` is the deal record. Without it there are no internal ids to send,
 * so the form disables itself and says why. It previously received a `context`
 * that was never populated by its caller, which silently disabled the submit
 * button and made KYC creation impossible from the Compliance workspace; the
 * caller now always resolves the deal first.
 */
export function CreateCaseForm({
  dealId,
  context,
  onDone,
}: {
  dealId: string;
  context: SalesCardDetailDto | null;
  onDone: () => void;
}) {
  const [subjectKind, setSubjectKind] = useState<"organization" | "contact">("organization");
  const [provider, setProvider] = useState("");
  const [providerCaseId, setProviderCaseId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const organizationAvailable = Boolean(context?.organizationId);
  const contactAvailable = Boolean(context?.primaryContact?.contactId);
  const subjectName =
    subjectKind === "organization" ? context?.organizationName : context?.primaryContact?.fullName;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const resolvedSubjectId =
      subjectKind === "organization" ? context?.organizationId : context?.primaryContact?.contactId;

    if (!resolvedSubjectId) {
      setError(
        subjectKind === "organization"
          ? "This deal has no organization. Ask Manager or Admin to complete the deal record."
          : "This deal has no primary contact. Add a contact in Sales before starting contact KYC.",
      );
      return;
    }
    if (Boolean(provider.trim()) !== Boolean(providerCaseId.trim())) {
      setError("Provider and provider reference must be filled together, or both left empty.");
      return;
    }

    setSaving(true);
    try {
      await api.compliance.createCase(dealId, {
        ...(subjectKind === "organization"
          ? { subjectOrganizationId: resolvedSubjectId }
          : { subjectContactId: resolvedSubjectId }),
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
    <form onSubmit={submit} className="mb-8 rounded-[24px] border border-line bg-surface-alt p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">KYC setup</p>
          <h2 className="mt-2 text-lg font-semibold text-ink">Choose the verification subject</h2>
          <p className="mt-1 text-xs leading-5 text-ink-dim">
            The subject comes from the selected deal. Internal ids are resolved and sent
            automatically.
          </p>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-wider text-ink-dim">
          Not started
        </span>
      </div>

      {!context ? (
        <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs leading-5 text-amber-200">
          The deal record has not resolved yet. Reopen this form from Deal Readiness once the
          customer and owner are available.
        </p>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!organizationAvailable}
          onClick={() => setSubjectKind("organization")}
          className={`rounded-2xl border p-4 text-left transition-colors disabled:opacity-40 ${
            subjectKind === "organization"
              ? "border-accent bg-accent/10"
              : "border-line bg-white/[0.02]"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Organization</p>
          <p className="mt-2 text-sm font-medium text-ink">
            {context?.organizationName ?? "Organization unavailable"}
          </p>
          <p className="mt-1 text-xs text-ink-dim">
            Company registration, ownership and source-of-funds evidence.
          </p>
        </button>

        <button
          type="button"
          disabled={!contactAvailable}
          onClick={() => setSubjectKind("contact")}
          className={`rounded-2xl border p-4 text-left transition-colors disabled:opacity-40 ${
            subjectKind === "contact" ? "border-accent bg-accent/10" : "border-line bg-white/[0.02]"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Primary contact
          </p>
          <p className="mt-2 text-sm font-medium text-ink">
            {context?.primaryContact?.fullName ?? "No primary contact"}
          </p>
          <p className="mt-1 text-xs text-ink-dim">
            Identity and address verification for an individual.
          </p>
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-white/[0.02] p-4">
        <p className="text-[10px] uppercase tracking-wider text-ink-mute">Selected subject</p>
        <p className="mt-1 text-sm text-ink">{subjectName ?? "Unavailable"}</p>
      </div>

      <details className="mt-5 rounded-[16px] border border-line bg-white/[0.02] p-4">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-ink-dim">
          Advanced provider metadata
        </summary>
        <p className="mt-2 text-xs leading-5 text-ink-dim">
          Optional metadata only. The backend does not call an external KYC provider.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            label="Provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            placeholder="internal_manual"
          />
          <Input
            label="Provider reference"
            value={providerCaseId}
            onChange={(event) => setProviderCaseId(event.target.value)}
          />
        </div>
      </details>

      {error ? (
        <p role="alert" className="mt-4 text-xs leading-5 text-red-400">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-dim">
          The new case starts at <strong className="text-ink">Not started</strong>.
        </p>
        <button
          type="submit"
          disabled={
            saving ||
            !context ||
            (subjectKind === "organization" ? !organizationAvailable : !contactAvailable)
          }
          className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create KYC case"}
        </button>
      </div>
    </form>
  );
}
