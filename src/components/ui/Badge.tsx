import { cn } from "@/lib/cn";

/**
 * Accent pill. Three shapes appear in the design — they differ in radius and
 * weight, so the variant is explicit rather than approximated:
 *
 *   "pill"   node 2:896  ("ASSET OWNERS")  radius 9999, px 13, semibold, lh 16
 *   "chip"   node 2:979  ("ASSET OWNERS")  radius 16,   px 9,  medium,   lh 12
 *   "status" node 2:1114 ("SYNCED")        radius 16,   px 9,  with 6px dot
 */
export type BadgeVariant = "pill" | "chip" | "status";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const shapes: Record<BadgeVariant, string> = {
  pill: "rounded-full px-[13px] py-[5px] font-semibold leading-[16px]",
  chip: "rounded-field px-[9px] py-[5px] font-medium leading-[12px]",
  status: "rounded-field px-[9px] py-[5px] font-medium leading-[12px]",
};

export function Badge({ children, variant = "pill", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[4px] border border-accent-line bg-accent-soft",
        "font-sans text-[12px] uppercase tracking-[1.2px] text-accent",
        shapes[variant],
        className,
      )}
    >
      {variant === "status" ? (
        <span aria-hidden className="size-[6px] rounded-full bg-accent" />
      ) : null}
      {children}
    </span>
  );
}
