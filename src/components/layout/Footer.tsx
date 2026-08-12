import Link from "next/link";
import { FOOTER_NAV } from "@/config/navigation";
import { BrandMark } from "./BrandMark";

/**
 * Figma node 1:153 — "Footer Component".
 *   bar    — #0c0e12, 1px top rule rgba(58,73,75,.2)
 *   inner  — max 1440px, px 64, py 63.5
 *   brand  — 22×16 mark + "Cloud Panda" 24px semibold white
 *   links  — gap 24, 12px medium, tracking 1.2px, #b9cacb at 80% opacity
 *   CTA    — "Get Started" underlined, #00dbe7
 *   legal  — #00dbe7, 12px medium, right aligned
 */
export function Footer() {
  return (
    <footer className="w-full border-t border-line-faint bg-deep">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between gap-[32px] px-[24px] py-[63.5px] lg:flex-row lg:items-center lg:px-[64px]">
        <Link href="/" className="flex shrink-0 items-center gap-[8px]">
          <BrandMark className="h-[16px] w-[22px]" />
          <span className="font-sans text-[24px] font-semibold leading-[31.2px] text-white">
            Cloud Panda
          </span>
        </Link>

        <nav aria-label="Footer" className="flex flex-wrap items-start gap-[24px]">
          {FOOTER_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-sans text-[12px] font-medium leading-[16px] tracking-[1.2px] text-ink-dim opacity-80 transition-opacity hover:opacity-100"
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/signup"
            className="font-sans text-[12px] font-medium leading-[16px] tracking-[1.2px] text-accent-dim underline opacity-80 transition-opacity hover:opacity-100"
          >
            Get Started
          </Link>
        </nav>

        <p className="shrink-0 text-right font-sans text-[12px] font-medium leading-[16px] tracking-[1.2px] text-accent-dim">
          © 2024 Cloud Panda Inc. All systems operational.
        </p>
      </div>
    </footer>
  );
}
