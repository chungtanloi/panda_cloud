"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useAuth } from "@/controllers/AuthContext";
import { useForm } from "@/controllers/useForm";
import { email as emailRule, minLength } from "@/lib/validation";
import type { LoginRequest } from "@/models/auth";
import { normalizeError } from "@/services/api";

/**
 * Figma node 2:930 — "Log In | Cloud Panda".
 *   card    — 448px wide, rgba(30,32,36,.9), 1px rgba(58,73,75,.3),
 *             radius 32, padding 41, gap 32, backdrop-blur 12px,
 *             shadow 0 25px 50px -12px rgba(0,0,0,.25)
 *   heading — 24px semibold sans #e2e2e8 over 16px #b9cacb
 *   button  — full-width pill, #00f2ff on #002022
 *
 * This View holds no business logic: authentication lives in AuthContext,
 * field rules in lib/validation, and all I/O behind services/api.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<LoginRequest>(
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

    setSubmitting(true);
    try {
      const user = await login(form.values);
      // Users who have not picked a track land on "Choose Your Path" first.
      router.push(user.path ? "/dashboard" : "/choose-path");
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

      <div
        className="relative flex w-full max-w-auth flex-col gap-[32px] rounded-panel border border-line bg-surface-alt p-card shadow-auth backdrop-blur-auth"
      >
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

          <div className="pt-[8px]">
            <Button type="submit" variant="pill" loading={submitting} iconRight={<ArrowUpRight />}>
              Log In
            </Button>
          </div>
        </form>

        <p className="pt-[8px] text-center font-sans text-[16px] leading-[25.6px] text-ink-dim">
          Need an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Get started
          </Link>
        </p>
      </div>
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
