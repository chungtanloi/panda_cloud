"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Figma nodes 2:942–2:946 (auth form):
 *   label — 12px medium uppercase, tracking .6px, colour #b9cacb
 *   input — bg #0c0e12, border rgba(58,73,75,.5), radius 16,
 *           px 17 / py 15, 16px text, placeholder #3a494b
 */

/**
 * Two input treatments exist in the design — they are genuinely different, not
 * a drift, so both are supported explicitly:
 *
 *   "boxed" — Log In (node 2:944): radius 16, py 15, 16px text,
 *             label 12px / tracking .6px, placeholder #3a494b
 *   "pill"  — Sign Up (node 2:907): radius 9999, py 18, 14px text,
 *             label 11px / tracking .55px, placeholder #849495,
 *             solid #3a494b border and a subtle inset shadow
 */
export type FieldVariant = "boxed" | "pill";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  variant?: FieldVariant;
  /** Optional adornment (e.g. a show/hide password toggle) inside the field, right-aligned. */
  trailing?: React.ReactNode;
}

const labelStyles: Record<FieldVariant, string> = {
  boxed: "text-[12px] font-medium leading-[12px] tracking-[0.6px]",
  pill: "text-[11px] font-normal leading-[16.5px] tracking-[0.55px]",
};

const inputStyles: Record<FieldVariant, string> = {
  boxed: "rounded-field px-[17px] py-[15px] text-[16px] placeholder:text-ink-faint",
  pill:
    "rounded-full px-[17px] py-[18px] text-[14px] placeholder:text-ink-placeholder " +
    "shadow-[inset_0px_2px_4px_1px_rgba(0,0,0,0.05)]",
};

const borderStyles: Record<FieldVariant, string> = {
  boxed: "border-line-strong",
  pill: "border-ink-faint",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, variant = "boxed", trailing, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <label
        htmlFor={inputId}
        className={cn("font-sans uppercase text-ink-dim", labelStyles[variant])}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full border bg-deep font-sans leading-normal text-ink",
            "transition-colors focus:border-accent focus:outline-none",
            inputStyles[variant],
            trailing ? "pr-[44px]" : undefined,
            error ? "border-red-400/70" : borderStyles[variant],
            className,
          )}
          {...rest}
        />
        {trailing ? (
          <span className="absolute right-[14px] flex items-center">{trailing}</span>
        ) : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} role="alert" className="font-sans text-[12px] text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="font-sans text-[12px] text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <label
        htmlFor={selectId}
        className="font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[0.6px] text-ink-dim"
      >
        {label}
      </label>

      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-field border bg-deep px-[17px] py-[15px]",
          "font-sans text-[16px] text-ink",
          "transition-colors focus:border-accent focus:outline-none",
          error ? "border-red-400/70" : "border-line-strong",
          className,
        )}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-deep text-ink">
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p role="alert" className="font-sans text-[12px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
});
