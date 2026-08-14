import type {
  AssessmentResult,
  AssessmentSubmission,
  AuthProfile,
  DashboardSummary,
  DealCard,
  DealCardCreate,
  DealCardPatch,
  DealColumn,
  DealStage,
  GpuModel,
  ResourceTable,
  WorkspaceResourceKind,
  BookingDraft,
  BookingRequestResult,
  BookingQuote,
  BookingSubmission,
  WorkloadRecommendation,
  WorkloadType,
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
  RequestReceipt,
  TokenRate,
  UploadedDocument,
} from "@/models";

/**
 * The API port.
 *
 * Both the HTTP adapter (`services/http-impl`) and the mock adapter
 * (`services/mock`) implement these interfaces exactly. Controllers and views
 * depend only on this file — which is what makes the backend swap a
 * single environment-variable change.
 *
 * Every method rejects with an `ApiError` (see services/http.ts) on failure.
 */

/**
 * Identity.
 *
 * One operation, because the contract defines one. Sign-in, sign-up, session
 * refresh and sign-out are Clerk SDK calls in the view layer, not API calls —
 * they never reach this port.
 */
export interface AuthService {
  /** `GET /api/v1/auth/me` — resolves the profile and authorization context. */
  me(): Promise<AuthProfile>;
}

export interface AssessmentService {
  /** Recompute the "Live Output" panel as step-3 inputs change. */
  preview(payload: LivePreviewRequest): Promise<LivePreview>;
  submit(payload: AssessmentSubmission): Promise<AssessmentResult>;
  getResult(id: string): Promise<AssessmentResult>;
}

export interface BookingService {
  /** Catalogue for the GPU Hardware step. */
  listGpuModels(): Promise<GpuModel[]>;
  /** Architecture recommendation shown on the Workload step. */
  recommend(workload: WorkloadType): Promise<WorkloadRecommendation>;
  /**
   * Live run-rate. Accepts a partial draft — the wizard calls this on every
   * change, so it must be cheap and free of side effects.
   */
  quote(payload: BookingDraft): Promise<BookingQuote>;
  submit(payload: BookingSubmission): Promise<BookingRequestResult>;
  getRequest(id: string): Promise<BookingRequestResult>;
}

export interface InvestmentService {
  /** Current token price, polled by the Volume step. */
  getRate(): Promise<TokenRate>;
  /** Live projection panel on the Volume step. */
  project(amountUsd: number): Promise<VolumeProjection>;
  /** Settlement Details panel on the Payment step. */
  settlement(draft: InvestmentDraft): Promise<SettlementQuote>;
  uploadKycDocument(file: File): Promise<UploadedDocument>;
  submit(payload: InvestmentSubmission): Promise<InvestmentResult>;
  getInvestment(id: string): Promise<InvestmentResult>;
}

export interface HyperscaleService {
  /** Telemetry panel on the Project Stage step. */
  analyzeStage(stage: ProjectStage): Promise<StageAnalysis>;
  /** Live CapEx projection on the Capacity & Cooling step. */
  projectCapex(draft: HyperscaleDraft): Promise<CapexProjection>;
  /** Regions offered on the Geography step, with their power and cooling. */
  listRegions(): Promise<RegionFacts[]>;
  /** Auto-generated delivery schedule for the chosen go-live date. */
  buildSchedule(draft: HyperscaleDraft): Promise<DeliverySchedule>;
  uploadRfpDocument(file: File): Promise<UploadedDocument>;
  submit(payload: HyperscaleSubmission): Promise<HyperscaleResult>;
  getRequest(id: string): Promise<HyperscaleResult>;
}

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>;
  getReceipt(reference: string): Promise<RequestReceipt>;
}

export interface LeadService {
  /** Marketing contact forms. Public — no auth required. */
  create(payload: LeadRequest): Promise<LeadResponse>;
}

/**
 * Workspace list screens.
 *
 * Access is decided by the backend from the caller's role: a `sales` token
 * asking for `users` must get `403`, not an empty table. The frontend's route
 * guards hide the navigation; they are not the control.
 */
export interface WorkspaceService {
  getResource(kind: WorkspaceResourceKind): Promise<ResourceTable>;
}

/**
 * Sales pipeline. **Staff only** — every method requires an authenticated user
 * whose role is `sales` or `admin`.
 *
 * Customer submissions create cards transactionally on the backend. Manual
 * creation exists only for outbound/offline CRM leads.
 */
export interface SalesService {
  listColumns(): Promise<DealColumn[]>;
  listCards(): Promise<DealCard[]>;
  /** Heavier record for the detail panel — full answers, notes, history. */
  getCard(id: string): Promise<DealCard>;
  /** Manual CRM entry; automatic form-driven creation remains the primary path. */
  createCard(payload: DealCardCreate): Promise<DealCard>;
  updateCard(id: string, patch: DealCardPatch): Promise<DealCard>;
  /** Separate from update so the backend can reorder siblings atomically. */
  moveCard(id: string, toColumnId: DealStage, order?: number): Promise<DealCard>;
  /** Manager/Admin only. Backend must preserve an audit event. */
  deleteCard(id: string): Promise<void>;
}

/** The complete surface exposed by `services/api.ts`. */
export interface ApiClient {
  auth: AuthService;
  assessment: AssessmentService;
  booking: BookingService;
  investment: InvestmentService;
  hyperscale: HyperscaleService;
  dashboard: DashboardService;
  leads: LeadService;
  sales: SalesService;
  workspace: WorkspaceService;
}
