"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/controllers/AuthContext";

/**
 * Download control for the assessment PDF.
 *
 * Implements the agreed access rule: the assessment itself is open to anonymous
 * visitors, and sign-up is requested only at the point the report is
 * downloaded. This is the single place that rule is enforced, so changing it
 * later means editing one component.
 *
 * Three states, in priority order:
 *   1. report not generated yet → disabled, explains why
 *   2. generated but signed out → prompts sign-up, preserving the return path
 *   3. generated and signed in  → real download link
 */
export function ReportDownload({
  reportUrl,
  label,
  assessmentId,
}: {
  reportUrl?: string;
  label: string;
  assessmentId: string;
}) {
  const { isAuthenticated, initializing } = useAuth();
  const [prompting, setPrompting] = useState(false);

  const base =
    "inline-flex w-full items-center justify-center gap-[8px] rounded-full px-[20px] py-[12px] " +
    "font-sans text-[13px] font-bold leading-[20px] transition-all duration-200";

  // 1. Nothing to download yet.
  if (!reportUrl) {
    return (
      <button
        type="button"
        disabled
        title="Your report is still being generated."
        className={`${base} cursor-not-allowed bg-accent text-accent-fg opacity-40`}
      >
        <span aria-hidden>⭳</span>
        {label}
      </button>
    );
  }

  // Wait for the session check rather than flashing the wrong control.
  if (initializing) {
    return (
      <span className={`${base} bg-accent text-accent-fg opacity-40`} aria-busy>
        <span
          aria-hidden
          className="size-[14px] animate-spin rounded-full border-2 border-current border-t-transparent"
        />
        {label}
      </span>
    );
  }

  // 3. Signed in — hand over the file.
  if (isAuthenticated) {
    return (
      <a
        href={reportUrl}
        className={`${base} bg-accent text-accent-fg hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]`}
      >
        <span aria-hidden>⭳</span>
        {label}
      </a>
    );
  }

  // 2. Signed out — ask for an account, then come straight back here.
  const returnTo = `/assessment/results?id=${encodeURIComponent(assessmentId)}`;

  return (
    <div className="flex w-full flex-col gap-[10px]">
      <button
        type="button"
        onClick={() => setPrompting(true)}
        className={`${base} bg-accent text-accent-fg hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]`}
      >
        <span aria-hidden>⭳</span>
        {label}
      </button>

      {prompting ? (
        <div
          role="status"
          className="flex flex-col gap-[10px] rounded-field border border-accent-line bg-accent-soft p-[14px] text-left"
        >
          <p className="font-sans text-[12px] leading-[18px] text-ink">
            Create a free account to download your report. Your answers are already saved — you
            will come straight back to this page.
          </p>

          <div className="flex flex-wrap gap-[8px]">
            <Link
              href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}
              className="rounded-full bg-accent px-[16px] py-[8px] font-sans text-[12px] font-bold leading-[16px] text-accent-fg"
            >
              Create account
            </Link>
            <Link
              href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
              className="rounded-full border border-line-strong px-[16px] py-[8px] font-sans text-[12px] font-medium leading-[16px] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              I have an account
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
