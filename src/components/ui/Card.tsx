import { cn } from "@/lib/cn";

/**
 * The glass panel used for every wizard section.
 * Figma node 2:1052: rgba(26,26,26,.8) fill, 1px rgba(255,255,255,.2) border,
 * radius 48, padding 41, backdrop-blur 8px.
 */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-card border border-line-card bg-surface p-card backdrop-blur-card",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Card heading with a leading icon.
 * Figma node 2:1054: 24px bold serif, icon 16–18px at the left, gap 16px.
 */
export function CardHeading({
  icon,
  title,
  description,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center gap-[16px]">
        {icon ? (
          <span className="flex size-[20px] shrink-0 items-center justify-center overflow-clip">
            {icon}
          </span>
        ) : null}
        <h2 className="font-serif text-h2 font-bold text-ink">{title}</h2>
      </div>
      {description ? (
        <p className="font-serif text-body text-ink-dim">{description}</p>
      ) : null}
    </div>
  );
}
