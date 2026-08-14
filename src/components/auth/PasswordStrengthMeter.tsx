"use client";

import { type PasswordStrengthLevel, scorePassword } from "@/lib/passwordStrength";
import { cn } from "@/lib/cn";

/**
 * Sits under the Sign Up password field. Uses only tokens already defined for
 * this purpose — `raised` is documented in `tailwind.config.ts` as the
 * "toggle / progress track" colour and `muted` as the "completed progress
 * segment" colour — so this introduces no new scale step.
 *
 * Hidden while the field is empty so it never competes with the placeholder.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const { level, score, criteria } = scorePassword(password);

  if (level === "empty") return null;

  const levelLabel: Record<PasswordStrengthLevel, string> = {
    empty: "",
    weak: "Weak",
    fair: "Fair",
    good: "Good",
    strong: "Strong",
  };

  const levelColor: Record<PasswordStrengthLevel, string> = {
    empty: "",
    weak: "bg-red-400/70",
    fair: "bg-accent-dim",
    good: "bg-accent",
    strong: "bg-accent",
  };

  return (
    <div className="flex flex-col gap-[8px] pt-[2px]" aria-live="polite">
      <div className="flex items-center gap-[6px]">
        {[0, 1, 2, 3].map((segment) => (
          <span
            key={segment}
            aria-hidden
            className={cn(
              "h-[3px] flex-1 rounded-full bg-raised transition-colors duration-200",
              segment < score ? levelColor[level] : undefined,
            )}
          />
        ))}
        <span className="pl-[4px] font-sans text-[12px] leading-[12px] text-ink-faint">
          {levelLabel[level]}
        </span>
      </div>

      <ul className="flex flex-wrap gap-x-[14px] gap-y-[4px]">
        {criteria.map((criterion) => (
          <li
            key={criterion.id}
            className={cn(
              "flex items-center gap-[6px] font-sans text-[12px] leading-[16px]",
              criterion.met ? "text-ink-dim" : "text-ink-faint",
            )}
          >
            <CriterionMark met={criterion.met} />
            {criterion.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CriterionMark({ met }: { met: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-[12px] items-center justify-center rounded-full border transition-colors duration-200",
        met ? "border-accent-line bg-accent-soft text-accent" : "border-line-faint text-transparent",
      )}
    >
      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
        <path
          d="M1 3.6 2.6 5.2 6 1.4"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
