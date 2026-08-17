"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { LoadingState } from "@/components/ui/states";
import { useAuth } from "@/controllers/AuthContext";
import { isStaff } from "@/models/auth";
import { useState } from "react";

/**
 * Sales pipeline — internal, staff only.
 *
 * The board is loaded with `ssr: false` because the Kanban library relies on
 * pointer events and @dnd-kit, neither of which can render on the server.
 *
 * ⚠ The role check below hides the UI; it is **not** access control. The
 * backend must reject `/sales/*` for non-staff tokens independently — anyone
 * can call the API directly regardless of what this component renders.
 */
const SalesBoard = dynamic(
  () => import("@/components/sales/SalesBoard").then((mod) => mod.SalesBoard),
  {
    ssr: false,
    loading: () => <LoadingState label="Loading pipeline" />,
  },
);

export default function SalesPage() {
  const { profile, initializing } = useAuth();
  const [search, setSearch] = useState("");

  if (initializing) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LoadingState label="Checking permissions" />
      </div>
    );
  }

  if (!isStaff(profile)) {
    return (
      <>
        <DashboardHeader search={search} onSearchChange={setSearch} />

        <div className="flex flex-1 items-center justify-center p-[40px]">
          <div className="flex max-w-[440px] flex-col items-center gap-[14px] rounded-card border border-line-hair bg-card p-[32px] text-center">
            <span
              aria-hidden
              className="grid size-[44px] place-items-center rounded-full border border-line-soft text-ink-dim"
            >
              ⚿
            </span>

            <h1 className="font-sans text-[20px] font-semibold leading-[28px] text-white">
              Staff access only
            </h1>

            <p className="font-sans text-[13px] leading-[21px] text-ink-dim">
              The sales pipeline is available to Panda Cloud staff. If you think you should have
              access, ask an administrator to update your role.
            </p>

            <Link
              href="/dashboard"
              className="mt-[6px] rounded-full border border-line-strong px-[22px] py-[10px] font-sans text-[12px] font-medium leading-[18px] text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader search={search} onSearchChange={setSearch} />

      <div className="flex flex-1 flex-col p-[24px] lg:p-[32px]">
        <SalesBoard />
      </div>
    </>
  );
}
