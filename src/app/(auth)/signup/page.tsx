"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { DecorativeCorners } from "@/components/layout/DecorativeCorners";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { useForm } from "@/controllers/useForm";
import { email as emailRule, minLength, required } from "@/lib/validation";
import type { SignUpRequest } from "@/models/auth";
import { normalizeError } from "@/services/api";

/**
 * Figma node 2:887 — "Sign Up | Cloud Panda".
 *   card    — 480px, rgba(51,53,57,.6), 1px rgba(58,73,75,.3), radius 16,
 *             padding 41, backdrop-blur 12, shadow 0 25px 50px -12px
 *   badge   — "ASSET OWNERS" accent pill (node 2:896)
 *   heading — 24px semibold, tracking -0.6px
 *   fields  — pill variant (radius 9999, 11px labels)
 *   submit  — 54.5px tall, full-width pill, 15px bold
 *
 * Per the design's own copy, a successful sign-up drops the user straight into
 * the Land Owner Assessment flow rather than the dashboard.
 */
export default function SignUpPage() {
  // useSearchParams requires a Suspense boundary under the App Router.
  return (
    <Suspense>
      <SignUpView />
    </Suspense>
  );
}

function SignUpView() {
  const router = useRouter();
  const params = useSearchParams();
  const { signUp } = useAuth();

  /** Same-origin relative paths only — guards against open redirects. */
  const rawReturnTo = params.get("returnTo");
  const returnTo = rawReturnTo?.startsWith("/") && !rawReturnTo.startsWith("//")
    ? rawReturnTo
    : null;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpRequest>(
    { fullName: "", email: "", password: "" },
    {
      fullName: required("Full name"),
      email: emailRule(),
      password: minLength(8, "Password"),
    },
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!form.validateAll()) return;

    setSubmitting(true);
    try {
      await signUp(form.values);
      // The design routes new sign-ups straight into the Land Owner
      // Assessment; a returnTo overrides that when the user was interrupted
      // mid-flow (e.g. downloading their report).
      router.push(returnTo ?? "/assessment");
    } catch (cause) {
      const error = normalizeError(cause);
      form.applyServerError(error);
      if (!error.fieldErrors) setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base px-[24px] py-[64px]">
      <AmbientBackground />
      <DecorativeCorners />

      <div className="relative flex w-full max-w-[480px] flex-col rounded-field border border-line bg-surface-auth p-card shadow-auth backdrop-blur-auth">
        <header className="flex flex-col gap-[7px] pb-[32px]">
          <Badge className="self-start">Asset Owners</Badge>

          <h1 className="pt-[17px] font-sans text-[24px] font-semibold leading-[31.2px] tracking-[-0.6px] text-ink">
            Create your account
          </h1>

          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
            We&apos;ll create your account and drop you straight into the Land Owner Assessment
            flow.
          </p>
        </header>

        <form className="flex flex-col gap-[16px]" onSubmit={handleSubmit} noValidate>
          <Input
            variant="pill"
            label="Full name"
            autoComplete="name"
            placeholder="Jane Doe"
            value={form.values.fullName}
            onChange={(e) => form.setField("fullName", e.target.value)}
            onBlur={() => form.blurField("fullName")}
            error={form.touched.fullName ? form.errors.fullName : undefined}
          />

          <Input
            variant="pill"
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="jane@company.com"
            value={form.values.email}
            onChange={(e) => form.setField("email", e.target.value)}
            onBlur={() => form.blurField("email")}
            error={form.touched.email ? form.errors.email : undefined}
          />

          <Input
            variant="pill"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.values.password}
            onChange={(e) => form.setField("password", e.target.value)}
            onBlur={() => form.blurField("password")}
            error={form.touched.password ? form.errors.password : undefined}
            hint="At least 8 characters."
          />

          {formError ? (
            <p role="alert" className="font-sans text-[12px] text-red-400">
              {formError}
            </p>
          ) : null}

          <div className="pt-[16px]">
            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
              className="relative flex h-[54.5px] w-full items-center justify-center gap-[8px] rounded-full bg-accent font-sans text-[15px] font-bold leading-[22.5px] text-accent-fg transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              {submitting ? (
                <span
                  aria-hidden
                  className="size-[16px] animate-spin rounded-full border-2 border-current border-t-transparent"
                />
              ) : null}
              Create Account &amp; Continue
              {!submitting ? <ArrowRight /> : null}
            </button>
          </div>
        </form>

        <p className="pt-[32px] text-center font-sans text-[14px] leading-[21px] text-ink-dim">
          Already have an account?{" "}
          <Link
            href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"}
            className="text-accent hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

/** Figma node 2:925 — 12.7px arrow trailing the submit label. */
function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
      <path
        d="M2.5 6.5h8m0 0-3.25-3.25M10.5 6.5 7.25 9.75"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
