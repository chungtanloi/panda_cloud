import type {
  AssessmentResult,
  DashboardSummary,
  GpuModel,
  RequestReceipt,
  TokenRate,
  User,
} from "@/models";

/** Deterministic sample data so the UI renders identically on every reload. */

export const mockUser: User = {
  id: "usr_01H8XQ",
  email: "jane@company.com",
  fullName: "Jane Cooper",
  company: "Northwind Energy",
  path: "land_owner",
  createdAt: "2026-07-01T08:12:00Z",
};

export const mockGpuModels: GpuModel[] = [
  { id: "h100_sxm", name: "NVIDIA H100 SXM", vramGb: 80, hourlyRateUsd: 3.25, available: true },
  { id: "h200", name: "NVIDIA H200", vramGb: 141, hourlyRateUsd: 4.4, available: true },
  { id: "a100_80", name: "NVIDIA A100 80GB", vramGb: 80, hourlyRateUsd: 1.85, available: true },
  { id: "l40s", name: "NVIDIA L40S", vramGb: 48, hourlyRateUsd: 1.1, available: false },
];

export const mockTokenRate: TokenRate = {
  priceUsd: 2.418,
  change24hPercent: 3.62,
  updatedAt: "2026-08-12T06:00:00Z",
};

export const mockAssessmentResult: AssessmentResult = {
  id: "asm_7f21c",
  status: "complete",
  esgScore: "A-",
  esgPercent: 82,
  carbonFootprintTco2e: 12.4,
  renewableRatioPercent: 100,
  estimatedAnnualRevenueUsd: 4_820_000,
  recommendations: [
    "Secure a long-term PPA to lock in the current renewable ratio.",
    "Commission a grid interconnection study before the next funding round.",
    "Model a liquid-cooling retrofit to improve PUE below 1.2.",
  ],
  createdAt: "2026-08-12T06:15:00Z",
};

/** Values transcribed from the design (nodes 2:1498–2:1543). */
export const mockDashboard: DashboardSummary = {
  greetingName: "Jane",
  systemMessage: "System optimal. Your compute clusters are operating at peak efficiency.",
  activeProjects: { count: 3, statusLabel: "Active", detail: "Across 2 regions" },
  gpuUsage: { percent: 64 },
  tokenBalance: { amount: 12_400, symbol: "CPT", weeklyDelta: 450 },
};

export const mockReceipt: RequestReceipt = {
  reference: "CP-GPU-1190",
  kind: "booking",
  title: "Request Received",
  message:
    "Your cluster request is queued for capacity review. A solutions engineer will confirm availability shortly.",
  nextSteps: [
    "Capacity and region availability confirmed within 1 business day.",
    "A detailed quote is issued to your registered email.",
    "Deployment window scheduled once the quote is accepted.",
  ],
  submittedAt: "2026-08-12T06:30:00Z",
};
