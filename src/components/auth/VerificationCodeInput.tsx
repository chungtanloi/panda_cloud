"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

const LENGTH = 6;

/**
 * Six single-digit boxes standing in for the one plain text input Clerk's
 * `attemptEmailAddressVerification({ code })` expects. The value handed back
 * to the caller is still a single string — nothing about the Clerk call
 * changes, only how the digits are entered.
 *
 * Box height (52px) is picked to match the card's existing 54.5px submit
 * button and ~54px "boxed" input height (`Field.tsx`), not a new metric.
 */
export interface VerificationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
}

export function VerificationCodeInput({
  value,
  onChange,
  error,
  disabled,
  label = "Verification code",
}: VerificationCodeInputProps) {
  const digits = Array.from({ length: LENGTH }, (_, i) => value[i] ?? "");
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, LENGTH));
    if (char && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < LENGTH - 1) refs.current[index + 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
  }

  const describedBy = error ? "verification-code-error" : undefined;

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <span className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim">
        {label}
      </span>

      <div className="flex justify-between gap-[8px]" role="group" aria-label={label}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            value={digit}
            onChange={(e) => setDigit(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={cn(
              "size-[52px] rounded-field border bg-deep text-center font-sans text-[24px] font-semibold text-ink",
              "transition-colors focus:border-accent disabled:opacity-40",
              error ? "border-red-400/70" : "border-line-strong",
            )}
          />
        ))}
      </div>

      {error ? (
        <p id="verification-code-error" role="alert" className="font-sans text-[12px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
