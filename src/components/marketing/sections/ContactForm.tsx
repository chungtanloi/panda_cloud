"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Input, Select } from "@/components/ui/Field";
import { useAsync } from "@/controllers/useAsync";
import { useForm } from "@/controllers/useForm";
import {
  LEAD_BUDGETS,
  LEAD_FORM,
  LEAD_INTERESTS,
  LEAD_LOCATIONS,
  LEAD_TIMELINES,
} from "@/config/lead";
import { email as emailRule, required } from "@/lib/validation";
import type { LeadBudget, LeadInterest, LeadRequest, LeadTimeline } from "@/models/lead";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";
import { SectionHeading } from "./SectionHeading";

/**
 * Lead capture, in two display modes over one model and one endpoint.
 *
 *   "compact" — the short form embedded in marketing pages: name, email,
 *               interest, message. Long forms depress completion, so the
 *               marketing pages ask for the minimum.
 *   "full"    — the Submit Request screen (`Submit.png`): adds company, phone,
 *               GPU type, quantity, timeline, budget and location.
 *
 * Both send `LeadRequest` to `POST /leads`. Keeping one component means the
 * validation rules and option lists cannot drift between the two.
 */
export function ContactForm({
  variant = "compact",
  eyebrow,
  title,
  subtitle,
  defaultInterests = [],
  /** Where to go after a successful submit. Omit to show inline confirmation. */
  redirectTo,
}: {
  variant?: "compact" | "full";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  defaultInterests?: LeadInterest[];
  redirectTo?: (reference: string) => string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isFull = variant === "full";

  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LeadRequest>(
    {
      contactName: "",
      email: "",
      interests: defaultInterests,
      companyName: "",
      phone: "",
      gpuType: "",
      quantity: undefined,
      timeline: undefined,
      budget: undefined,
      locationPreference: "",
      useCase: "",
    },
    {
      contactName: required("Contact name"),
      email: emailRule(),
      interests: (value) => (value.length === 0 ? "Select at least one interest." : undefined),
    },
  );

  function toggleInterest(interest: LeadInterest) {
    const next = form.values.interests.includes(interest)
      ? form.values.interests.filter((item) => item !== interest)
      : [...form.values.interests, interest];
    form.setField("interests", next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!form.validateAll()) return;

    setSubmitting(true);
    try {
      const result = await api.leads.create({ ...form.values, source: pathname });
      if (redirectTo) {
        router.push(redirectTo(result.reference));
        return;
      }
      setReference(result.reference);
      form.reset();
    } catch (cause) {
      const error = normalizeError(cause);
      form.applyServerError(error);
      if (!error.fieldErrors) setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-[40px]">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <Reveal className={cn("mx-auto w-full", isFull ? "max-w-[880px]" : "max-w-[720px]")}>
        <div className="card-highlight rounded-card border border-line-hair bg-card p-[33px]">
          {reference ? (
            <SubmittedNotice reference={reference} onReset={() => setReference(null)} />
          ) : (
            <form className="flex flex-col gap-[20px]" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                {isFull ? (
                  <Input
                    label={LEAD_FORM.fields.companyName.label}
                    autoComplete="organization"
                    placeholder={LEAD_FORM.fields.companyName.placeholder}
                    value={form.values.companyName ?? ""}
                    onChange={(e) => form.setField("companyName", e.target.value)}
                  />
                ) : null}

                <Input
                  label={LEAD_FORM.fields.contactName.label}
                  autoComplete="name"
                  placeholder={LEAD_FORM.fields.contactName.placeholder}
                  value={form.values.contactName}
                  onChange={(e) => form.setField("contactName", e.target.value)}
                  onBlur={() => form.blurField("contactName")}
                  error={form.touched.contactName ? form.errors.contactName : undefined}
                />

                <Input
                  label={LEAD_FORM.fields.email.label}
                  type="email"
                  autoComplete="email"
                  placeholder={LEAD_FORM.fields.email.placeholder}
                  value={form.values.email}
                  onChange={(e) => form.setField("email", e.target.value)}
                  onBlur={() => form.blurField("email")}
                  error={form.touched.email ? form.errors.email : undefined}
                />

                {isFull ? (
                  <Input
                    label={LEAD_FORM.fields.phone.label}
                    type="tel"
                    autoComplete="tel"
                    placeholder={LEAD_FORM.fields.phone.placeholder}
                    value={form.values.phone ?? ""}
                    onChange={(e) => form.setField("phone", e.target.value)}
                  />
                ) : null}
              </div>

              {/* Interests — multi-select chips, as in the design. */}
              <fieldset className="flex flex-col gap-[10px]">
                <legend className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim">
                  {LEAD_FORM.fields.interests.label}
                </legend>

                <div className="flex flex-wrap gap-[8px]">
                  {LEAD_INTERESTS.map((interest) => {
                    const active = form.values.interests.includes(interest.value);
                    return (
                      <button
                        key={interest.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleInterest(interest.value)}
                        className={cn(
                          "rounded-full border px-[14px] py-[8px] font-sans text-[12px] leading-[16px] transition-colors",
                          active
                            ? "border-accent bg-accent-soft text-accent"
                            : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40",
                        )}
                      >
                        {interest.label}
                      </button>
                    );
                  })}
                </div>

                {form.errors.interests ? (
                  <p role="alert" className="font-sans text-[12px] text-red-400">
                    {form.errors.interests}
                  </p>
                ) : null}
              </fieldset>

              {isFull ? (
                <>
                  <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                    <GpuTypeSelect
                      value={form.values.gpuType ?? ""}
                      onChange={(value) => form.setField("gpuType", value)}
                    />

                    <Input
                      label={LEAD_FORM.fields.quantity.label}
                      type="number"
                      min={1}
                      inputMode="numeric"
                      placeholder={LEAD_FORM.fields.quantity.placeholder}
                      value={form.values.quantity ?? ""}
                      onChange={(e) =>
                        form.setField(
                          "quantity",
                          e.target.value === "" ? undefined : Number(e.target.value),
                        )
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-3">
                    <Select
                      label={LEAD_FORM.fields.timeline.label}
                      value={form.values.timeline ?? ""}
                      onChange={(e) => form.setField("timeline", e.target.value as LeadTimeline)}
                      options={[{ value: "", label: "Select…" }, ...LEAD_TIMELINES]}
                    />
                    <Select
                      label={LEAD_FORM.fields.budget.label}
                      value={form.values.budget ?? ""}
                      onChange={(e) => form.setField("budget", e.target.value as LeadBudget)}
                      options={[{ value: "", label: "Select…" }, ...LEAD_BUDGETS]}
                    />
                    <Select
                      label={LEAD_FORM.fields.location.label}
                      value={form.values.locationPreference ?? ""}
                      onChange={(e) => form.setField("locationPreference", e.target.value)}
                      options={LEAD_LOCATIONS}
                    />
                  </div>
                </>
              ) : null}

              <div className="flex w-full flex-col gap-[8px]">
                <label
                  htmlFor="lead-use-case"
                  className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim"
                >
                  {LEAD_FORM.fields.useCase.label}
                </label>
                <textarea
                  id="lead-use-case"
                  rows={isFull ? 5 : 4}
                  placeholder={LEAD_FORM.fields.useCase.placeholder}
                  value={form.values.useCase ?? ""}
                  onChange={(e) => form.setField("useCase", e.target.value)}
                  className="w-full resize-y rounded-field border border-line-strong bg-deep px-[17px] py-[15px] font-sans text-[16px] leading-normal text-ink placeholder:text-ink-faint focus:border-accent"
                />
              </div>

              {formError ? (
                <p role="alert" className="font-sans text-[12px] text-red-400">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting || undefined}
                className="mt-[4px] inline-flex items-center justify-center gap-[8px] self-start rounded-full bg-accent px-[32px] py-[14px] font-sans text-[14px] font-bold leading-[20px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)] disabled:pointer-events-none disabled:opacity-40"
              >
                {submitting ? (
                  <span
                    aria-hidden
                    className="size-[14px] animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                ) : null}
                {LEAD_FORM.submitLabel}
              </button>

              <p className="font-sans text-[12px] leading-[18px] text-ink-faint">
                {LEAD_FORM.reassurance}
              </p>
            </form>
          )}
        </div>
      </Reveal>
    </section>
  );
}

/**
 * Reads the live GPU catalogue so the list cannot drift from what is sold.
 *
 * Fetches directly rather than reading BookingContext — this form also appears
 * on marketing pages, which are outside the booking provider.
 */
function GpuTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fetchModels = useCallback(() => api.booking.listGpuModels(), []);
  const { data } = useAsync(fetchModels, { immediate: [] });
  const models = data ?? [];

  return (
    <Select
      label={LEAD_FORM.fields.gpuType.label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      options={[
        { value: "", label: LEAD_FORM.fields.gpuType.placeholder },
        ...models.map((model) => ({
          value: model.id,
          label: `${model.name} ${model.memory}`,
        })),
      ]}
    />
  );
}

function SubmittedNotice({ reference, onReset }: { reference: string; onReset: () => void }) {
  return (
    <div role="status" className="flex flex-col items-center gap-[12px] py-[24px] text-center">
      <span className="rounded-[2px] border border-accent/30 bg-accent-soft px-[10px] py-[6px] font-mono text-[11px] uppercase tracking-[1.2px] text-accent">
        Request received
      </span>

      <p className="font-sans text-[20px] font-medium leading-[28px] text-white">
        Thanks — we&apos;ll be in touch.
      </p>
      <p className="font-sans text-[14px] leading-[22px] text-ink-dim">
        Your reference is <span className="font-mono text-accent">{reference}</span>.
      </p>

      <button
        type="button"
        onClick={onReset}
        className="pt-[8px] font-sans text-[14px] text-accent hover:underline"
      >
        Send another enquiry
      </button>
    </div>
  );
}
