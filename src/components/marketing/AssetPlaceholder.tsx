import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Stand-in for a Figma image asset that has not been exported yet.
 *
 * Renders at the design's exact dimensions so the surrounding layout is
 * correct, and labels itself so it is obvious in review. Listed in
 * docs/FIGMA_ASSETS.md with the node id and target path.
 *
 * Replace with:
 *   <img src="/assets/…" alt="" className="size-full object-cover" />
 */
export function AssetPlaceholder({
  node,
  label,
  className,
  src,
  alt,
  priority = false,
}: {
  /** Figma node id, e.g. "1:70". */
  node: string;
  label: string;
  className?: string;
  /** Project asset used when the original Figma export is unavailable. */
  src?: string;
  alt?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <div
        data-visual-for={`figma-node-${node}`}
        className={cn("relative overflow-hidden bg-card", className)}
      >
        <Image
          src={src}
          alt={alt ?? label}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 hover:scale-[1.025]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/55 via-transparent to-accent/[0.04]"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={`${label} (image pending export)`}
      data-placeholder={`figma-node-${node}`}
      className={cn(
        "flex items-center justify-center overflow-hidden bg-card",
        "border border-dashed border-line-soft",
        className,
      )}
    >
      <span className="px-[16px] text-center font-mono text-[12px] leading-[16px] text-ink-faint">
        {label}
        <br />
        {node}
      </span>
    </div>
  );
}
