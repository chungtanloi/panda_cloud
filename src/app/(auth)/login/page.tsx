"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { useForm } from "@/controllers/useForm";
import { email as emailRule, minLength } from "@/lib/validation";
import { homeForProfile } from "@/config/access";
import { clerkEnabled } from "@/services/config";
import { AuthCard, ClerkNotConfigured, clerkErrorMessage } from "@/components/auth/AuthCard";

/**
 * Figma node 2:930 — "Log In | Cloud Panda". The card, type scale and button
 * are unchanged; only the submit handler moved to Clerk.
 *
 * PHASE_1_FRONTEND_AUTH_HANDOFF: "The existing PandaCloud visual design can
 * remain. Clerk custom-flow hooks/APIs can drive the current forms, so adopting
 * Clerk does not require switching to prebuilt Clerk UI components."
 *
 * PandaCloud issues no token here. Clerk creates the session; the PandaCloud
 * profile and authorization arrive afterwards from GET /api/v1/auth/me.
 */
export default function LoginPage() {
  // useSearchParams requires a Suspense boundary under the App Router.
  return (
    <Suspense>
      {clerkEnabled ? <LoginView /> : <ClerkNotConfigured action="Sign in" />}
    </Suspense>
  );
}

interface LoginFields {
  email: string;
  password: string;
}

function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { reload } = useAuth();

  /**
   * Where to go after signing in. Only same-origin relative paths are
   * accepted — an absolute URL here would be an open-redirect vector.
   */
  const rawReturnTo = params.get("returnTo");
  const returnTo = rawReturnTo?.startsWith("/") && !rawReturnTo.startsWith("//")
    ? rawReturnTo
    : null;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginFields>(
    { email: "", password: "" },
    {
      email: emailRule(),
      password: minLength(8, "Password"),
    },
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!form.validateAll()) return;
    if (!isLoaded || !signIn || !setActive) return;

    setSubmitting(true);
    try {
      const attempt = await signIn.create({
        identifier: form.values.email,
        password: form.values.password,
      });

      if (attempt.status !== "complete") {
        // MFA, a password reset, or another factor is outstanding. Clerk owns
        // those flows and no screen for them is designed yet.
        // ⚠ NEEDS CLARIFICATION — no second-factor screen exists in the Figma set.
        setFormError(
          "Additional verification is required to finish signing in. Please complete it in your Clerk account, or contact support.",
        );
        return;
      }

      await setActive({ session: attempt.createdSessionId });

      // Load the PandaCloud profile before routing: the landing workspace is
      // decided by active memberships, which only /auth/me knows.
      const profile = await reload();
      router.push(returnTo ?? homeForProfile(profile));
    } catch (cause) {
      setFormError(clerkErrorMessage(cause, "Incorrect email or password."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base px-[24px] py-[64px]">
      <AmbientBackground />

      <AuthCard>
        <header className="flex flex-col gap-[8px]">
          <h1 className="font-sans text-[24px] font-semibold leading-[31.2px] text-ink">
            Welcome back
          </h1>
          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
            Log in to your Cloud Panda dashboard.
          </p>
        </header>

        <form className="flex flex-col gap-[24px]" onSubmit={handleSubmit} noValidate>
          <Input
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
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.values.password}
            onChange={(e) => form.setField("password", e.target.value)}
            onBlur={() => form.blurField("password")}
            error={form.touched.password ? form.errors.password : undefined}
          />

          {formError ? (
            <p role="alert" className="font-sans text-[12px] text-red-400">
              {formError}
            </p>
          ) : null}

          {/* Clerk bot protection mounts here when the instance enables it. */}
          <div id="clerk-captcha" />

          <div className="pt-[8px]">
            <Button type="submit" variant="pill" loading={submitting} iconRight={<ArrowUpRight />}>
              Log In
            </Button>
          </div>
        </form>

        <p className="pt-[8px] text-center font-sans text-[16px] leading-[25.6px] text-ink-dim">
          Need an account?{" "}
          <Link
            href={returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : "/signup"}
            className="text-accent hover:underline"
          >
            Get started
          </Link>
        </p>
      </AuthCard>
    </main>
  );
}

/** Figma node 2:956 — 10.34px arrow inside the primary button. */
function ArrowUpRight() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      <path
        d="M2 9 9 2m0 0H3.5M9 2v5.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
