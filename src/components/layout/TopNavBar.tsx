"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MARKETING_NAV } from "@/config/navigation";
import { cn } from "@/lib/cn";
import { BrandMark } from "./BrandMark";

/**
 * Figma node 1:174 — "TopNavBar Component".
 *   bar    — rgba(17,19,24,.8), 1px bottom rule rgba(58,73,75,.3),
 *            backdrop-blur 6, sticky over the page
 *   inner  — max 1440px, px 64, py 16
 *   brand  — 25.7×18.7 mark + "Cloud Panda" 24px bold white
 *   links  — gap 24, 16px / 25.6px; active is accent, bold, with a 2px accent
 *            underline (node 1:182); the rest are #b9cacb with 12px side pad
 *   CTA    — "Get Started", 14px bold, tracking .7px, colour #006a71,
 *            px 24 / py 10, radius 9999 — no fill in the design (verified
 *            against the rendered node, not assumed)
 */
export function TopNavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 w-full border-b border-line bg-base/80 backdrop-blur-chrome">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-[24px] px-[24px] py-[16px] lg:px-[64px]">
        <Link href="/" className="flex shrink-0 items-center gap-[8px]">
          <BrandMark className="h-[18.667px] w-[25.667px]" />
          <span className="font-sans text-[24px] font-bold leading-[31.2px] text-white">
            Cloud Panda
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-[24px] lg:flex">
          {MARKETING_NAV.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "font-sans text-[16px] leading-[25.6px] transition-colors",
                  isActive
                    ? "border-b-2 border-accent pb-[1px] font-bold text-accent"
                    : "px-[12px] text-ink-dim hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Low contrast is intentional — it matches the design exactly.
            Flagged in docs/FIGMA_SCREEN_MAP.md as an accessibility question
            for the designer rather than silently "corrected" here. */}
        <Link
          href="/signup"
          className="shrink-0 rounded-full px-[24px] py-[10px] font-sans text-[14px] font-bold leading-[20px] tracking-[0.7px] text-accent-deep transition-colors hover:text-accent"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
