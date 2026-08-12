import type {
  AssessmentResult,
  AssessmentSubmission,
  AuthSession,
  AuthTokens,
  ChoosePathRequest,
  DashboardSummary,
  GpuModel,
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
  LoginRequest,
  RequestReceipt,
  SignUpRequest,
  TokenRate,
  UploadedDocument,
  User,
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

export interface AuthService {
  login(payload: LoginRequest): Promise<AuthSession>;
  signUp(payload: SignUpRequest): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  me(): Promise<User>;
  choosePath(payload: ChoosePathRequest): Promise<User>;
  logout(): Promise<void>;
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

/** The complete surface exposed by `services/api.ts`. */
export interface ApiClient {
  auth: AuthService;
  assessment: AssessmentService;
  booking: BookingService;
  investment: InvestmentService;
  hyperscale: HyperscaleService;
  dashboard: DashboardService;
  leads: LeadService;
}
