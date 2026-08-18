"use client";

import { useEffect, useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { PRIORITY_LABELS, VERTICAL_LABELS } from "@/config/sales";
import { useAuth } from "@/controllers/AuthContext";
import { hasRole } from "@/models/auth";
import type { ContactLookupItem, OrganizationLookupItem, OwnerLookupItem } from "@/models/lookups";
import { api, normalizeError } from "@/services/api";
import type {
  DealPriority,
  DealVertical,
  SalesCardCreateRequest,
  SalesColumnDto,
} from "@/models/sales";

/**
 * Manual outbound / offline deal entry — `POST /api/v1/sales/cards` (UC-004).
 *
 * Scope, stated plainly so nobody widens it by accident: this is for deals a
 * staff member enters by hand. A deal that came from a customer flow is created
 * by the backend inside the submission transaction (API_CONTRACT § 9.2); the
 * board must never create a duplicate after a form submission.
 *
 * Authorization is the backend's: it requires an active `sales`, `manager` or
 * `admin` membership and answers 403 otherwise. The button that opens this
 * modal is a convenience guard only.
 *
 * Existing-record selectors:
 *
 *   organization — a Sales member types a company name, exactly as
 *     `API_CONTRACT.md` § 9.2 describes. The backend matches it
 *     case-insensitively against existing organizations and creates a
 *     `customer`/`prospect` organization when nothing matches, which keeps
 *     UC-004's "a deal references a real organization" invariant without
 *     needing an organization-management screen that does not exist yet.
 *     Because matching is by name, two spellings of the same company produce
 *     two organizations; deduplication is a back-office concern, not this
 *     form's. A Manager/Admin also receives only the authorized organization
 *     lookup results and can select an existing opaque organization id.
 *
 *   owner — a Sales member leaves this absent, so the backend assigns the
 *     authenticated caller. A Manager/Admin can select an authorized active
 *     owner from the typed lookup. The backend independently validates scope
 *     and membership on creation.
 *
 *   contact — a new contact needs a name plus at least one of email/phone,
 *     matching DEALFLOW § 5.1. With an existing selected organization, the
 *     operator may instead choose an authorized existing contact by opaque id.
 *     A new contact needs
 *     ("Contact used for lead/KYC must have at least email or phone"). The
 *     backend finds-or-creates a `contacts` row inside the company. Requiring
 *     a reachable contact is the point: a pipeline card nobody can call is not
 *     a workable deal, and UC-006 has staff logging calls and emails against
 *     the deal from day one.
 *
 * Field order follows how a salesperson actually holds the information —
 * "who is this" before "what is the deal" before "how much and when" — rather
 * than the order the wire DTO happens to declare.
 */

interface Props {
  open: boolean;
  columns: readonly SalesColumnDto[];
  onClose: () => void;
  onCreated: () => void;
}

interface FormState {
  organizationName: string;
  contactName: string;
  contactJobTitle: string;
  contactEmail: string;
  contactPhone: string;
  title: string;
  vertical: DealVertical;
  priority: DealPriority;
  stageId: string;
  description: string;
  estimatedValueMajor: string;
  currency: string;
  probabilityPercent: string;
  expectedCloseDate: string;
}

const EMPTY: FormState = {
  organizationName: "",
  contactName: "",
  contactJobTitle: "",
  contactEmail: "",
  contactPhone: "",
  title: "",
  vertical: "land",
  priority: "normal",
  stageId: "",
  description: "",
  estimatedValueMajor: "",
  currency: "USD",
  probabilityPercent: "",
  expectedCloseDate: "",
};

/**
 * Converts a major-unit amount typed by a human into the contract's minor-unit
 * string. The wire format is a string precisely so large values never round
 * through a float (collaboration workflow § 7).
 *
 * Returns `undefined` for an empty input and `null` for an unparseable one.
 */
export function toMinorUnits(major: string): string | undefined | null {
  const trimmed = major.trim();
  if (!trimmed) return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  return `${BigInt(whole ?? "0") * 100n + BigInt(fraction.padEnd(2, "0"))}`;
}

/**
 * A labelled group of fields. Rendered as a `fieldset` so the grouping is
 * announced to screen readers, not just drawn.
 */
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mt-6 border-0 p-0">
      <legend className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
        {title}
      </legend>
      {hint ? <p className="mb-4 text-xs leading-5 text-ink-dim">{hint}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function ManualDealModal({ open, columns, onClose, onCreated }: Props) {
  const { profile } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [organizationMatches, setOrganizationMatches] = useState<OrganizationLookupItem[]>([]);
  const [contactMatches, setContactMatches] = useState<ContactLookupItem[]>([]);
  const [ownerMatches, setOwnerMatches] = useState<OwnerLookupItem[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationLookupItem | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactLookupItem | null>(null);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<OwnerLookupItem | null>(null);
  const canSelectExisting = hasRole(profile, "manager") || hasRole(profile, "admin");

  // Reset whenever the modal is reopened so a previous failure never leaks in.
  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
      setFieldErrors({});
      setOrganizationMatches([]); setContactMatches([]); setOwnerMatches([]);
      setSelectedOrganization(null); setSelectedContact(null); setSelectedOwner(null); setOwnerQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!canSelectExisting || form.organizationName.trim().length < 2 || selectedOrganization) { setOrganizationMatches([]); return; }
    let active = true;
    api.lookup.organizations({ q: form.organizationName.trim(), limit: 8 })
      .then((page) => active && setOrganizationMatches(page.items))
      .catch(() => active && setOrganizationMatches([]));
    return () => { active = false; };
  }, [canSelectExisting, form.organizationName, selectedOrganization]);

  useEffect(() => {
    if (!selectedOrganization || form.contactName.trim().length < 2 || selectedContact) { setContactMatches([]); return; }
    let active = true;
    api.lookup.contacts({ organizationId: selectedOrganization.organizationId, q: form.contactName.trim(), limit: 8 })
      .then((page) => active && setContactMatches(page.items))
      .catch(() => active && setContactMatches([]));
    return () => { active = false; };
  }, [form.contactName, selectedContact, selectedOrganization]);

  useEffect(() => {
    if (!canSelectExisting || ownerQuery.trim().length < 2 || selectedOwner) { setOwnerMatches([]); return; }
    let active = true;
    api.lookup.owners({ q: ownerQuery.trim(), limit: 8 })
      .then((page) => active && setOwnerMatches(page.items))
      .catch(() => active && setOwnerMatches([]));
    return () => { active = false; };
  }, [canSelectExisting, ownerQuery, selectedOwner]);

  const stageOptions = useMemo(
    () => [
      { value: "", label: "New (default)" },
      ...columns.map((column) => ({ value: column.columnId, label: column.name })),
    ],
    [columns],
  );

  if (!open) return null;

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    if (key === "organizationName") { setSelectedOrganization(null); setSelectedContact(null); }
    if (key === "contactName") setSelectedContact(null);
  }

  function validate(): SalesCardCreateRequest | null {
    const errors: Partial<Record<keyof FormState, string>> = {};

    const title = form.title.trim();
    if (!title) errors.title = "A title is required.";
    else if (title.length > 200) errors.title = "Keep the title under 200 characters.";

    const organizationName = form.organizationName.trim();
    if (!selectedOrganization && !organizationName) errors.organizationName = "A company name is required.";
    else if (organizationName.length > 200) {
      errors.organizationName = "Keep the company name under 200 characters.";
    }

    const contactName = form.contactName.trim();
    const contactEmail = form.contactEmail.trim();
    const contactPhone = form.contactPhone.trim();
    const contactJobTitle = form.contactJobTitle.trim();

    if (!selectedContact && !contactName) errors.contactName = "A contact name is required.";
    else if (!selectedContact && contactName.length > 200) errors.contactName = "Keep the name under 200 characters.";

    // DEALFLOW § 5.1. The error is attached to both fields so it is visible
    // wherever the salesperson is looking when they submit.
    if (!selectedContact && !contactEmail && !contactPhone) {
      errors.contactEmail = "Give an email or a phone number so this deal can be worked.";
      errors.contactPhone = "Give an email or a phone number so this deal can be worked.";
    }
    // Deliberately permissive — same shape check as the backend. Rejecting an
    // unusual but real address would block a sale.
    if (contactEmail && !/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(contactEmail)) {
      errors.contactEmail = "That does not look like an email address.";
    }
    if (contactPhone.length > 40) errors.contactPhone = "Keep the phone number under 40 characters.";
    if (contactJobTitle.length > 200) errors.contactJobTitle = "Keep the job title under 200 characters.";

    const minor = toMinorUnits(form.estimatedValueMajor);
    if (minor === null) errors.estimatedValueMajor = "Use a number with at most two decimals.";
    if (minor !== undefined && minor !== null && !/^[A-Z]{3}$/.test(form.currency.trim().toUpperCase())) {
      errors.currency = "A three-letter ISO currency is required with an amount.";
    }

    let probabilityPercent: number | undefined;
    if (form.probabilityPercent.trim()) {
      const parsed = Number(form.probabilityPercent);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
        errors.probabilityPercent = "Use a whole number from 0 to 100.";
      } else {
        probabilityPercent = parsed;
      }
    }

    const expectedCloseDate = form.expectedCloseDate.trim();
    if (expectedCloseDate && !/^\d{4}-\d{2}-\d{2}$/.test(expectedCloseDate)) {
      errors.expectedCloseDate = "Use YYYY-MM-DD.";
    }

    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return null;

    // Omit optional fields entirely rather than sending null — the contract
    // treats an absent field as "not provided" (workflow § 7).
    return {
      title,
      // Exactly one organization/contact form is sent. The selected opaque
      // id is display-only until this submit; authorization stays backend-side.
      ...(selectedOrganization ? { organizationId: selectedOrganization.organizationId } : { organizationName }),
      ...(selectedContact ? { primaryContactId: selectedContact.contactId } : {
        contactName,
        ...(contactEmail ? { contactEmail } : {}),
        ...(contactPhone ? { contactPhone } : {}),
        ...(contactJobTitle ? { contactJobTitle } : {}),
      }),
      ...(selectedOwner ? { ownerId: selectedOwner.userId } : {}),
      vertical: form.vertical,
      priority: form.priority,
      ...(form.stageId ? { stageId: form.stageId } : {}),
      ...(form.description.trim() ? { description: form.description.trim() } : {}),
      ...(minor ? { estimatedValueMinor: minor, currency: form.currency.trim().toUpperCase() } : {}),
      ...(probabilityPercent !== undefined ? { probabilityPercent } : {}),
      ...(expectedCloseDate ? { expectedCloseDate } : {}),
    };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const payload = validate();
    if (!payload) return;

    setSaving(true);
    try {
      await api.sales.createCard(payload);
      onCreated();
      onClose();
    } catch (cause) {
      const normalized = normalizeError(cause);
      // Surface the correlation id: an integration defect ticket requires it
      // (collaboration workflow § 18).
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
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/70 p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <form
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        aria-labelledby="manual-deal-title"
        className="my-8 w-full max-w-2xl rounded-[28px] border border-line bg-surface-alt p-6 shadow-2xl backdrop-blur-auth"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              Manual entry
            </p>
            <h2 id="manual-deal-title" className="mt-2 text-2xl font-semibold text-ink">
              Add pipeline card
            </h2>
            <p className="mt-2 max-w-lg text-xs leading-5 text-ink-dim">
              For outbound or offline deals only. Cards from customer forms are created
              automatically by the backend — do not re-enter them here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-xl leading-none text-ink-dim hover:text-ink"
          >
            ×
          </button>
        </div>

        <Section
          title="Customer"
          hint="Who the deal is with, and how to reach them. Saved to the company record, not just this card."
        >
          <div className="sm:col-span-2">
            <Input
              label="Company name *"
              value={form.organizationName}
              onChange={(event) => field("organizationName", event.target.value)}
              error={fieldErrors.organizationName}
              placeholder="Acme AI"
              hint="Matched to an existing company, or created if it is new."
            />
            {selectedOrganization ? <p className="mt-2 text-xs text-ink-dim">Using existing organization <strong className="text-ink">{selectedOrganization.displayName}</strong> <button type="button" className="text-accent underline" onClick={() => setSelectedOrganization(null)}>Use typed name instead</button></p> : null}
            {organizationMatches.length ? <div className="mt-2 overflow-hidden rounded-lg border border-white/10">{organizationMatches.map((organization) => <button type="button" key={organization.organizationId} onClick={() => { setSelectedOrganization(organization); setForm((current) => ({ ...current, organizationName: organization.displayName })); setOrganizationMatches([]); }} className="block w-full border-b border-white/5 px-3 py-2 text-left text-sm text-ink hover:bg-white/[0.03]">{organization.displayName}<span className="ml-2 text-xs text-ink-dim">{organization.organizationType}</span></button>)}</div> : null}
          </div>

          <Input
            label="Contact name *"
            value={form.contactName}
            onChange={(event) => field("contactName", event.target.value)}
            error={fieldErrors.contactName}
            placeholder="Dana Okafor"
          />

          {selectedOrganization ? <div className="sm:col-span-2">{selectedContact ? <p className="text-xs text-ink-dim">Using existing contact <strong className="text-ink">{selectedContact.fullName}</strong> <button type="button" className="text-accent underline" onClick={() => setSelectedContact(null)}>Enter a new contact instead</button></p> : null}{contactMatches.length ? <div className="overflow-hidden rounded-lg border border-white/10">{contactMatches.map((contact) => <button type="button" key={contact.contactId} onClick={() => { setSelectedContact(contact); setForm((current) => ({ ...current, contactName: contact.fullName, contactEmail: contact.email ?? "", contactPhone: "", contactJobTitle: contact.jobTitle ?? "" })); setContactMatches([]); }} className="block w-full border-b border-white/5 px-3 py-2 text-left text-sm text-ink hover:bg-white/[0.03]">{contact.fullName}<span className="ml-2 text-xs text-ink-dim">{contact.email ?? contact.jobTitle ?? "Existing contact"}</span></button>)}</div> : null}</div> : null}

          <Input
            label="Job title"
            value={form.contactJobTitle}
            onChange={(event) => field("contactJobTitle", event.target.value)}
            error={fieldErrors.contactJobTitle}
            placeholder="VP Infrastructure"
          />

          <Input
            label="Phone *"
            type="tel"
            inputMode="tel"
            value={form.contactPhone}
            onChange={(event) => field("contactPhone", event.target.value)}
            error={fieldErrors.contactPhone}
            placeholder="+1 415 555 0117"
            hint="Shown on the card as a one-tap call."
          />

          <Input
            label="Email *"
            type="email"
            inputMode="email"
            value={form.contactEmail}
            onChange={(event) => field("contactEmail", event.target.value)}
            error={fieldErrors.contactEmail}
            placeholder="dana@acme.example"
            hint="At least one of phone or email is required."
          />
        </Section>

        <Section title="Opportunity" hint={`Assigned to ${profile?.user.fullName ?? "you"} — a new card belongs to whoever creates it.`}>
          <div className="sm:col-span-2">
            <Input
              label="Title *"
              value={form.title}
              onChange={(event) => field("title", event.target.value)}
              error={fieldErrors.title}
              placeholder="Acme AI — outbound GPU opportunity"
            />
          </div>

          <Select
            label="Vertical *"
            value={form.vertical}
            onChange={(event) => field("vertical", event.target.value as DealVertical)}
            options={(Object.keys(VERTICAL_LABELS) as DealVertical[]).map((value) => ({
              value,
              label: VERTICAL_LABELS[value],
            }))}
          />

          <Select
            label="Priority"
            value={form.priority}
            onChange={(event) => field("priority", event.target.value as DealPriority)}
            options={(Object.keys(PRIORITY_LABELS) as DealPriority[]).map((value) => ({
              value,
              label: PRIORITY_LABELS[value],
            }))}
          />

          <Select
            label="Stage"
            value={form.stageId}
            onChange={(event) => field("stageId", event.target.value)}
            options={stageOptions}
          />

          {canSelectExisting ? <div className="sm:col-span-2"><Input label="Owner (optional)" value={ownerQuery} onChange={(event) => { setOwnerQuery(event.target.value); setSelectedOwner(null); }} placeholder="Search active Sales, Manager, or Admin" hint={selectedOwner ? `Selected: ${selectedOwner.fullName} (${selectedOwner.role})` : "Leave empty to assign the current caller."} />{ownerMatches.length ? <div className="mt-2 overflow-hidden rounded-lg border border-white/10">{ownerMatches.map((owner) => <button type="button" key={owner.userId} onClick={() => { setSelectedOwner(owner); setOwnerQuery(owner.fullName); setOwnerMatches([]); }} className="block w-full border-b border-white/5 px-3 py-2 text-left text-sm text-ink hover:bg-white/[0.03]">{owner.fullName}<span className="ml-2 text-xs text-ink-dim">{owner.role}</span></button>)}</div> : null}</div> : null}

          <label className="flex w-full flex-col gap-[8px] sm:col-span-2">
            <span className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim">
              Description
            </span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => field("description", event.target.value)}
              className="w-full rounded-field border border-line-strong bg-deep px-[17px] py-[15px] font-sans text-[14px] text-ink transition-colors focus:border-accent focus:outline-none"
            />
          </label>
        </Section>

        <Section title="Value and timing" hint="All optional — fill them in as the deal firms up.">
          <Input
            label="Expected close date"
            placeholder="2026-12-31"
            value={form.expectedCloseDate}
            onChange={(event) => field("expectedCloseDate", event.target.value)}
            error={fieldErrors.expectedCloseDate}
          />

          <Input
            label="Estimated value"
            inputMode="decimal"
            placeholder="250000"
            value={form.estimatedValueMajor}
            onChange={(event) => field("estimatedValueMajor", event.target.value)}
            error={fieldErrors.estimatedValueMajor}
            hint="Major units. Sent to the backend in minor units."
          />

          <Input
            label="Currency"
            maxLength={3}
            value={form.currency}
            onChange={(event) => field("currency", event.target.value.toUpperCase())}
            error={fieldErrors.currency}
          />

          <Input
            label="Probability %"
            inputMode="numeric"
            placeholder="40"
            value={form.probabilityPercent}
            onChange={(event) => field("probabilityPercent", event.target.value)}
            error={fieldErrors.probabilityPercent}
          />
        </Section>

        {error ? (
          <p role="alert" className="mt-4 text-xs leading-5 text-red-400">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-line px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink-dim hover:border-accent/40 hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving || undefined}
            className="rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Adding…" : "Add card"}
          </button>
        </div>
      </form>
    </div>
  );
}
