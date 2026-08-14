"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { DecorativeCorners } from "@/components/layout/DecorativeCorners";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { useForm } from "@/controllers/useForm";
import { email as emailRule, minLength, required } from "@/lib/validation";
import { clerkEnabled } from "@/services/config";
import { ClerkNotConfigured, clerkErrorMessage } from "@/components/auth/AuthCard";

/**
 * Figma node 2:887 — "Sign Up | Cloud Panda". Card, badge, field variants and
 * submit button are unchanged; the handler is a Clerk custom flow.
 *
 * The email verification step is **required, not cosmetic**: the gateway
 * refuses to create a PandaCloud profile without a verified primary email and
 * answers `409 IDENTITY_EMAIL_REQUIRED`
 * (`PandaCloudBackend/src/integrations/clerk.ts` → `getTrustedProfile`).
 *
 * Per the design's own copy, a completed sign-up drops the user straight into
 * the Land Owner Assessment flow.
 */
export default function SignUpPage() {
  return (
    <Suspense>
      {clerkEnabled ? <SignUpView /> : <ClerkNotConfigured action="Sign up" />}
    </Suspense>
  );
}

interface SignUpFields {
  fullName: string;
  email: string;
  password: string;
}

function SignUpView() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, signUp, setActive } = useSignUp();

  /** Same-origin relative paths only — guards against open redirects. */
  const rawReturnTo = params.get("returnTo");
  const returnTo = rawReturnTo?.startsWith("/") && !rawReturnTo.startsWith("//")
    ? rawReturnTo
    : null;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");

  const form = useForm<SignUpFields>(
    { fullName: "", email: "", password: "" },
    {
      fullName: required("Full name"),
      email: emailRule(),
      password: minLength(8, "Password"),
    },
  );

  const destination = returnTo ?? "/assessment";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!form.validateAll()) return;
    if (!isLoaded || !signUp) return;

    setSubmitting(true);
    try {
      const [firstName, ...rest] = form.values.fullName.trim().split(/\s+/);
      await signUp.create({
        emailAddress: form.values.email,
        password: form.values.password,
        firstName: firstName || undefined,
        lastName: rest.length ? rest.join(" ") : undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setAwaitingCode(true);
    } catch (cause) {
      setFormError(clerkErrorMessage(cause, "We could not create your account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!isLoaded || !signUp || !setActive) return;

    setSubmitting(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (attempt.status !== "complete") {
        setFormError("That code did not complete the sign-up. Check the code and try again.");
        return;
      }
      await setActive({ session: attempt.createdSessionId });
      router.push(destination);
    } catch (cause) {
      setFormError(clerkErrorMessage(cause, "That verification code is not valid."));
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
            {awaitingCode ? "Verify your email" : "Create your account"}
          </h1>

          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {awaitingCode
              ? `We sent a six-digit code to ${form.values.email}. Cloud Panda needs a verified email before it can create your profile.`
              : "We'll create your account and drop you straight into the Land Owner Assessment flow."}
          </p>
        </header>

        {awaitingCode ? (
          <form className="flex flex-col gap-[16px]" onSubmit={handleVerify} noValidate>
            <Input
              variant="pill"
              label="Verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              hint="Check your inbox, including spam."
            />

            {formError ? (
              <p role="alert" className="font-sans text-[12px] text-red-400">
                {formError}
              </p>
            ) : null}

            <div className="pt-[16px]">
              <SubmitButton submitting={submitting} label="Verify &amp; Continue" />
            </div>

            <button
              type="button"
              onClick={() => {
                setAwaitingCode(false);
                setFormError(null);
                setCode("");
              }}
              className="pt-[8px] text-center font-sans text-[13px] text-ink-dim hover:text-accent"
            >
              Use a different email
            </button>
          </form>
        ) : (
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

            {/* Clerk bot protection mounts here when the instance enables it. */}
            <div id="clerk-captcha" />

            <div className="pt-[16px]">
              <SubmitButton submitting={submitting} label="Create Account &amp; Continue" />
            </div>
          </form>
        )}

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

/** Figma node 2:922 — 54.5px full-width pill. */
function SubmitButton({ submitting, label }: { submitting: boolean; label: string }) {
  return (
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
      {label.replace("&amp;", "&")}
      {!submitting ? <ArrowRight /> : null}
    </button>
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
