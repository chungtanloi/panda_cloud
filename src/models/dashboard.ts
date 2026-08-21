import type { IsoDateTime } from "./common";

/**
 * Dashboard Overview — Figma nodes 2:1434 (frame), 2:1435 (sidebar),
 * 2:1480 (main canvas).
 *
 * This model mirrors the design exactly. The canvas contains a welcome block
 * and precisely three KPI cards — no request table and no activity feed — so
 * none are modelled here. Add fields only when a design adds them.
 */

export interface DashboardSummary {
  /** First name used in "Welcome back, {name}" (node 2:1498). */
  greetingName: string;
  /** Status line beneath the greeting (node 2:1500). */
  systemMessage: string;

  /** KPI Card 1 — node 2:1502. Đếm từ bảng `projects` theo tổ chức. */
  activeProjects: ActiveProjectsKpi;

  /**
   * KPI Card 2 — node 2:1516.
   *
   * `null` khi hệ thống CHƯA có nguồn dữ liệu (không có telemetry cụm GPU).
   * Giao diện phải ẩn thẻ, không được hiện 0%: một khách hàng đang chạy cụm
   * mà thấy "0%" sẽ hiểu là cụm chết.
   */
  gpuUsage: GpuUsageKpi | null;

  /**
   * KPI Card 3 — node 2:1529.
   *
   * `null` khi chưa có sổ cái token. Xem ghi chú ở `gpuUsage`: hiện "0 CPT"
   * cho một người có token là sai nghiêm trọng hơn là không hiện gì.
   */
  tokenBalance: TokenBalanceKpi | null;

  /** Thẻ bổ sung, có nguồn thật: phiên đánh giá AI của chính người dùng. */
  assessments?: ActiveProjectsKpi;
  /** Thẻ bổ sung, có nguồn thật: yêu cầu (lead) của tổ chức người dùng. */
  requests?: ActiveProjectsKpi;
}

/* ------------------------------ Portfolio ------------------------------ */

/**
 * Trang /dashboard/portfolio.
 *
 * Mọi trường ở đây đều suy ra từ dữ liệu có thật (tổ chức, deal, thanh toán
 * đánh giá, quyền sử dụng). `wallet` là `null` vì chưa có sổ cái token —
 * giao diện ẩn khối ví thay vì hiện số dư bịa.
 */
export interface CustomerPortfolio {
  organizations: { id: string; name: string; status: string; countryCode: string | null }[];
  totals: {
    organizations: number;
    openDeals: number;
    paidAssessments: number;
    activeEntitlements: number;
  };
  spendByCurrency: { currency: string; amountMinor: number }[];
  recentPayments: {
    id: string;
    amountMinor: number;
    currency: string;
    status: string;
    createdAt: IsoDateTime;
    paidAt: IsoDateTime | null;
  }[];
  wallet: null;
}

export interface ActiveProjectsKpi {
  count: number;
  /** Accent chip text, e.g. "Active" (node 2:1512). */
  statusLabel: string;
  /** Dim caption beside the chip, e.g. "Across 2 regions" (node 2:1514). */
  detail: string;
}

export interface GpuUsageKpi {
  /** 0–100. Drives both the figure and the mini progress bar (node 2:1527). */
  percent: number;
}

export interface TokenBalanceKpi {
  amount: number;
  /** Ticker rendered smaller and dimmed, e.g. "CPT" (node 2:1537). */
  symbol: string;
  /** Signed change for the caption, e.g. 450 → "+450 this week". */
  weeklyDelta: number;
}

/* --------------------------- Request receipt --------------------------- */

export type RequestKind = "assessment" | "booking" | "investment" | "hyperscale";

export type RequestStatus =
  | "draft"
  | "received"
  | "in_review"
  | "approved"
  | "rejected"
  | "complete";

/** Payload behind the shared "Request Received" screen (node 2:1809). */
export interface RequestReceipt {
  reference: string;
  kind: RequestKind;
  /** Headline copy, e.g. "Request Received". */
  title: string;
  message: string;
  /** What happens next, rendered as an ordered list. */
  nextSteps: string[];
  submittedAt: IsoDateTime;
}
