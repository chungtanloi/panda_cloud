import type {
  AssessmentResult,
  DashboardSummary,
  GpuModel,
  RequestReceipt,
  TokenRate,
  User,
  WorkloadRecommendation,
  WorkloadType,
} from "@/models";

/** Deterministic sample data so the UI renders identically on every reload. */

/**
 * Fixture shaped exactly like `AuthMeResponse.user`
 * (api-contracts/components.yaml). `company` and `path` are gone: the accepted
 * identity schema has neither (PHASE_1_FRONTEND_AUTH_HANDOFF).
 */
export const mockUser: User = {
  id: "usr_01H8XQ",
  email: "jane@company.com",
  fullName: "Jane Cooper",
  userType: "customer",
  status: "active",
  createdAt: "2026-07-01T08:12:00Z",
  updatedAt: "2026-07-01T08:12:00Z",
};

/**
 * GPU catalogue, transcribed from the Hardware step (GPU_2.png).
 *
 * ⚠ Spec figures are the design's sample values, read from a low-resolution
 * export. Confirm against the vendor datasheets before launch — they are shown
 * to buyers as product specifications.
 */
export const mockGpuModels: GpuModel[] = [
  {
    id: "h100",
    name: "H100",
    memory: "80GB HBM3",
    architecture: "Hopper",
    stock: "in_stock",
    hourlyRateUsd: 2.49,
    specs: {
      fp64TensorTflops: 67,
      memoryBandwidthTbs: 3.35,
      tdpWatts: 700,
      vram: "80GB HBM3",
      interconnect: "NVLink (900 GB/s)",
      formFactor: "SXM5",
      bars: { tensor: 62, bandwidth: 58, tdp: 70 },
    },
  },
  {
    id: "h200",
    name: "H200",
    memory: "141GB HBM3e",
    architecture: "Hopper",
    stock: "limited",
    hourlyRateUsd: 3.29,
    specs: {
      fp64TensorTflops: 67,
      memoryBandwidthTbs: 4.8,
      tdpWatts: 700,
      vram: "141GB HBM3e",
      interconnect: "NVLink (900 GB/s)",
      formFactor: "SXM5",
      bars: { tensor: 62, bandwidth: 82, tdp: 70 },
    },
  },
  {
    id: "b200",
    name: "B200",
    memory: "192GB HBM3e",
    architecture: "Blackwell",
    stock: "pre_order",
    hourlyRateUsd: null,
    specs: {
      fp64TensorTflops: 90,
      memoryBandwidthTbs: 8,
      tdpWatts: 1000,
      vram: "192GB HBM3e",
      interconnect: "NVLink (1.8 TB/s)",
      formFactor: "SXM6",
      bars: { tensor: 88, bandwidth: 100, tdp: 100 },
    },
  },
  {
    id: "mi300x",
    name: "MI300X",
    memory: "192GB HBM3",
    architecture: "CDNA 3",
    stock: "in_stock",
    hourlyRateUsd: 2.1,
    specs: {
      fp64TensorTflops: 81,
      memoryBandwidthTbs: 5.3,
      tdpWatts: 750,
      vram: "192GB HBM3",
      interconnect: "Infinity Fabric",
      formFactor: "OAM",
      bars: { tensor: 78, bandwidth: 90, tdp: 75 },
    },
  },
];

/** Step 1 recommendation panel, keyed by workload. */
export const mockRecommendations: Record<WorkloadType, WorkloadRecommendation> = {
  llm_training: {
    gpuName: "NVIDIA H100 80GB",
    rationale:
      "Optimal for large-scale LLM training. Provides maximum VRAM bandwidth and NVLink " +
      "interconnect speed required for trillion-parameter models.",
    minNodeSize: "8x GPUs",
    interconnect: "3.2 Tbps Infiniband",
  },
  fine_tuning: {
    gpuName: "NVIDIA H100 80GB",
    rationale:
      "Balances memory capacity against cost for adapter and full-parameter fine-tuning runs " +
      "that do not need a full training cluster.",
    minNodeSize: "2x GPUs",
    interconnect: "800 Gbps Infiniband",
  },
  inference: {
    gpuName: "NVIDIA H200 141GB",
    rationale:
      "High memory bandwidth keeps large models resident and latency low under concurrent " +
      "request load.",
    minNodeSize: "1x GPU",
    interconnect: "400 Gbps Ethernet",
  },
  rendering: {
    gpuName: "NVIDIA H100 80GB",
    rationale:
      "Compute-heavy and embarrassingly parallel. Scales horizontally without needing a " +
      "high-bandwidth fabric between nodes.",
    minNodeSize: "4x GPUs",
    interconnect: "400 Gbps Ethernet",
  },
  biotech: {
    gpuName: "AMD MI300X 192GB",
    rationale:
      "Largest available VRAM per accelerator suits molecular dynamics and protein folding " +
      "workloads that are bounded by system state size.",
    minNodeSize: "4x GPUs",
    interconnect: "Infinity Fabric",
  },
};

export const mockTokenRate: TokenRate = {
  priceUsd: 2.418,
  change24hPercent: 3.62,
  updatedAt: "2026-08-12T06:00:00Z",
};

/** Sample values transcribed from the report screen (Figma node 2:1545). */
export const mockAssessmentResult: AssessmentResult = {
  id: "asm_7f21c",
  status: "complete",
  viabilityScore: 78,
  viabilityLabel: "Status: Favorable",
  mwDensityRange: "10-50",
  timelineMonths: "14-18",
  capexEstimateUsd: 42_000_000,
  risks: [
    {
      title: "Supply Chain Volatility",
      body:
        "Procurement of high-density cooling systems may extend timeline by 2-4 months depending " +
        "on Q3 vendor availability.",
      severity: "medium",
    },
    {
      title: "Grid Interconnection Delays",
      body:
        "Local utility grid required for loads exceeding 20MW; historical data suggests a 15% " +
        "probability of grid upgrade requirements.",
      severity: "high",
    },
    {
      title: "Capex Variance",
      body:
        "Estimate carries a +/- 12% confidence interval pending final site selection and land " +
        "acquisition costs.",
      severity: "low",
    },
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
