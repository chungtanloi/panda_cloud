"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Input, Select } from "@/components/ui/Field";
import { useForm } from "@/controllers/useForm";
import { PATH_OPTIONS } from "@/config/paths";
import { email as emailRule, required } from "@/lib/validation";
import type { LeadRequest } from "@/models/lead";
import type { UserPath } from "@/models/auth";
import { api, normalizeError } from "@/services/api";
import { SectionHeading } from "./SectionHeading";

/**
 * Lead-capture form. Added section — not in the Figma file.
 *
 * Follows the same rules as every other form in the app: validation from
 * lib/validation, state from useForm, and submission through services/api so
 * it works against the mock adapter today and the real backend later with no
 * code change. Contract: docs/API_CONTRACT.md § 8.
 */
export function ContactForm({
  eyebrow = "Get in touch",
  title,
  subtitle,
  defaultInterest = "land_owner",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  defaultInterest?: UserPath;
}) {
  const pathname = usePathname();
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LeadRequest>(
    { fullName: "", email: "", company: "", interest: defaultInterest, message: "" },
    {
      fullName: required("Full name"),
      email: emailRule(),
    },
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!form.validateAll()) return;

    setSubmitting(true);
    try {
      const result = await api.leads.create({ ...form.values, source: pathname });
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
    <section className="flex flex-col gap-[48px]">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <Reveal className="mx-auto w-full max-w-[720px]">
        <div className="card-highlight rounded-card border border-line-hair bg-card p-[33px]">
          {reference ? (
            <div role="status" className="flex flex-col items-center gap-[12px] py-[24px] text-center">
              <span className="grid size-[48px] place-items-center rounded-full border border-accent/30 bg-accent-soft text-accent">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path
                    d="M4 10.5 8 14.5 16 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p className="font-sans text-[20px] font-medium leading-[28px] text-white">
                Thanks — we&apos;ll be in touch.
              </p>
              <p className="font-sans text-[14px] leading-[22px] text-ink-dim">
                Your reference is{" "}
                <span className="font-mono text-accent">{reference}</span>.
              </p>
              <button
                type="button"
                onClick={() => setReference(null)}
                className="pt-[8px] font-sans text-[14px] text-accent hover:underline"
              >
                Send another enquiry
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-[20px]" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-2">
                <Input
                  label="Full name"
                  autoComplete="name"
                  placeholder="Jane Cooper"
                  value={form.values.fullName}
                  onChange={(e) => form.setField("fullName", e.target.value)}
                  onBlur={() => form.blurField("fullName")}
                  error={form.touched.fullName ? form.errors.fullName : undefined}
                />

                <Input
                  label="Work email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@company.com"
                  value={form.values.email}
                  onChange={(e) => form.setField("email", e.target.value)}
                  onBlur={() => form.blurField("email")}
                  error={form.touched.email ? form.errors.email : undefined}
                />

                <Input
                  label="Company"
                  autoComplete="organization"
                  placeholder="Northwind Energy"
                  value={form.values.company ?? ""}
                  onChange={(e) => form.setField("company", e.target.value)}
                />

                <Select
                  label="I'm interested in"
                  value={form.values.interest}
                  onChange={(e) => form.setField("interest", e.target.value as UserPath)}
                  options={PATH_OPTIONS.map((option) => ({
                    value: option.id,
                    label: option.title,
                  }))}
                />
              </div>

              <div className="flex w-full flex-col gap-[8px]">
                <label
                  htmlFor="lead-message"
                  className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim"
                >
                  Message
                </label>
                <textarea
                  id="lead-message"
                  rows={4}
                  placeholder="Tell us about your capacity, timeline, or workload."
                  value={form.values.message ?? ""}
                  onChange={(e) => form.setField("message", e.target.value)}
                  className="w-full resize-y rounded-field border border-line-strong bg-deep px-[17px] py-[15px] font-sans text-[16px] leading-normal text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
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
                className="mt-[4px] inline-flex items-center justify-center gap-[8px] rounded-full bg-accent px-[32px] py-[16px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent-fg transition-all duration-200 hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)] disabled:pointer-events-none disabled:opacity-40"
              >
                {submitting ? (
                  <span
                    aria-hidden
                    className="size-[14px] animate-spin rounded-full border-2 border-current border-t-transparent"
                  />
                ) : null}
                Send enquiry
              </button>

              <p className="text-center font-sans text-[12px] leading-[18px] text-ink-faint">
                We reply within one business day. No marketing lists.
              </p>
            </form>
          )}
        </div>
      </Reveal>
    </section>
  );
}
