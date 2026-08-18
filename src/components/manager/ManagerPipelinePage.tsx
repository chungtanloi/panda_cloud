"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { LoadingState } from "@/components/ui/states";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { ConversionQueue } from "./ConversionQueue";

const SalesBoard = dynamic(
  () => import("@/components/sales/SalesBoard").then((module) => module.SalesBoard),
  { ssr: false, loading: () => <LoadingState label="Loading pipeline" /> },
);

type Tab = "queue" | "board";

/**
 * `/manager/pipeline`.
 *
 * This route used to render the sales board verbatim, which gave a manager the
 * same screen as a salesperson and no answer to the one question the role
 * actually asks: which won deals are waiting on me. The conversion queue is now
 * the default view and the board is one click away, so both audiences keep what
 * they need without a second route or a navigation change.
 */
export function ManagerPipelinePage() {
  const [tab, setTab] = useState<Tab>("queue");

  const tabs = (
    <div className="flex gap-2" role="tablist" aria-label="Pipeline view">
      <TabButton active={tab === "queue"} onClick={() => setTab("queue")} label="Conversion queue" />
      <TabButton active={tab === "board"} onClick={() => setTab("board")} label="Full board" />
    </div>
  );

  if (tab === "board") {
    return (
      <main className="box-border flex h-screen min-w-0 flex-col gap-4 overflow-hidden p-5 pt-20 lg:p-8 lg:pt-20">
        {tabs}
        <div className="min-h-0 min-w-0 flex-1">
          <SalesBoard />
        </div>
      </main>
    );
  }

  return (
    <WorkspacePage
      eyebrow="Manager / Pipeline"
      title="Deal to project conversion"
      description="Won deals that have not become projects yet, readiness first. Converting is permitted regardless of readiness — the backend enforces authorization, won status, optimistic concurrency and idempotency."
    >
      <div className="mb-6">{tabs}</div>
      <ConversionQueue />
    </WorkspacePage>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full border px-[14px] py-[7px] text-[12px] font-semibold leading-[16px] transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line-soft bg-white/[0.03] text-ink-dim hover:border-accent/40"
      }`}
    >
      {label}
    </button>
  );
}
