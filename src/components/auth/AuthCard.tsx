"use client";

import Link from "next/link";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { AmbientBackground } from "@/components/layout/AmbientBackground";

/**
 * Shared chrome and error handling for the Clerk-driven auth screens.
 *
 * Keeps the Figma card measurements in one place (node 2:930) so the sign-in
 * and sign-up screens cannot drift apart, and gives both a single, safe way to
 * turn a Clerk error into user-facing copy.
 */

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full max-w-auth flex-col gap-[32px] rounded-panel border border-line bg-surface-alt p-card shadow-auth backdrop-blur-auth">
      {children}
    </div>
  );
}

/**
 * Turns a Clerk error into a single message.
 *
 * Clerk returns a structured `errors[]`; the first entry's `longMessage` is the
 * user-facing text. Anything else falls back to the caller's copy rather than
 * leaking an internal message.
 */
export function clerkErrorMessage(cause: unknown, fallback: string): string {
  if (isClerkAPIResponseError(cause)) {
    const first = cause.errors[0];
    return first?.longMessage ?? first?.message ?? fallback;
  }
  return fallback;
}

/**
 * Shown when the build has no Clerk instance configured.
 *
 * Only reachable in standalone mock development — `assertApiConfig()` refuses
 * to start the HTTP adapter without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. The
 * screen states the fact instead of pretending a sign-in surface exists.
 */
export function ClerkNotConfigured({ action }: { action: string }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base px-[24px] py-[64px]">
      <AmbientBackground />
      <AuthCard>
        <header className="flex flex-col gap-[8px]">
          <h1 className="font-sans text-[24px] font-semibold leading-[31.2px] text-ink">
            {action} is not available in this build
          </h1>
          <p className="font-sans text-[16px] leading-[25.6px] text-ink-dim">
            No Clerk instance is configured, so this build runs standalone against the mock
            adapter with a development identity. Set{" "}
            <code className="text-accent">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> in{" "}
            <code className="text-accent">.env.local</code> to enable real authentication.
          </p>
        </header>
        <Link
          href="/"
          className="inline-flex justify-center rounded-full border border-line-strong px-[22px] py-[10px] font-sans text-[12px] font-medium leading-[18px] text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Back to Cloud Panda
        </Link>
      </AuthCard>
    </main>
  );
}
