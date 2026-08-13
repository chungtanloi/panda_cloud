import type {
  AssessmentResult,
  AssessmentSubmission,
  AuthSession,
  AuthTokens,
  BookingDraft,
  BookingQuote,
  BookingRequestResult,
  BookingSubmission,
  WorkloadRecommendation,
  WorkloadType,
  ChoosePathRequest,
  DashboardSummary,
  DealCard,
  DealCardCreate,
  DealCardPatch,
  DealColumn,
  DealStage,
  GpuModel,
  ResourceTable,
  WorkspaceResourceKind,
  CapexProjection,
  DeliverySchedule,
  HyperscaleDraft,
  HyperscaleResult,
  HyperscaleSubmission,
  InvestmentDraft,
  InvestmentResult,
  InvestmentSubmission,
  ProjectStage,
  RegionFacts,
  SettlementQuote,
  StageAnalysis,
  VolumeProjection,
  LeadRequest,
  LeadResponse,
  LivePreview,
  LivePreviewRequest,
  LoginRequest,
  RequestReceipt,
  SignUpRequest,
  TokenRate,
  UploadedDocument,
  User,
} from "@/models";
import { normalizeUserRole } from "@/models";
import type { ApiClient } from "../contracts";
import { endpoints } from "../endpoints";
import { http } from "../http";

/**
 * Real backend adapter. Thin by design — it maps a typed method onto a path
 * and nothing more. All error handling, auth headers, retries and envelope
 * unwrapping live in `services/http.ts`.
 */
export const httpApi: ApiClient = {
  auth: {
    login: (payload: LoginRequest) =>
      http.post<AuthSession>(endpoints.auth.login, payload, { anonymous: true }).then(normalizeSession),

    signUp: (payload: SignUpRequest) =>
      http.post<AuthSession>(endpoints.auth.signUp, payload, { anonymous: true }).then(normalizeSession),

    refresh: (refreshToken: string) =>
      http.post<AuthTokens>(endpoints.auth.refresh, { refreshToken }, { anonymous: true }),

    me: () => http.get<User>(endpoints.auth.me).then(normalizeUser),

    choosePath: (payload: ChoosePathRequest) => http.put<User>(endpoints.auth.choosePath, payload).then(normalizeUser),

    logout: () => http.post<void>(endpoints.auth.logout),
  },

  assessment: {
    preview: (payload: LivePreviewRequest) =>
      http.post<LivePreview>(endpoints.assessment.preview, payload),

    submit: (payload: AssessmentSubmission) =>
      http.post<AssessmentResult>(endpoints.assessment.submit, payload),

    getResult: (id: string) => http.get<AssessmentResult>(endpoints.assessment.byId(id)),
  },

  booking: {
    listGpuModels: () => http.get<GpuModel[]>(endpoints.booking.gpuModels, { anonymous: true }),

    recommend: (workload: WorkloadType) =>
      http.get<WorkloadRecommendation>(endpoints.booking.recommend, {
        query: { workload },
        anonymous: true,
      }),

    quote: (payload: BookingDraft) =>
      http.post<BookingQuote>(endpoints.booking.quote, payload, { anonymous: true }),

    submit: (payload: BookingSubmission) =>
      http.post<BookingRequestResult>(endpoints.booking.submit, payload),

    getRequest: (id: string) => http.get<BookingRequestResult>(endpoints.booking.byId(id)),
  },

  investment: {
    getRate: () => http.get<TokenRate>(endpoints.investment.rate, { anonymous: true }),

    project: (amountUsd: number) =>
      http.get<VolumeProjection>(endpoints.investment.project, {
        query: { amountUsd },
        anonymous: true,
      }),

    settlement: (draft: InvestmentDraft) =>
      http.post<SettlementQuote>(endpoints.investment.settlement, draft, { anonymous: true }),

    uploadKycDocument: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return http.post<UploadedDocument>(endpoints.investment.kycDocuments, form);
    },

    submit: (payload: InvestmentSubmission) =>
      http.post<InvestmentResult>(endpoints.investment.submit, payload),

    getInvestment: (id: string) => http.get<InvestmentResult>(endpoints.investment.byId(id)),
  },

  hyperscale: {
    analyzeStage: (stage: ProjectStage) =>
      http.get<StageAnalysis>(endpoints.hyperscale.stageAnalysis, {
        query: { stage },
        anonymous: true,
      }),

    projectCapex: (draft: HyperscaleDraft) =>
      http.post<CapexProjection>(endpoints.hyperscale.capex, draft, { anonymous: true }),

    listRegions: () =>
      http.get<RegionFacts[]>(endpoints.hyperscale.regions, { anonymous: true }),

    buildSchedule: (draft: HyperscaleDraft) =>
      http.post<DeliverySchedule>(endpoints.hyperscale.schedule, draft, { anonymous: true }),

    uploadRfpDocument: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return http.post<UploadedDocument>(endpoints.hyperscale.documents, form);
    },

    submit: (payload: HyperscaleSubmission) =>
      http.post<HyperscaleResult>(endpoints.hyperscale.submit, payload),

    getRequest: (id: string) => http.get<HyperscaleResult>(endpoints.hyperscale.byId(id)),
  },

  dashboard: {
    getSummary: () => http.get<DashboardSummary>(endpoints.dashboard.summary),

    getReceipt: (reference: string) =>
      http.get<RequestReceipt>(endpoints.dashboard.receipt(reference)),
  },

  leads: {
    create: (payload: LeadRequest) =>
      http.post<LeadResponse>(endpoints.leads.create, payload, { anonymous: true }),
  },

  workspace: {
    getResource: (kind: WorkspaceResourceKind) =>
      http.get<ResourceTable>(endpoints.workspace.resource(kind)),
  },

  // Staff only — every call carries the bearer token, and the backend must
  // reject non-sales roles with 403 rather than relying on the UI guard.
  sales: {
    listColumns: () => http.get<DealColumn[]>(endpoints.sales.columns),

    listCards: () => http.get<DealCard[]>(endpoints.sales.cards),

    getCard: (id: string) => http.get<DealCard>(endpoints.sales.cardById(id)),

    createCard: (payload: DealCardCreate) => http.post<DealCard>(endpoints.sales.cards, payload),

    updateCard: (id: string, patch: DealCardPatch) =>
      http.patch<DealCard>(endpoints.sales.cardById(id), patch),

    moveCard: (id: string, toColumnId: DealStage, order?: number) =>
      http.post<DealCard>(endpoints.sales.moveCard(id), { toColumnId, order }),

    deleteCard: (id: string) => http.delete<void>(endpoints.sales.cardById(id)),
  },
};

function normalizeUser(user: User): User { return { ...user, role: normalizeUserRole(user.role) }; }
function normalizeSession(session: AuthSession): AuthSession { return { ...session, user: normalizeUser(session.user) }; }
