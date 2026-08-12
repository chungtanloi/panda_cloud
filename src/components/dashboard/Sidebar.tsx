"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import type { User } from "@/models/auth";

/**
 * Figma node 2:1435 — "Aside - Sidebar Navigation".
 *   panel  — 254px, rgba(26,26,26,.8), 1px rgba(58,73,75,.2),
 *            backdrop-blur 6, shadow 0 4px 30px rgba(0,0,0,.1)
 *   brand  — padding 20, 24px semibold, tracking -0.6px
 *   nav    — padding 16, gap 8
 *     active   (2:1441) bg rgba(51,53,57,.2), 2px left accent rule,
 *              pl 18 / pr 16 / py 12, 12px bold accent, tracking 1.2px
 *     inactive (2:1446) px 16 / py 12, 12px medium dim
 *   footer — top rule, 40px avatar, name over tier, both 12px
 */

interface NavItem {
  label: string;
  href: string;
}

/** Transcribed verbatim from nodes 2:1445 – 2:1470. */
const NAV_ITEMS: readonly NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Projects", href: "/dashboard/projects" },
  { label: "GPU Clusters", href: "/dashboard/clusters" },
  { label: "Portfolio", href: "/dashboard/portfolio" },
  { label: "Wallet", href: "/dashboard/wallet" },
  { label: "Transactions", href: "/dashboard/transactions" },
];

export function Sidebar({ user }: { user: User | null }) {
  const pathname = usePathname();

  return (
    <aside className="relative flex w-[254px] shrink-0 flex-col justify-between border border-line-faint bg-surface shadow-chrome backdrop-blur-chrome">
      {/* Radial mantle — node 2:1436 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 36% 145% at 0% 0%, rgba(26,26,26,1) 0%, rgba(26,26,26,0) 100%)",
        }}
      />

      <div className="relative p-[20px]">
        <p className="font-sans text-[24px] font-semibold leading-[31.2px] tracking-[-0.6px] text-ink">
          Cloud Panda
        </p>
      </div>

      <nav className="relative flex flex-1 flex-col gap-[8px] p-[16px]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-[12px] rounded-full py-[12px]",
                "font-sans text-[12px] tracking-[1.2px] transition-colors",
                isActive
                  ? "border-l-2 border-accent bg-[rgba(51,53,57,0.2)] pl-[18px] pr-[16px] font-bold text-accent"
                  : "px-[16px] font-medium text-ink-dim hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-line-faint px-[20px] pb-[20px] pt-[21px]">
        <div className="flex items-center gap-[12px]">
          <div
            aria-hidden
            className="size-[40px] shrink-0 overflow-clip rounded-full border border-line bg-muted"
          />
          <div className="flex flex-col gap-[4px]">
            <p className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink">
              {user?.fullName ?? "—"}
            </p>
            <p className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-dim">
              Pro Tier
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
