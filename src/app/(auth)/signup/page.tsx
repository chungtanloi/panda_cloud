"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { DecorativeCorners } from "@/components/layout/DecorativeCorners";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { VerificationCodeInput } from "@/components/auth/VerificationCodeInput";
import { useForm } from "@/controllers/useForm";
import { email as emailRule, required, strongPassword } from "@/lib/validation";
import { safeReturnTo } from "@/lib/safeReturnTo";
import { clerkEnabled } from "@/services/config";
import { safeReturnTo } from "@/lib/returnTo";
import { ClerkNotConfigured, clerkErrorMessage } from "@/components/auth/AuthCard";

/**
 * Figma node 2:887 — "Sign Up | Panda Cloud". Card, badge, field variants and
 * submit button measurements are unchanged; the handler is a Clerk custom
 * flow. This pass reshapes the same three fields (full name, email,
 * password) into a clearer two-step experience — it adds no field the
 * `users` Convex table doesn't already expect and sends nothing beyond what
 * `signUp.create()` took before.
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

const RESEND_COOLDOWN_SECONDS = 60;

function SignUpView() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, signUp, setActive } = useSignUp();

<<<<<<< Updated upstream
  /** Same-origin relative paths only — guards against open redirects. */
  const rawReturnTo = params.get("returnTo");
  const returnTo = safeReturnTo(rawReturnTo);
=======
  /**
   * Same-origin relative paths only — guards against open redirects.
   *
   * Luật kiểm nằm ở lib/returnTo, dùng chung với login và forgot-password. Bản
   * kiểm cũ tại chỗ này (`startsWith("/") && !startsWith("//")`) để lọt
   * "/\evil.com": trình duyệt chuẩn hoá "\" thành "/", nên nó tương đương
   * "//evil.com" và mở redirect ra ngoài NGAY SAU khi tài khoản vừa được tạo
   * và phiên vừa active.
   */
  const returnTo = safeReturnTo(params.get("returnTo"));
>>>>>>> Stashed changes
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const form = useForm<SignUpFields>(
    { fullName: "", email: "", password: "" },
    {
      fullName: required("Full name"),
      email: emailRule(),
      password: strongPassword,
    },
  );

  const destination = returnTo ?? "/assessment";

  // Re-triggers the shared `.reveal` transition (globals.css) each time the
  // visible step changes, rather than inventing a second motion system.
  const step = awaitingCode ? "verify" : "details";
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

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
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
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
    if (code.length < 6) {
      setFormError("Enter all 6 digits from the code we sent you.");
      return;
    }

    setSubmitting(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
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

  async function handleResend() {
    if (!isLoaded || !signUp || resendCooldown > 0) return;
    setFormError(null);
    setResendNotice(null);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setResendNotice("We sent a new code.");
    } catch (cause) {
      setFormError(clerkErrorMessage(cause, "We could not resend the code. Please try again."));
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base px-[24px] py-[64px]">
      <AmbientBackground />
      <DecorativeCorners />

      <div className="relative flex w-full max-w-[480px] flex-col rounded-field border border-line bg-surface-auth p-card shadow-auth backdrop-blur-auth">
        <header className="flex flex-col gap-[7px] pb-[32px]">
          <div className="flex items-center justify-between">
            <Badge className="self-start">Asset Owners</Badge>
            <Badge variant="chip">{awaitingCode ? "Step 2 of 2" : "Step 1 of 2"}</Badge>
          </div>

          <h1 className="pt-[17px] font-sans text-[24px] font-semibold leading-[31.2px] tracking-[-0.6px] text-ink">
            {awaitingCode ? "Verify your email" : "Create your account"}
          </h1>

          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
            {awaitingCode
              ? `We sent a six-digit code to ${form.values.email}. Panda Cloud needs a verified email before it can create your profile.`
              : "We'll create your account and drop you straight into the Land Owner Assessment flow."}
          </p>
        </header>

        <div data-revealed={revealed ? "true" : "false"} className="reveal">
          {awaitingCode ? (
            <form className="flex flex-col gap-[16px]" onSubmit={handleVerify} noValidate>
              <VerificationCodeInput
                value={code}
                onChange={(next) => {
                  setCode(next);
                  if (formError) setFormError(null);
                }}
                disabled={submitting}
                error={formError ?? undefined}
              />

              <div className="flex items-center justify-between font-sans text-[13px] leading-[18px]">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-ink-dim transition-colors hover:text-accent disabled:pointer-events-none disabled:text-ink-faint"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
                {resendNotice ? <span className="text-accent">{resendNotice}</span> : null}
              </div>

              <div className="pt-[16px]">
                <SubmitButton submitting={submitting} label="Verify &amp; Continue" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setAwaitingCode(false);
                  setFormError(null);
                  setCode("");
                  setResendNotice(null);
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

              <div className="flex flex-col gap-[8px]">
                <Input
                  variant="pill"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.values.password}
                  onChange={(e) => form.setField("password", e.target.value)}
                  onBlur={() => form.blurField("password")}
                  error={form.touched.password ? form.errors.password : undefined}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="text-ink-faint transition-colors hover:text-accent"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  }
                />
                <PasswordStrengthMeter password={form.values.password} />
              </div>

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
        </div>

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

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M1.5 9s2.7-5.5 7.5-5.5S16.5 9 16.5 9s-2.7 5.5-7.5 5.5S1.5 9 1.5 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.25" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M2.5 2.5l13 13M7.4 7.6a2.25 2.25 0 0 0 3.1 3.1M5.2 5.3C3.2 6.5 1.5 9 1.5 9s2.7 5.5 7.5 5.5c1.4 0 2.6-.4 3.6-1M11 4.1c1.9.9 3.4 2.9 4.6 4.9 0 0-.7 1.5-2.1 2.9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
