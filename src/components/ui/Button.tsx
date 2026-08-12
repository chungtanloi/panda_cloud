import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Figma sources:
 *   primary  — node 2:1148 (wizard "CONTINUE TO COMPUTE"): #00f2ff fill,
 *              px 40 / py 12, radius 16, 12px bold uppercase tracking .6px,
 *              drop-shadow 0 0 10px rgba(0,242,255,.4)
 *   pill     — node 2:954  (auth "Log In"): full-width, radius 9999, py 16
 *   secondary— node 2:1144 (wizard "BACK"): glass surface, 1px line-strong
 */

type Variant = "primary" | "secondary" | "pill" | "ghost";
type Size = "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Rendered before the label. */
  iconLeft?: React.ReactNode;
  /** Rendered after the label. */
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-[8px] font-serif uppercase transition-opacity " +
  "disabled:opacity-40 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-fg text-label-tight font-bold rounded-field drop-shadow-glow " +
    "hover:opacity-90",
  secondary:
    "bg-surface backdrop-blur-card border border-line-strong text-ink text-label-tight " +
    "rounded-field hover:border-accent/60",
  pill:
    "bg-accent text-accent-fg rounded-full font-sans font-medium text-[12px] leading-[12px] " +
    "tracking-[1.2px] hover:opacity-90",
  ghost: "text-ink-dim text-label-tight rounded-field hover:text-ink",
};

const sizes: Record<Size, string> = {
  md: "px-[40px] py-[12px]",
  lg: "px-[41px] py-[16px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    iconLeft,
    iconRight,
    fullWidth = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        base,
        variants[variant],
        variant === "pill" ? "py-[16px] w-full" : sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-[14px] animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        iconLeft
      )}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
});
