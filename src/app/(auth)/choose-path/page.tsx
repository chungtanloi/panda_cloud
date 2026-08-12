"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import { PATH_OPTIONS, type PathOption } from "@/config/paths";
import { useAuth } from "@/controllers/AuthContext";
import { normalizeError } from "@/services/api";
import type { UserPath } from "@/models/auth";

/**
 * Figma node 2:961 — "Choose Your Path | Cloud Panda".
 *   glow    — rgba(0,242,255,.05), blur 60, h 384, inset 15%, max-w 896 (2:962)
 *   heading — 36px bold, tracking -0.72px, leading 39.6px
 *   sub     — 18px / 28.8px dim
 *   grid    — 4 × 241px cards, gap 20, max-w 1024, h 221.19
 *   card    — rgba(26,26,26,.6), 1px rgba(255,255,255,.1), radius 48, blur 8
 *
 * Each card is a real <button>: choosing a path persists it via the API, then
 * routes into that track's onboarding flow.
 */
export default function ChoosePathPage() {
  const router = useRouter();
  const { choosePath } = useAuth();
  const [pending, setPending] = useState<UserPath | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChoose(option: PathOption) {
    setPending(option.id);
    setError(null);
    try {
      await choosePath(option.id);
      router.push(option.route);
    } catch (cause) {
      setError(normalizeError(cause).message);
      setPending(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-base">
      {/* Ambient glow — node 2:962 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[15%] top-0 mx-auto h-[384px] max-w-[896px] rounded-full bg-accent/5 blur-[60px]"
      />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col items-center justify-center px-[24px] py-[96px] md:px-[64px] lg:py-[248px]">
        <header className="flex flex-col items-center gap-[15px] pb-[64px] text-center">
          <Logo />

          <h1 className="pt-[17px] font-sans text-[36px] font-bold leading-[39.6px] tracking-[-0.72px] text-ink">
            Which best describes you?
          </h1>

          <p className="font-sans text-[18px] leading-[28.8px] text-ink-dim">
            Pick a path — we&apos;ll route you to the right onboarding flow.
          </p>
        </header>

        <div className="grid w-full max-w-[1024px] grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-4">
          {PATH_OPTIONS.map((option) => {
            const isPending = pending === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleChoose(option)}
                disabled={pending !== null}
                aria-busy={isPending || undefined}
                className={[
                  "group relative flex min-h-[221px] flex-col items-start rounded-card border",
                  "border-line-soft bg-surface-soft p-[24px] text-left backdrop-blur-card",
                  "transition-colors hover:border-accent focus-visible:border-accent",
                  "disabled:cursor-not-allowed",
                  isPending ? "border-accent" : "",
                  pending !== null && !isPending ? "opacity-40" : "",
                ].join(" ")}
              >
                <Badge variant="chip">{option.badge}</Badge>

                <h2 className="pt-[32px] font-sans text-[20px] font-semibold leading-[28px] text-ink">
                  {option.title}
                </h2>

                <p className="pt-[8px] font-sans text-[16px] leading-[25.6px] text-ink-dim">
                  {option.description}
                </p>

                {isPending ? (
                  <span
                    aria-hidden
                    className="absolute right-[24px] top-[24px] size-[16px] animate-spin rounded-full border-2 border-accent border-t-transparent"
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        {error ? (
          <p role="alert" className="pt-[24px] font-sans text-[14px] text-red-400">
            {error}
          </p>
        ) : null}

        <p className="pt-[64px] text-center font-sans text-[16px] leading-[25.6px] text-ink-dim">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
