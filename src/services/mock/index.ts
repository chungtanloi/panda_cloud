import type {
  AssessmentDraft,
  AssessmentSubmission,
  AuthProfile,
  BookingDraft,
  BookingRequestResult,
  BookingSubmission,
  BuildingClassification,
  EnergyMix,
  FiberProximity,
  GridTier,
  HyperscaleDraft,
  HyperscaleSubmission,
  InvestmentDraft,
  InvestmentResult,
  InvestmentSubmission,
  LandUseType,
  LineVoltage,
  LivePreview,
  LivePreviewRequest,
  MembershipRole,
  ProjectStage,
  SlaTier,
  SubstationDistance,
  WorkloadType,
  WorkspaceResourceKind,
  DealStatus,
  SalesCardDetailDto,
  SalesCardListQuery,
  SalesCardMoveRequest,
  SalesCardUpdateRequest,
} from "@/models";
import type { ApiClient } from "../contracts";
import { apiConfig } from "../config";
import { ApiError } from "../http";
import { sessionBridge } from "../session";
import { computeQuote } from "@/lib/booking/quote";
import { mockDealCards, mockSalesColumns } from "./salesFixtures";
import { mockWorkspaceTables } from "./workspaceFixtures";
import {
  analyzeStage,
  buildSchedule,
  listRegions,
  projectCapex,
  projectVolume,
  quoteSettlement,
} from "@/lib/projections";
import {
  mockAssessmentResult,
  mockDashboard,
  mockGpuModels,
  mockReceipt,
  mockRecommendations,
  mockTokenRate,
  mockUser,
} from "./fixtures";

/**
 * Standalone adapter — lets the whole frontend run with no backend.
 *
 * It implements `ApiClient` exactly, so switching to the real backend is a
 * change to NEXT_PUBLIC_API_ADAPTER only. No component or controller
 * distinguishes between the two.
 */

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), apiConfig.mockLatencyMs));
}

function reference(prefix: string): string {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Mutable copy of the seed deals so drag-and-drop persists for the session.
 * Module-scoped rather than per-call: the board reads it back after every move,
 * and a fresh array each time would undo the user's last action.
 */
let salesCards: SalesCardDetailDto[] = [...mockDealCards];

/**
 * Mock authorization so every role is reachable without a backend.
 *
 * The email comes from the signed-in Clerk identity via `sessionBridge`; when
 * Clerk is not configured this falls back to the fixture email. Behaviour is
 * carried over verbatim from `docs/KANBAN_INTEGRATION.md`
 * § "Testing without a backend":
 *
 *   admin@cloudpanda.example       -> admin
 *   *manager*@cloudpanda.example   -> manager
 *   anything-else@cloudpanda.example -> sales
 *   any other domain               -> customer (no membership)
 *
 * ⚠ This is a **development fixture**, not authorization. The HTTP adapter
 * never runs this code, and `assertApiConfig()` refuses to start the HTTP
 * adapter without Clerk.
 */
function mockRoleFor(email: string): MembershipRole {
  const lower = email.toLowerCase();
  if (!lower.endsWith("@cloudpanda.example")) return "customer";
  const localPart = lower.split("@")[0] ?? "";
  if (localPart === "admin") return "admin";
  if (localPart.includes("manager")) return "manager";
  return "sales";
}

const MOCK_ORGANIZATION_ID = "org_mock_cloud_panda";

function mockProfile(): AuthProfile {
  const email = sessionBridge.getIdentityHint() ?? mockUser.email;
  const role = mockRoleFor(email);
  const staff = role !== "customer";
  return {
    user: {
      ...mockUser,
      email,
      userType: staff ? "staff" : "customer",
      lastLoginAt: new Date().toISOString(),
    },
    authorization: {
      isStaff: staff,
      // A customer identity has no membership row — this mirrors the backend
      // default described in PHASE_1_FRONTEND_AUTH_HANDOFF.
      memberships: staff ? [{ organizationId: MOCK_ORGANIZATION_ID, role }] : [],
    },
  };
}

/**
 * Stand-in for the backend's assessment engine.
 *
 * ⚠ These are PLAUSIBLE PLACEHOLDER FORMULAS, not the real model. They exist
 * so the wizard is demonstrable end-to-end; the production numbers are the
 * backend's responsibility (docs/API_CONTRACT.md § 3). Every metric is omitted
 * until its own step has been answered, so the UI shows genuine empty states
 * rather than numbers invented from nothing.
 */
function computePreview(draft: AssessmentDraft): LivePreview {
  const preview: LivePreview = {};

  // --- Step 1: land viability ---
  const acres = draft.landProfile?.areaAcres;
  const landUse = draft.landProfile?.landUse;
  if (acres && landUse) {
    const zoningWeight: Record<LandUseType, number> = {
      industrial: 30,
      brownfield: 22,
      greenfield: 16,
      agricultural: 12,
    };
    const sizeFactor = Math.min(60, Math.round(acres / 8));
    preview.landViabilityScore = Math.min(100, sizeFactor + zoningWeight[landUse]);
    preview.landFactors = [
      { label: "Size Factor", value: `+${sizeFactor}` },
      { label: "Zoning Multiplier", value: `${(zoningWeight[landUse] / 20).toFixed(1)}x` },
    ];
  }

  // --- Step 2: density and CapEx ---
  const tier = draft.powerCapacity?.gridTier;
  const distance = draft.powerCapacity?.substationDistance;
  const voltage = draft.powerCapacity?.voltage;
  if (tier && distance && voltage && acres) {
    const midpointMw: Record<GridTier, number> = {
      sub_10mw: 8,
      "10_50mw": 30,
      "50_200mw": 125,
      over_200mw: 260,
    };
    const distanceCost: Record<SubstationDistance, number> = {
      on_site: 1,
      under_1km: 1.15,
      "1_5km": 1.4,
      over_5km: 1.9,
    };
    const voltageCost: Record<LineVoltage, number> = {
      under_66kv: 1.3,
      "66_138kv": 1.1,
      "138_345kv": 1,
      over_345kv: 0.95,
    };

    const mw = midpointMw[tier];
    preview.mwDensity = Number((mw / acres).toFixed(2));
    preview.infrastructureCapexUsd = Math.round(
      mw * 1_200_000 * distanceCost[distance] * voltageCost[voltage],
    );
    preview.capexBreakdown = { substation: "estimated", transmission: "estimated" };
  }

  // --- Step 3: ESG ---
  const mix = draft.energySource?.energyMix;
  if (mix) {
    const ppa = draft.energySource?.ppaAvailable ?? false;
    const table: Record<EnergyMix, { score: string; percent: number; carbon: number; ratio: number }> =
      {
        standard_grid: { score: "C+", percent: 42, carbon: 68.9, ratio: 18 },
        renewable_100: { score: "A-", percent: 82, carbon: 12.4, ratio: 100 },
        hybrid: { score: "B", percent: 64, carbon: 34.1, ratio: 55 },
      };
    const base = table[mix];

    preview.esgScore = ppa && mix !== "renewable_100" ? `${base.score}+` : base.score;
    preview.esgPercent = Math.min(100, base.percent + (ppa ? 6 : 0));
    preview.carbonFootprintTco2e = Number((base.carbon * (ppa ? 0.88 : 1)).toFixed(1));
    preview.renewableRatioPercent = Math.min(100, base.ratio + (ppa ? 10 : 0));
  }

  // --- Step 4: facility readiness ---
  const classification = draft.facilities?.buildingClassification;
  const fiber = draft.facilities?.fiberProximity;
  if (classification && fiber) {
    const buildingScore: Record<BuildingClassification, number> = {
      purpose_built: 45,
      industrial: 35,
      warehouse: 30,
      office: 15,
      none: 10,
    };
    const fiberScore: Record<FiberProximity, number> = {
      on_site: 45,
      under_1km: 38,
      "1_5km": 25,
      over_5km: 12,
      unknown: 5,
    };
    const pueByClass: Record<BuildingClassification, number> = {
      purpose_built: 1.15,
      industrial: 1.28,
      warehouse: 1.35,
      office: 1.55,
      none: 1.2, // new build can be designed efficiently
    };
    const capacityByFiber: Record<FiberProximity, string> = {
      on_site: "800 Gbps",
      under_1km: "400 Gbps",
      "1_5km": "200 Gbps",
      over_5km: "100 Gbps",
      unknown: "TBD",
    };

    preview.facilityReadiness = Math.min(100, buildingScore[classification] + fiberScore[fiber]);
    preview.projectedPue = pueByClass[classification];
    preview.rackDensityKw = classification === "purpose_built" ? 80 : 40;
    preview.networkCapacity = capacityByFiber[fiber];
  }

  return preview;
}

/** Shared upload echo for KYC and RFP documents. */
function uploadedDocument(file: File) {
  return {
    id: reference("doc").toLowerCase(),
    fileName: file.name,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

/** Assembles the Investment Confirmed screen's payload. */
function buildInvestmentResult(id: string, amountUsd: number): InvestmentResult {
  const projection = projectVolume(amountUsd);

  return {
    id,
    reference: reference("CP-INV"),
    status: "confirmed",
    totalInvestmentUsd: amountUsd,
    tokenAllocation: projection.tokenAllocation,
    tokenSymbol: projection.tokenSymbol,
    transactionId: "0x7a…f92b",
    transactionDate: new Date().toISOString(),
    network: "Solana",
    estimatedApyPercent: 14.2,
    // Compound the estimated APY over five years.
    fiveYearValueUsd: Math.round(amountUsd * Math.pow(1 + 0.142, 5)),
    createdAt: new Date().toISOString(),
  };
}

/** Assembles the Deployment Ready screen's payload from a submission. */
function buildBookingResult(id: string, payload: BookingSubmission): BookingRequestResult {
  const model = mockGpuModels.find((gpu) => gpu.id === payload.hardware.gpuModelId);
  const quote = computeQuote(payload, mockGpuModels);

  const slaLabels: Record<SlaTier, string> = {
    standard: "Standard SLA Tier 3 Active (99.5% Uptime)",
    enterprise: "Enterprise SLA Tier 1 Active (99.99% Uptime)",
    critical: "Critical SLA Tier 0 Active (99.999% Uptime)",
  };

  return {
    id,
    reference: reference("CP-GPU"),
    status: "reserved",
    architecture: {
      primaryGpu: model ? `NVIDIA ${model.name}` : "—",
      formFactor: model?.specs.formFactor ?? "—",
      nodeCount: payload.scale.gpuCount,
      interconnect: "InfiniBand NDR 400G",
      vramPerGpu: model?.specs.vram ?? "—",
      systemMemory: "2TB / Node",
      storage: "30TB NVMe",
      slaLabel: slaLabels[payload.powerCooling.sla],
    },
    quote,
    // `quoteUrl` is deliberately absent: the PDF is generated server-side, and
    // the UI disables the download rather than serving an empty file.
    createdAt: new Date().toISOString(),
  };
}

/* ------------------------- Sales pipeline (mock) ------------------------- */

const MOCK_COLUMN_BY_ID = new Map(mockSalesColumns.map((column) => [column.columnId, column]));

function dealStatusForColumn(columnId: string): DealStatus {
  const category = MOCK_COLUMN_BY_ID.get(columnId)?.stageCategory;
  if (category === "won") return "won";
  if (category === "lost") return "lost";
  if (category === "paused") return "on_hold";
  return "open";
}

function mockSalesCardPage(query: SalesCardListQuery): {
  items: SalesCardDetailDto[];
  nextCursor: string | null;
} {
  const columnId = query.columnId;
  const filtered = salesCards
    .filter((card) => card.columnId === columnId)
    .filter((card) => (query.vertical ? card.vertical === query.vertical : true))
    .filter((card) => (query.ownerId ? card.ownerId === query.ownerId : true))
    .filter((card) => (query.priority ? card.priority === query.priority : true))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));

  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  const offset = query.cursor ? Number(atob(query.cursor)) : 0;
  const items = filtered.slice(offset, offset + limit);
  const nextCursor = offset + limit < filtered.length ? btoa(String(offset + limit)) : null;
  return { items, nextCursor };
}

function mockUpdateSalesCard(id: string, body: SalesCardUpdateRequest): { dealId: string; revision: number } {
  const index = salesCards.findIndex((deal) => deal.dealId === id);
  if (index === -1) {
    throw new ApiError({ code: "NOT_FOUND", message: `Deal ${id} not found.`, status: 404 });
  }
  const card = salesCards[index]!;
  if (body.expectedRevision !== card.revision) {
    throw new ApiError({
      code: "CONFLICT",
      message: "This deal changed on the server. Reloading the latest version.",
      status: 409,
    });
  }

  const next: SalesCardDetailDto = { ...card };
  // Both omission and explicit null mean "no change" in this contract.
  if (body.title !== undefined && body.title !== null) next.title = body.title;
  if (body.description !== undefined && body.description !== null) next.description = body.description;
  if (body.priority !== undefined && body.priority !== null) next.priority = body.priority;
  if (body.estimatedValueMinor !== undefined && body.estimatedValueMinor !== null) {
    next.estimatedValueMinor = body.estimatedValueMinor;
    next.currency = body.currency ?? null;
  }
  if (body.probabilityPercent !== undefined && body.probabilityPercent !== null) {
    next.probabilityPercent = body.probabilityPercent;
  }
  if (body.expectedCloseDate !== undefined && body.expectedCloseDate !== null) {
    next.expectedCloseDate = body.expectedCloseDate;
  }
  next.revision = card.revision + 1;
  next.updatedAt = new Date().toISOString();

  salesCards = salesCards.map((deal, i) => (i === index ? next : deal));
  return { dealId: id, revision: next.revision };
}

function mockMoveSalesCard(id: string, body: SalesCardMoveRequest): { dealId: string; status: DealStatus; revision: number } {
  const index = salesCards.findIndex((deal) => deal.dealId === id);
  if (index === -1) {
    throw new ApiError({ code: "NOT_FOUND", message: `Deal ${id} not found.`, status: 404 });
  }
  const card = salesCards[index]!;
  if (body.expectedRevision !== card.revision) {
    throw new ApiError({
      code: "CONFLICT",
      message: "This deal changed on the server. Reloading the latest version.",
      status: 409,
    });
  }
  const target = MOCK_COLUMN_BY_ID.get(body.toColumnId);
  if (!target) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: `Column ${body.toColumnId} not found or inactive.`,
      status: 404,
    });
  }

  const roles = mockProfile().authorization.memberships.map((membership) => membership.role);
  if (target.stageCategory === "won" || target.stageCategory === "lost") {
    if (!roles.includes("manager") && !roles.includes("admin")) {
      throw new ApiError({
        code: "FORBIDDEN",
        message: "Only managers and admins can move a deal to Won or Lost.",
        status: 403,
      });
    }
  }
  if ((target.stageCategory === "lost" || target.stageCategory === "paused") && !body.reason) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: `A reason is required when moving to "${target.name}".`,
      status: 400,
    });
  }

  const status = dealStatusForColumn(body.toColumnId);
  const next: SalesCardDetailDto = {
    ...card,
    columnId: body.toColumnId,
    status,
    revision: card.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  if (status === "won") next.wonAt = next.updatedAt;
  if (status === "lost") next.lostReason = body.reason ?? null;

  salesCards = salesCards.map((deal, i) => (i === index ? next : deal));
  return { dealId: id, status, revision: next.revision };
}

export const mockApi: ApiClient = {
  auth: {
    me: () => delay(mockProfile()),
  },

  assessment: {
    preview: (payload: LivePreviewRequest) => delay(computePreview(payload)),

    submit: (payload: AssessmentSubmission) => {
      const preview = computePreview(payload);
      // Blend the per-step scores into a single headline figure.
      const parts = [
        preview.landViabilityScore,
        preview.esgPercent,
        preview.facilityReadiness,
      ].filter((n): n is number => typeof n === "number");
      const viability = parts.length
        ? Math.round(parts.reduce((sum, n) => sum + n, 0) / parts.length)
        : 0;

      return delay({
        ...mockAssessmentResult,
        id: reference("asm").toLowerCase(),
        viabilityScore: viability,
        viabilityLabel:
          viability >= 75 ? "Status: Favorable" : viability >= 50 ? "Status: Viable" : "Status: Marginal",
        capexEstimateUsd: preview.infrastructureCapexUsd ?? mockAssessmentResult.capexEstimateUsd,
      });
    },

    getResult: (id: string) => delay({ ...mockAssessmentResult, id }),
  },

  booking: {
    listGpuModels: () => delay(mockGpuModels),

    recommend: (workload: WorkloadType) => delay(mockRecommendations[workload]),

    quote: (payload: BookingDraft) => delay(computeQuote(payload, mockGpuModels)),

    submit: (payload: BookingSubmission) =>
      delay(buildBookingResult(reference("bkg").toLowerCase(), payload)),

    getRequest: (id: string) =>
      // Without a store, replay a representative reservation.
      delay(
        buildBookingResult(id, {
          workload: { workload: "llm_training" },
          hardware: { gpuModelId: "h100" },
          scale: { gpuCount: 64, deploymentTarget: "asap", commitment: "one_year" },
          powerCooling: {
            deploymentModel: "bare_metal",
            cooling: "liquid",
            sla: "enterprise",
          },
        }),
      ),
  },

  investment: {
    getRate: () => delay(mockTokenRate),

    project: (amountUsd: number) => delay(projectVolume(amountUsd)),

    settlement: (draft: InvestmentDraft) => delay(quoteSettlement(draft)),

    uploadKycDocument: (file: File) => delay(uploadedDocument(file)),

    submit: (payload: InvestmentSubmission) =>
      delay(buildInvestmentResult(reference("inv").toLowerCase(), payload.volume.amountUsd)),

    getInvestment: (id: string) => delay(buildInvestmentResult(id, 250_000)),
  },

  hyperscale: {
    analyzeStage: (stage: ProjectStage) => delay(analyzeStage(stage)),

    projectCapex: (draft: HyperscaleDraft) => delay(projectCapex(draft)),

    listRegions: () => delay(listRegions()),

    buildSchedule: (draft: HyperscaleDraft) => delay(buildSchedule(draft)),

    uploadRfpDocument: (file: File) => delay(uploadedDocument(file)),

    submit: (payload: HyperscaleSubmission) =>
      delay({
        id: reference("hyp").toLowerCase(),
        reference: reference("CP-HYP"),
        status: payload.rfp.requestConsultation ? ("scheduled" as const) : ("received" as const),
        createdAt: new Date().toISOString(),
      }),

    getRequest: (id: string) =>
      delay({
        id,
        reference: reference("CP-HYP"),
        status: "in_review" as const,
        createdAt: "2026-08-08T16:20:00Z",
      }),
  },

  dashboard: {
    getSummary: () => delay(mockDashboard),
    getReceipt: (ref: string) => delay({ ...mockReceipt, reference: ref }),
  },

  workspace: {
    getResource: (kind: WorkspaceResourceKind) => delay(mockWorkspaceTables[kind]),
  },

  sales: {
    listColumns: () => delay({ columns: mockSalesColumns }),

    listCards: (query: SalesCardListQuery) => delay(mockSalesCardPage(query)),

    getCard: (id: string) => {
      const card = salesCards.find((deal) => deal.dealId === id);
      if (!card) {
        return Promise.reject(
          new ApiError({ code: "NOT_FOUND", message: `Deal ${id} not found.`, status: 404 }),
        );
      }
      return delay({ ...card });
    },

    updateCard: (id: string, body: SalesCardUpdateRequest) =>
      delay(mockUpdateSalesCard(id, body)),

    moveCard: (id: string, body: SalesCardMoveRequest) =>
      delay(mockMoveSalesCard(id, body)),
  },

  leads: {
    create: () =>
      delay({
        id: reference("lead").toLowerCase(),
        reference: reference("CP-LEAD"),
        status: "received" as const,
        createdAt: new Date().toISOString(),
      }),
  },
};
