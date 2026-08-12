import Link from "next/link";
import type { GpuOffer } from "@/config/gpuRenting";
import { cn } from "@/lib/cn";

/**
 * Figma nodes 2:47 (H100), 2:80 (H200, featured), 2:115 (B200).
 *   card     — rgba(12,14,18,.85), 1px rgba(0,242,255,.15), radius 32,
 *              padding 25, gap 24, backdrop-blur 8
 *   featured — rgba(18,22,28,.9), 1px rgba(0,242,255,.5),
 *              shadow 0 0 20px rgba(0,242,255,.2), raised 16px, plus a
 *              rgba(0,242,255,.05) wash and the RECOMMENDED ribbon (node 2:82)
 *   title    — model 24px bold accent + variant 20px regular
 *   specs    — rows with a 1px rgba(255,255,255,.1) rule, 12px labels
 *   price    — 36px bold accent with a 0 0 10px cyan text-shadow
 */
export function GpuOfferCard({ offer }: { offer: GpuOffer }) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-[24px] overflow-hidden rounded-panel p-[25px] backdrop-blur-card",
        offer.featured
          ? "border border-accent/50 bg-glass-hi shadow-[0px_0px_20px_0px_rgba(0,242,255,0.2)] lg:-mt-[16px]"
          : "border border-accent/15 bg-glass",
      )}
    >
      {offer.featured ? (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-accent/5" />
          <span className="absolute right-0 top-0 rounded-bl-[32px] bg-accent px-[12px] py-[4px] font-sans text-[10px] font-bold leading-[15px] text-accent-fg drop-shadow-[0px_0px_5px_rgba(0,242,255,0.4)]">
            RECOMMENDED
          </span>
        </>
      ) : null}

      <div className="relative flex items-end gap-[4px]">
        <span className="font-sans text-[24px] font-bold leading-[31.2px] text-accent">
          {offer.model}
        </span>
        <span
          className={cn(
            "font-sans text-[20px] leading-[28px]",
            offer.featured ? "text-white" : "text-ink-bright",
          )}
        >
          {offer.variant}
        </span>
      </div>

      <span
        className={cn(
          "relative w-fit rounded-field border px-[9px] py-[5px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px]",
          offer.tagAccent
            ? "border-accent-line bg-accent-soft text-accent"
            : "border-line-soft bg-white/5 text-ink-bright",
        )}
      >
        {offer.tag}
      </span>

      <dl className="relative flex flex-col gap-[8px] pt-[16px]">
        {offer.specs.map((spec) => (
          <div
            key={spec.label}
            className="flex items-start justify-between border-b border-line-soft pb-[9px]"
          >
            <dt className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-mute">
              {spec.label}
            </dt>
            <dd
              className={cn(
                "font-sans text-[12px] leading-[12px] tracking-[1.2px]",
                spec.highlight ? "font-bold text-accent" : "font-medium text-white",
              )}
            >
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="relative flex items-end justify-between pt-[24px]">
        <p className="flex items-end gap-[6px]">
          <span
            className={cn(
              "font-sans text-[36px] font-bold leading-[39.6px]",
              offer.price
                ? "text-accent [text-shadow:0px_0px_10px_rgba(0,242,255,0.5)]"
                : "text-white",
            )}
          >
            {offer.price ?? "Contact"}
          </span>
          <span className="pb-[6px] font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-mute">
            {offer.priceSuffix}
          </span>
        </p>

        <Link
          href={offer.ctaHref}
          className={cn(
            "rounded-full font-sans text-[14px] font-bold leading-[20px] transition-opacity hover:opacity-90",
            offer.featured
              ? "bg-accent px-[16px] py-[8px] text-accent-fg drop-shadow-[0px_0px_7.5px_rgba(0,242,255,0.4)]"
              : "border border-line-soft bg-card px-[17px] py-[9px] text-white",
          )}
        >
          {offer.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
