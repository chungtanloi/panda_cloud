"use client";

import { useCallback, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KpiCard, MiniProgressBar } from "@/components/dashboard/KpiCard";
import { Reveal } from "@/components/motion/Reveal";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, LoadingState, Skeleton } from "@/components/ui/states";
import { useAsync } from "@/controllers/useAsync";
import { api } from "@/services/api";
import { CustomerOverviewExtras } from "@/components/workspace/DashboardView";

/**
 * Figma node 2:1480 — "Main Content Canvas".
 *   content — max 1440px, padding 40, gap 64
 *   welcome — 48px bold, tracking -1.92px, name in accent (node 2:1498)
 *   sub     — 18px / 28.8px dim
 *   KPIs    — 3 cards, gap 20
 *
 * Note this screen uses the sans face throughout, not the serif used by the
 * assessment wizard.
 */
export default function DashboardPage() {
  const [search, setSearch] = useState("");

  const fetchSummary = useCallback(() => api.dashboard.getSummary(), []);
  const { state, run } = useAsync(fetchSummary, { immediate: [] });

  return (
    <>
      <DashboardHeader search={search} onSearchChange={setSearch} />

      <div className="flex w-full max-w-[1440px] flex-1 flex-col gap-[64px] p-[40px]">
        {state.status === "loading" || state.status === "idle" ? (
          <DashboardSkeleton />
        ) : state.status === "error" ? (
          <ErrorState error={state.error} onRetry={() => void run()} />
        ) : (
          <>
            <Reveal as="section" className="flex flex-col gap-[7px]">
              <h1 className="font-sans text-[48px] font-bold leading-[52.8px] tracking-[-1.92px] text-ink">
                Welcome back, <span className="text-accent">{state.data.greetingName}</span>
              </h1>
              <p className="font-sans text-[18px] leading-[28.8px] text-ink-dim">
                {state.data.systemMessage}
              </p>
            </Reveal>

            <section
              aria-label="Key metrics"
              className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3"
            >
              <Reveal>
                <KpiCard
                  className="hover-lift h-full"
                  label="Active Projects"
                  value={String(state.data.activeProjects.count)}
                  footer={<KpiFooter kpi={state.data.activeProjects} />}
                />
              </Reveal>

              {/* gpuUsage và tokenBalance là `null` khi backend chưa có nguồn
                  dữ liệu. Ẩn thẻ thay vì hiện 0: một khách hàng đang chạy cụm
                  GPU mà thấy "0%" sẽ hiểu là cụm đã chết, và "0 CPT" cho người
                  có token là một lời nói dối về tài sản của họ. Khi có nguồn
                  thật, backend trả object và thẻ tự hiện lại. */}
              {state.data.gpuUsage ? (
                <Reveal delay={70}>
                  <KpiCard
                    className="hover-lift h-full"
                    label="Global GPU Usage"
                    value={String(state.data.gpuUsage.percent)}
                    unit="%"
                    footer={
                      <MiniProgressBar
                        percent={state.data.gpuUsage.percent}
                        label="Global GPU usage"
                      />
                    }
                  />
                </Reveal>
              ) : state.data.assessments ? (
                <Reveal delay={70}>
                  <KpiCard
                    className="hover-lift h-full"
                    label="Assessments"
                    value={String(state.data.assessments.count)}
                    footer={<KpiFooter kpi={state.data.assessments} />}
                  />
                </Reveal>
              ) : null}

              {state.data.tokenBalance ? (
                <Reveal delay={140}>
                  <KpiCard
                    className="hover-lift h-full"
                    label="Token Balance"
                    value={state.data.tokenBalance.amount.toLocaleString("en-US")}
                    unit={state.data.tokenBalance.symbol}
                    footer={
                      <span className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-accent">
                        {state.data.tokenBalance.weeklyDelta >= 0 ? "+" : ""}
                        {state.data.tokenBalance.weeklyDelta.toLocaleString("en-US")} this week
                      </span>
                    }
                  />
                </Reveal>
              ) : state.data.requests ? (
                <Reveal delay={140}>
                  <KpiCard
                    className="hover-lift h-full"
                    label="Requests"
                    value={String(state.data.requests.count)}
                    footer={<KpiFooter kpi={state.data.requests} />}
                  />
                </Reveal>
              ) : null}
            </section>
            <CustomerOverviewExtras />
          </>
        )}
      </div>
    </>
  );
}

/** Chip trạng thái + chú thích, dùng chung cho mọi thẻ KPI có nguồn dữ liệu thật. */
function KpiFooter({ kpi }: { kpi: { statusLabel: string; detail: string } }) {
  return (
    <div className="flex items-center gap-[8px]">
      <Badge variant="chip">{kpi.statusLabel}</Badge>
      <span className="font-sans text-[12px] font-medium leading-[12px] tracking-[1.2px] text-ink-dim">
        {kpi.detail}
      </span>
    </div>
  );
}

/** Mirrors the real layout so the page does not jump when data lands. */
function DashboardSkeleton() {
  return (
    <>
      <span className="sr-only">
        <LoadingState label="Loading dashboard" />
      </span>

      <section className="flex flex-col gap-[7px]" aria-hidden>
        <Skeleton className="h-[52px] w-[420px] max-w-full" />
        <Skeleton className="h-[28px] w-[560px] max-w-full" />
      </section>

      <section className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        <Skeleton className="h-[166px] rounded-card" />
        <Skeleton className="h-[166px] rounded-card" />
        <Skeleton className="h-[166px] rounded-card" />
      </section>
    </>
  );
}
