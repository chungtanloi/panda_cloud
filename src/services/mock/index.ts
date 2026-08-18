import type {
  KycCase,
  KycCaseCreate,
  KycCaseUpdate,
  NcndaAgreementDetail,
  NcndaAgreementUpsert,
  DdAssessmentCreate,
  DdAssessmentDetail,
  DdAssessmentSummary,
  DdMetrics,
  DdResponse,
  DdResponsePatch,
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
  SalesCardCreateRequest,
  SalesCardDetailDto,
  SalesCardListQuery,
  SalesCardMoveRequest,
  SalesCardUpdateRequest,
  DealChangeRequest,
  DealChangeRequestCreate,
  DealChangeRequestDecision,
} from "@/models";
import { kycUpdateProblems } from "@/models";
import type { SalesLeadQualifyRequest } from "@/models/salesWorkspace";
import type { ApiClient } from "../contracts";
import { apiConfig } from "../config";
import { ApiError } from "../http";
import { sessionBridge } from "../session";
import { computeQuote } from "@/lib/booking/quote";
import { mockDealCards, mockSalesColumns } from "./salesFixtures";
import { mockWorkspaceTables } from "./workspaceFixtures";
import {
  mockKycCases,
  mockNcndaAgreements,
  toAgreementSummary,
} from "./legalComplianceFixtures";
import {
  MOCK_TEMPLATE_VERSION_LABEL,
  buildMockAssessments,
  mockDdTemplateItems,
} from "./ddFixtures";
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
let dealChangeRequests: DealChangeRequest[] = [];

function createMockDealRequest(
  dealId: string,
  body: DealChangeRequestCreate,
): DealChangeRequest {
  const card = salesCards.find((deal) => deal.dealId === dealId);
  if (!card) throw new ApiError({ code: "NOT_FOUND", message: "Deal not found.", status: 404 });
  if (body.expectedDealRevision !== card.revision) {
    throw new ApiError({ code: "CONFLICT", message: "The deal has changed. Reload and try again.", status: 409 });
  }
  const duplicate = dealChangeRequests.find(
    (item) => item.dealId === dealId && item.requestType === body.requestType && item.status === "pending",
  );
  if (duplicate) return duplicate;
  const now = new Date().toISOString();
  const item: DealChangeRequest = {
    requestId: `request_${Date.now()}`,
    dealId,
    dealTitle: card.title,
    organizationName: card.organizationName,
    ownerName: card.ownerName,
    currentStage: mockSalesColumns.find((column) => column.columnId === card.columnId)?.name ?? null,
    requestedBy: { userId: mockUser.id, fullName: mockUser.fullName },
    reviewedBy: null,
    requestType: body.requestType,
    status: "pending",
    reason: body.reason,
    expectedDealRevision: card.revision,
    currentDealRevision: card.revision,
    decisionComment: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
    revision: 1,
  };
  dealChangeRequests = [item, ...dealChangeRequests];
  return item;
}

function decideMockDealRequest(
  requestId: string,
  body: DealChangeRequestDecision,
): DealChangeRequest {
  const index = dealChangeRequests.findIndex((item) => item.requestId === requestId);
  if (index < 0) throw new ApiError({ code: "NOT_FOUND", message: "Request not found.", status: 404 });
  const request = dealChangeRequests[index]!;
  if (request.revision !== body.expectedRequestRevision) {
    throw new ApiError({ code: "CONFLICT", message: "This request has changed. Reloading is required.", status: 409 });
  }
  const now = new Date().toISOString();
  if (body.decision === "approve") {
    const cardIndex = salesCards.findIndex((deal) => deal.dealId === request.dealId);
    const card = salesCards[cardIndex];
    if (!card || card.revision !== request.expectedDealRevision) {
      throw new ApiError({ code: "CONFLICT", message: "The deal changed after this request was submitted.", status: 409 });
    }
    if (request.requestType === "mark_won") {
      const won = mockSalesColumns.find((column) => column.code === "won")!;
      salesCards[cardIndex] = { ...card, columnId: won.columnId, status: "won", wonAt: now, updatedAt: now, revision: card.revision + 1 };
    } else {
      salesCards[cardIndex] = { ...card, status: "archived", archivedAt: now, updatedAt: now, revision: card.revision + 1 };
    }
  }
  const next: DealChangeRequest = {
    ...request,
    status: body.decision === "approve" ? "approved" : "rejected",
    reviewedBy: { userId: "mock_manager", fullName: "Mock Manager" },
    decisionComment: body.comment ?? null,
    reviewedAt: now,
    updatedAt: now,
    revision: request.revision + 1,
  };
  dealChangeRequests[index] = next;
  return next;
}

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

let mockDealSequence = 0;
let mockOrganizationSequence = 0;
/** Mock stand-in for the `organizations.by_normalizedName` index. */
const mockOrganizationNames = new Map<string, string>();

/**
 * Mirrors the backend create mutation closely enough to exercise the UI:
 * validates the required references exist, derives `status` from the target
 * column's category, defaults to the `new` column, and starts at revision 1.
 *
 * The real invariants (atomic stage-history + audit rows, role check, active
 * staff owner) are the backend's; this only has to make the board behave.
 */
function mockCreateSalesCard(body: SalesCardCreateRequest): { dealId: string; revision: number } {
  const column = body.stageId
    ? mockSalesColumns.find((candidate) => candidate.columnId === body.stageId)
    : mockSalesColumns.find((candidate) => candidate.code === "new");
  if (!column) {
    throw new ApiError({ code: "NOT_FOUND", message: "Stage was not found.", status: 404 });
  }
  const title = body.title?.trim() ?? "";
  const organizationName = body.organizationName?.trim() ?? "";
  // Mirror the gateway's XOR rule so a payload that would 400 in production
  // also fails here — an adapter that is more permissive than the real one
  // hides integration defects until deploy (workflow § 6).
  if (Boolean(body.organizationId) === Boolean(organizationName)) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Provide exactly one of organizationId or organizationName.",
      status: 400,
    });
  }
  if (!title || !body.vertical) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Title and vertical are required.",
      status: 400,
    });
  }

  // Mirror the backend contact rule (DEALFLOW § 5.1) so the mock rejects
  // exactly what the gateway rejects.
  const contactName = body.contactName?.trim() ?? "";
  const contactEmail = body.contactEmail?.trim() ?? "";
  const contactPhone = body.contactPhone?.trim() ?? "";
  if ((contactEmail || contactPhone) && !contactName) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "A contact name is required.",
      status: 400,
    });
  }
  if (contactName && !contactEmail && !contactPhone) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "A contact needs at least an email or a phone number.",
      status: 400,
    });
  }

  // Find-or-create by normalized name, as `deals.resolveOrganization` does.
  const normalized = organizationName.toLowerCase().replace(/\s+/g, " ");
  const matched = salesCards.find(
    (card) => mockOrganizationNames.get(card.organizationId) === normalized,
  );
  let organizationId = body.organizationId ?? matched?.organizationId;
  if (!organizationId) {
    mockOrganizationSequence += 1;
    organizationId = `org_mock_${mockOrganizationSequence}`;
    mockOrganizationNames.set(organizationId, normalized);
  }

  mockDealSequence += 1;
  const timestamp = new Date().toISOString();
  const created: SalesCardDetailDto = {
    dealId: `deal_mock_${mockDealSequence}`,
    title,
    organizationId,
    organizationName: organizationName || null,
    ownerName: "Ada Mensah",
    primaryContact: contactName
      ? {
          contactId: `ct_mock_${mockDealSequence + 1}`,
          fullName: contactName,
          jobTitle: body.contactJobTitle?.trim() || null,
          email: contactEmail || null,
          phone: contactPhone || null,
          status: "active" as const,
        }
      : null,
    // The backend defaults an omitted owner to the authenticated actor; the
    // mock has no session, so it uses its own sales fixture identity.
    ownerId: body.ownerId ?? "user_sales_01",
    columnId: column.columnId,
    status: dealStatusForColumn(column.columnId),
    vertical: body.vertical,
    priority: body.priority ?? "normal",
    estimatedValueMinor: body.estimatedValueMinor ?? null,
    currency: body.currency ?? null,
    probabilityPercent: body.probabilityPercent ?? null,
    expectedCloseDate: body.expectedCloseDate ?? null,
    lastContactAt: null,
    lastContactMethod: null,
    revision: 1,
    updatedAt: timestamp,
    description: body.description ?? null,
    lostReason: null,
    wonAt: null,
    projectId: null,
    createdAt: timestamp,
    createdBy: "user_sales_01",
    archivedAt: null,
  };
  salesCards = [created, ...salesCards];
  return { dealId: created.dealId, revision: created.revision };
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


/* ------------------------- Due Diligence (DD API.md) ---------------------- */

const ddState = buildMockAssessments();
let ddSequence = 100;

function findAssessment(assessmentId: string): DdAssessmentSummary {
  const found = ddState.summaries.find((row) => row.id === assessmentId);
  if (!found) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: `Assessment ${assessmentId} not found.`,
      status: 404,
    });
  }
  return found;
}

/**
 * DEALFLOW § 6, verbatim:
 *
 *   completionRate   = reviewedItems / totalItems
 *   complianceRate   = (compliant + 0.5 * partiallyCompliant) / applicableReviewedItems
 *   criticalFailures = count(criticality = critical AND status = non_compliant)
 *
 * A zero denominator yields `null`, never 0 — "nothing measured yet" and
 * "measured zero" are different facts and the UI renders them differently.
 */
function computeMetrics(responses: readonly DdResponse[]): DdMetrics {
  const totalItems = mockDdTemplateItems.length;
  const answered = responses.filter((row) => row.status !== "not_reviewed");
  const applicable = answered.filter((row) => row.status !== "not_applicable");
  const compliant = applicable.filter((row) => row.status === "compliant").length;
  const partial = applicable.filter((row) => row.status === "partially_compliant").length;

  const criticalCodes = new Set(
    mockDdTemplateItems.filter((item) => item.criticality === "critical").map((item) => item.id),
  );

  return {
    totalItems,
    reviewedItems: answered.length,
    completionRate: totalItems === 0 ? null : answered.length / totalItems,
    complianceRate: applicable.length === 0 ? null : (compliant + 0.5 * partial) / applicable.length,
    criticalFailures: responses.filter(
      (row) => row.status === "non_compliant" && criticalCodes.has(row.templateItemId),
    ).length,
  };
}

function withMetrics(summary: DdAssessmentSummary): DdAssessmentSummary {
  return { ...summary, metrics: computeMetrics(ddState.responsesByAssessment[summary.id] ?? []) };
}

function mockGetAssessment(assessmentId: string): DdAssessmentDetail {
  const summary = withMetrics(findAssessment(assessmentId));
  return {
    ...summary,
    items: mockDdTemplateItems,
    responses: ddState.responsesByAssessment[assessmentId] ?? [],
  };
}

function mockCreateAssessment(dealId: string, body: DdAssessmentCreate) {
  if (body.dealId && body.dealId !== dealId) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "The body dealId must match the path.",
      status: 400,
    });
  }
  ddSequence += 1;
  const id = `dd_mock_${ddSequence}`;
  const now = new Date().toISOString();
  ddState.summaries.unshift({
    id,
    dealId,
    dealTitle: `Deal ${dealId}`,
    organizationName: "—",
    templateVersionLabel: MOCK_TEMPLATE_VERSION_LABEL,
    status: "not_started",
    ...(body.assignedToUserId ? { assignedToName: body.assignedToUserId } : {}),
    updatedAt: now,
    revision: 1,
    metrics: computeMetrics([]),
  });
  ddState.responsesByAssessment[id] = [];
  return { assessmentId: id, revision: 1 };
}

function mockUpdateResponse(
  assessmentId: string,
  templateItemId: string,
  body: DdResponsePatch,
) {
  const summary = findAssessment(assessmentId);

  // DD API.md: 409 when the revision is stale OR the assessment is already
  // completed/cancelled. Both are the same class of "you are acting on a
  // version of reality that no longer exists".
  if (summary.status === "completed" || summary.status === "cancelled") {
    throw new ApiError({
      code: "CONFLICT",
      message: `This assessment is ${summary.status} and can no longer be edited.`,
      status: 409,
    });
  }
  if (!mockDdTemplateItems.some((item) => item.id === templateItemId)) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: `Requirement ${templateItemId} is not in this template.`,
      status: 404,
    });
  }

  const responses = ddState.responsesByAssessment[assessmentId] ?? [];
  const index = responses.findIndex((row) => row.templateItemId === templateItemId);
  // A requirement nobody has answered yet has no row, so revision 0 is the
  // caller's way of saying "I believe this is unanswered" — the upsert case.
  const current = index === -1 ? null : responses[index]!;
  if (body.expectedRevision !== (current?.revision ?? 0)) {
    throw new ApiError({
      code: "CONFLICT",
      message: "This response changed on the server. Reloading the latest version.",
      status: 409,
    });
  }

  const now = new Date().toISOString();
  const next: DdResponse = {
    id: current?.id ?? `ddr_mock_${assessmentId}_${templateItemId}`,
    assessmentId,
    templateItemId,
    status: body.status ?? current?.status ?? "not_reviewed",
    ...(body.responseValue !== undefined
      ? { responseValue: body.responseValue }
      : current?.responseValue !== undefined
        ? { responseValue: current.responseValue }
        : {}),
    ...(body.comments !== undefined
      ? { comments: body.comments }
      : current?.comments !== undefined
        ? { comments: current.comments }
        : {}),
    ...(body.markReviewed
      ? { reviewedBy: "Technical reviewer", reviewedAt: now }
      : current?.reviewedBy
        ? { reviewedBy: current.reviewedBy, reviewedAt: current.reviewedAt }
        : {}),
    updatedAt: now,
    revision: (current?.revision ?? 0) + 1,
    evidence: current?.evidence ?? [],
  };

  const updated =
    index === -1
      ? [...responses, next]
      : responses.map((row, position) => (position === index ? next : row));
  ddState.responsesByAssessment[assessmentId] = updated;

  // DD API.md: response rev+1 -> recompute progress -> assessment snapshot
  // rev+1. The deal DD summary bump has no frontend surface to observe it.
  const summaryIndex = ddState.summaries.findIndex((row) => row.id === assessmentId);
  const progress = computeMetrics(updated);
  const bumped: DdAssessmentSummary = {
    ...summary,
    status: summary.status === "not_started" ? "in_progress" : summary.status,
    updatedAt: now,
    revision: summary.revision + 1,
    metrics: progress,
  };
  ddState.summaries[summaryIndex] = bumped;

  return {
    assessmentId,
    templateItemId,
    responseRevision: next.revision,
    assessmentRevision: bumped.revision,
    progress,
  };
}


/* ---------------------- Legal (NCNDA) and Compliance (KYC) ---------------- */

let ncndaAgreements: NcndaAgreementDetail[] = [...mockNcndaAgreements];
let kycCases: KycCase[] = [...mockKycCases];
let legalSequence = 100;

function findAgreement(agreementId: string): NcndaAgreementDetail {
  const found = ncndaAgreements.find((row) => row.agreementId === agreementId);
  if (!found) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: `Agreement ${agreementId} not found.`,
      status: 404,
    });
  }
  return found;
}

/**
 * Mirrors `convex/ncnda.ts#upsertAgreement`, including the rules that make it
 * fail. An adapter that is more permissive than the backend hides integration
 * defects until deploy.
 */
function mockUpsertAgreement(body: NcndaAgreementUpsert) {
  // "Active NCNDA requires effectiveDate."
  if (body.status === "active" && !/^\d{4}-\d{2}-\d{2}$/.test(body.effectiveDate ?? "")) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "An active NCNDA needs an effective date (YYYY-MM-DD).",
      status: 400,
    });
  }

  const existingId = (body as { agreementId?: string }).agreementId;
  const current = existingId ? findAgreement(existingId) : null;

  // "An active NCNDA already exists." — at most one per deal + counterparty.
  if (body.status === "active") {
    const clash = ncndaAgreements.find(
      (row) =>
        row.status === "active" &&
        row.dealId === body.dealId &&
        row.counterpartyOrganizationId === body.counterpartyOrganizationId &&
        row.agreementId !== existingId,
    );
    if (clash) {
      throw new ApiError({
        code: "CONFLICT",
        message: "An active NCNDA already exists for this deal and counterparty.",
        status: 409,
      });
    }
  }

  const now = new Date().toISOString();

  if (current) {
    // "expectedRevision is required."
    if (body.expectedRevision === undefined) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        message: "expectedRevision is required when updating an agreement.",
        status: 400,
      });
    }
    if (body.expectedRevision !== current.revision) {
      throw new ApiError({
        code: "CONFLICT",
        message: "This agreement changed on the server. Reloading the latest version.",
        status: 409,
      });
    }
    const next: NcndaAgreementDetail = {
      ...current,
      status: body.status,
      effectiveDate: body.effectiveDate ?? null,
      expiresAt: body.expiresAt ?? null,
      sentAt: body.sentAt ?? null,
      signedAt: body.signedAt ?? null,
      countersignedAt: body.countersignedAt ?? null,
      ownerId: body.ownerId,
      notes: body.notes ?? null,
      updatedAt: now,
      revision: current.revision + 1,
    };
    ncndaAgreements = ncndaAgreements.map((row) =>
      row.agreementId === current.agreementId ? next : row,
    );
    return { agreementId: next.agreementId, revision: next.revision, created: false };
  }

  legalSequence += 1;
  const agreementId = `ncnda_mock_${legalSequence}`;
  ncndaAgreements = [
    {
      agreementId,
      dealId: body.dealId,
      dealTitle: null,
      counterpartyOrganizationId: body.counterpartyOrganizationId,
      counterpartyName: null,
      status: body.status,
      effectiveDate: body.effectiveDate ?? null,
      expiresAt: body.expiresAt ?? null,
      sentAt: body.sentAt ?? null,
      signedAt: body.signedAt ?? null,
      countersignedAt: body.countersignedAt ?? null,
      ownerId: body.ownerId,
      ownerName: null,
      notes: body.notes ?? null,
      updatedAt: now,
      revision: 1,
      versions: [],
    },
    ...ncndaAgreements,
  ];
  return { agreementId, revision: 1, created: true };
}

function findCase(caseId: string): KycCase {
  const found = kycCases.find((row) => row.caseId === caseId);
  if (!found) {
    throw new ApiError({
      code: "NOT_FOUND",
      message: `KYC case ${caseId} not found.`,
      status: 404,
    });
  }
  return found;
}

/** Mirrors `convex/kyc.ts#createCase`, failures included. */
function mockCreateKycCase(body: KycCaseCreate) {
  // "Exactly one KYC subject is required."
  if (Boolean(body.subjectOrganizationId) === Boolean(body.subjectContactId)) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Provide exactly one subject — an organization or a contact.",
      status: 400,
    });
  }
  // "provider and providerCaseId must be supplied together."
  if (Boolean(body.provider) !== Boolean(body.providerCaseId)) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Provider and provider case id must be supplied together.",
      status: 400,
    });
  }
  if (
    body.provider &&
    kycCases.some(
      (row) => row.provider === body.provider && row.providerCaseId === body.providerCaseId,
    )
  ) {
    throw new ApiError({
      code: "CONFLICT",
      message: "That provider case already exists.",
      status: 409,
    });
  }

  legalSequence += 1;
  const caseId = `kyc_mock_${legalSequence}`;
  kycCases = [
    {
      caseId,
      dealId: body.dealId,
      dealTitle: null,
      subject: body.subjectOrganizationId
        ? {
            kind: "organization",
            organizationId: body.subjectOrganizationId,
            displayName: null,
          }
        : { kind: "contact", contactId: body.subjectContactId!, displayName: null },
      provider: body.provider ?? null,
      providerCaseId: body.providerCaseId ?? null,
      status: body.status ?? "not_started",
      riskLevel: body.riskLevel ?? null,
      assignedToId: body.assignedTo ?? null,
      assignedToName: null,
      rejectionReason: null,
      submittedAt: null,
      verifiedAt: null,
      expiresAt: null,
      updatedAt: new Date().toISOString(),
      revision: 1,
    },
    ...kycCases,
  ];
  return { caseId, revision: 1 };
}

/** Mirrors `convex/kyc.ts#updateCase`, failures included. */
function mockUpdateKycCase(caseId: string, body: KycCaseUpdate) {
  const current = findCase(caseId);
  if (body.expectedRevision !== current.revision) {
    throw new ApiError({
      code: "CONFLICT",
      message: "This case changed on the server. Reloading the latest version.",
      status: 409,
    });
  }
  const problems = kycUpdateProblems(body);
  if (problems.length > 0) {
    throw new ApiError({ code: "VALIDATION_ERROR", message: problems[0]!, status: 400 });
  }

  const next: KycCase = {
    ...current,
    status: body.status,
    riskLevel: body.riskLevel ?? null,
    assignedToId: body.assignedTo ?? null,
    assignedToName: body.assignedTo ? current.assignedToName : null,
    rejectionReason: body.rejectionReason ?? null,
    submittedAt: body.submittedAt ?? null,
    verifiedAt: body.verifiedAt ?? null,
    expiresAt: body.expiresAt ?? null,
    updatedAt: new Date().toISOString(),
    revision: current.revision + 1,
  };
  kycCases = kycCases.map((row) => (row.caseId === caseId ? next : row));
  return { caseId, revision: next.revision };
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

  submissions: {
    create: async () => { throw new ApiError({ code: "NOT_IMPLEMENTED", message: "Submission mock is not configured.", status: 501 }); },
    list: async () => ({ leads: [], continueCursor: null, isDone: true }),
    get: async () => { throw new ApiError({ code: "NOT_FOUND", message: "Submission not found.", status: 404 }); },
    convert: async () => { throw new ApiError({ code: "NOT_IMPLEMENTED", message: "Submission conversion mock is not configured.", status: 501 }); },
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

    createCard: (body: SalesCardCreateRequest) => delay(mockCreateSalesCard(body)),

    updateCard: (id: string, body: SalesCardUpdateRequest) =>
      delay(mockUpdateSalesCard(id, body)),

    moveCard: (id: string, body: SalesCardMoveRequest) =>
      delay(mockMoveSalesCard(id, body)),
  },

  /**
   * Technical Due Diligence — `DD API.md`, the same five operations the HTTP
   * adapter exposes and no others.
   *
   * It recomputes the metrics from the stored responses
   * using the formulas in DEALFLOW § 6 rather than serving a canned number, so
   * a screen built against it behaves like the real thing — including the
   * `null`-on-zero-denominator rule, which must render as an em dash and never
   * as "0%".
   */
  salesWorkspace: {
    overview: async () => ({ leadCountsByStatus: {}, pipelineValue: [], pendingFollowUps: [], closingDeals: [], momentum: [], dealSummary: { open: 0, won: 0, lost: 0, total: 0 } }),
    conversionReport: async () => ({ totalLeads: 0, countsByStatus: {}, timeSeries: {}, _open: { note: "Mock adapter", numerator: 0, denominator: 0 } }),
    activityReport: async () => ({ totalActivities: 0, countsByType: {}, countsByStatus: {}, followUp: { overdue: 0, dueInRequestedWindow: 0 } }),
    forecastReport: async () => ({ byCurrency: {}, deals: [], _open: { note: "Mock adapter" } }),
    listLeads: async () => ({ leads: [], isDone: true }),
    getLead: async (id: string) => { throw new ApiError({ status: 404, code: "NOT_FOUND", message: `Lead ${id} not found` }); },
    qualifyLead: async (id: string, body: SalesLeadQualifyRequest) => ({ leadId: id, status: body.status, updatedAt: new Date().toISOString() }),
    listTasks: async () => ({ tasks: [], isDone: true }),
    getTask: async (id: string) => { throw new ApiError({ status: 404, code: "NOT_FOUND", message: `Task ${id} not found` }); },
    updateTask: async (id: string) => ({ activityId: id, updatedAt: new Date().toISOString() }),
    listActivities: async () => ({ activities: [], isDone: true }),
    createActivity: async () => ({ activityId: "mock-activity", dealRevision: 1, updatedAt: new Date().toISOString() }),
    listCustomers: async () => ({ customers: [], isDone: true }),
    getCustomer: async (id: string) => { throw new ApiError({ status: 404, code: "NOT_FOUND", message: `Customer ${id} not found` }); },
  },  dueDiligence: {
    listAssessments: (dealId: string) =>
      delay({ items: ddState.summaries.filter((row) => row.dealId === dealId).map(withMetrics) }),

    createAssessment: (dealId: string, body: DdAssessmentCreate) =>
      delay(mockCreateAssessment(dealId, body)),

    getAssessment: (assessmentId: string) => delay(mockGetAssessment(assessmentId)),

    getProgress: (assessmentId: string) => {
      const summary = withMetrics(findAssessment(assessmentId));
      return delay({
        assessmentId: summary.id,
        status: summary.status,
        revision: summary.revision,
        ...summary.metrics,
      });
    },

    updateResponse: (assessmentId: string, templateItemId: string, body: DdResponsePatch) =>
      delay(mockUpdateResponse(assessmentId, templateItemId, body)),
  },

  /**
   * NCNDA — Legal. Enforces exactly the rules `convex/ncnda.ts` enforces, so a
   * form that passes here passes there.
   */
  legal: {
    listAgreements: (dealId: string) => delay({ items: ncndaAgreements.filter((row) => row.dealId === dealId).map(toAgreementSummary) }),
    getAgreement: (agreementId: string) => delay({ ...findAgreement(agreementId) }),
    upsertAgreement: (body: NcndaAgreementUpsert) => delay(mockUpsertAgreement(body)),
    listDocuments: (agreementId: string) => delay(findAgreement(agreementId).versions),
    attachDocument: async () => { throw new ApiError({ code: "NOT_IMPLEMENTED", message: "Document attachment is unavailable in the mock adapter.", status: 501 }); },
    detachDocument: async () => { throw new ApiError({ code: "NOT_IMPLEMENTED", message: "Document detachment is unavailable in the mock adapter.", status: 501 }); },
  },

  /** KYC — Compliance. The HTTP adapter is the production gateway path. */
  compliance: {
    listCases: (dealId: string) => delay({ items: kycCases.filter((row) => row.dealId === dealId).map((row) => ({ ...row })) }),
    getCase: (caseId: string) => delay({ ...findCase(caseId) }),
    createCase: (dealId: string, body: Omit<KycCaseCreate, "dealId">) => delay(mockCreateKycCase({ ...body, dealId })),
    updateCase: (caseId: string, body: KycCaseUpdate) =>
      delay(mockUpdateKycCase(caseId, body)),
    listDocuments: async () => ({ caseId: "", documents: [] }),
    attachDocument: async () => ({ linkId: "mock-link", documentId: "mock-document" }),
    detachDocument: async (_caseId: string, documentId: string) => ({ documentId, detached: true }),
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

  manager: {
    overview: async () => ({ commercial: { dealCounts: {}, pipelineValueByCurrency: [], wonDealCount: 0 }, team: { activeSalesMemberCount: 0 }, projects: { countsByStatus: {}, countsByVertical: {}, wonDealsPendingProject: 0 } }),
    team: async () => ({ items: [] }),
    teamMember: async () => null,
    projects: async () => ({ items: [], continueCursor: null, isDone: true }),
    project: async (projectId: string) => ({ projectId }),
    projectReport: async () => ({ countsByStatus: {}, countsByVertical: {}, startedProjects: 0, completedProjects: 0, wonDealsPendingProject: 0 }),
    convertDealToProject: async (dealId: string) => ({ dealId, projectId: "mock-project-" + dealId, created: true }),
  },

  dealRequests: {
    create: (dealId: string, body: DealChangeRequestCreate) =>
      delay(createMockDealRequest(dealId, body)),
    listForDeal: (dealId: string) =>
      delay(dealChangeRequests.filter((item) => item.dealId === dealId)),
    listQueue: async (query = {}) => {
      const items = dealChangeRequests.filter((item) =>
        (!query.status || item.status === query.status) &&
        (!query.requestType || item.requestType === query.requestType),
      );
      return delay({ items, nextCursor: null, isDone: true });
    },
    decide: (requestId: string, body: DealChangeRequestDecision) =>
      delay(decideMockDealRequest(requestId, body)),
  },

  documents: {
    createUploadSession: async () => ({ documentId: "mock-document", uploadUrl: "https://example.invalid/upload", expiresAt: new Date(Date.now() + 300000).toISOString(), replayed: false }),
    uploadToSignedUrl: async () => undefined,
    finalize: async (documentId: string) => ({ documentId, finalized: true, checksumVerified: false, malwareScanStatus: "pending" as const, encryptionStatus: "pending" as const }),
  },
  admin: {
    overview: async () => ({}),
    users: async () => ({ items: [], continueCursor: null, isDone: true }),
    user: async (id: string) => ({ userId: id }),
    roles: async () => ({ roles: [] }),
    health: async () => ({ status: 'unknown' }),
    auditLogs: async () => ({ items: [], continueCursor: null, isDone: true }),
    auditLog: async (id: string) => ({ auditId: id }),
  },
};



