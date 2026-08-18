import type {
  AssessmentResult,
  AssessmentSubmission,
  AuthProfile,
  DashboardSummary,
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
  DocumentUploadSessionRequest,
  DocumentUploadSessionResponse,
  DocumentFinalizeResponse,
  SalesCardCreateRequest,
  SalesCardCreateResponse,
  SalesCardDetailDto,
  SalesCardListQuery,
  SalesCardMoveRequest,
  SalesCardMoveResponse,
  SalesCardPage,
  SalesCardUpdateRequest,
  SalesCardUpdateResponse,
  SalesColumnListResponse,
  DdAssessmentCreate,
  DdAssessmentCreateResponse,
  DdAssessmentDetail,
  DdAssessmentListResponse,
  DdProgress,
  DdResponsePatch,
  DdResponseUpdateResponse,
  NcndaAgreementDetail,
  NcndaAgreementListResponse,
  NcndaAgreementUpsert,
  NcndaAgreementUpsertResponse,
  NcndaDocumentAttach,
  KycCase,
  KycCaseCreate,
  KycCaseCreateResponse,
  KycCaseListResponse,
  KycCaseUpdate,
  KycCaseUpdateResponse,
  KycDocument,
  KycDocumentAttach,
  KycDocumentListResponse,
  SubmissionListResponse,
  SubmissionCreateRequest,
  SubmissionCreateResponse,
  SubmissionConvertRequest,
  SubmissionConvertResponse,
  Submission,
  ManagerOverview, ManagerTeamResponse, ManagerTeamMember, ManagerProjectReport, ManagerProjectListResponse, AdminOverview, AdminUserPage, AdminRoles, AdminHealth, AdminAuditPage,
  SalesOverview, SalesConversionReport, SalesActivityReport, SalesForecastReport, SalesLeadPage, SalesLeadDetail, SalesLeadQualifyRequest, SalesLeadQualifyResponse, ActivityPage, ActivityCreateRequest, TaskPage, TaskUpdateRequest, ActivitySummary, CustomerPage, CustomerDetail,
  DealChangeRequest, DealChangeRequestCreate, DealChangeRequestDecision, DealChangeRequestPage,
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
export interface SubmissionService {
  create(body: SubmissionCreateRequest): Promise<SubmissionCreateResponse>;
  list(query?: { status?: string; cursor?: string }): Promise<SubmissionListResponse>;
  get(submissionId: string): Promise<Submission>;
  convert(submissionId: string, body: SubmissionConvertRequest): Promise<SubmissionConvertResponse>;
}

export interface WorkspaceService {
  getResource(kind: WorkspaceResourceKind): Promise<ResourceTable>;
}

export interface AdminService {
  overview(): Promise<AdminOverview>;
  users(query?: Record<string, string | number | undefined>): Promise<AdminUserPage>;
  user(userId: string): Promise<Record<string, unknown>>;
  roles(): Promise<AdminRoles>;
  health(): Promise<AdminHealth>;
  auditLogs(query?: Record<string, string | number | undefined>): Promise<AdminAuditPage>;
  auditLog(auditId: string): Promise<Record<string, unknown>>;
}

export interface ManagerService {
  overview(): Promise<ManagerOverview>;
  team(query?: { from?: string; to?: string }): Promise<ManagerTeamResponse>;
  teamMember(userId: string, query?: { from?: string; to?: string }): Promise<ManagerTeamMember | null>;
  projects(query?: Record<string, string | number | undefined>): Promise<ManagerProjectListResponse>;
  project(projectId: string): Promise<Record<string, unknown>>;
  projectReport(query?: { from?: string; to?: string }): Promise<ManagerProjectReport>;
  convertDealToProject(dealId: string, body: import('@/models/manager').ManagerProjectConversionRequest): Promise<import('@/models/manager').ManagerProjectConversionResponse>;
}

/**
 * Sales pipeline. **Staff only** — every method requires an authenticated user
 * whose role is `sales` or `admin`.
 *
 * Card creation is not exposed here: the backend creates a card
 * transactionally with the submission that produced it. There is no create or
 * delete operation in the contract (`api-contracts/paths/sales-*.yaml`).
 */
export interface SalesWorkspaceService { overview(query?: {from?:string;to?:string}): Promise<SalesOverview>; conversionReport(query?: {from?:string;to?:string;groupBy?:string}): Promise<SalesConversionReport>; activityReport(query?: {from?:string;to?:string;dealId?:string}): Promise<SalesActivityReport>; forecastReport(query?: {from?:string;to?:string}): Promise<SalesForecastReport>; listLeads(query?: Record<string,string|number|boolean|undefined>): Promise<SalesLeadPage>; getLead(id:string): Promise<SalesLeadDetail>; qualifyLead(id:string, body:SalesLeadQualifyRequest): Promise<SalesLeadQualifyResponse>; listTasks(query?: Record<string,string|number|boolean|undefined>): Promise<TaskPage>; getTask(id:string): Promise<ActivitySummary>; updateTask(id:string, body:TaskUpdateRequest): Promise<{activityId:string;updatedAt:string}>; listActivities(dealId:string, query?:Record<string,unknown>): Promise<ActivityPage>; createActivity(body:ActivityCreateRequest): Promise<{activityId:string;dealRevision:number;updatedAt:string}>; listCustomers(query?:Record<string,unknown>): Promise<CustomerPage>; getCustomer(id:string): Promise<CustomerDetail>; }

export interface SalesService {
  listColumns(): Promise<SalesColumnListResponse>;
  /** Cursor-paginated cards for ONE column. `columnId` is required. */
  listCards(query: SalesCardListQuery): Promise<SalesCardPage>;
  /** Heavier record for the detail panel — description, createdAt, createdBy, … */
  getCard(id: string): Promise<SalesCardDetailDto>;
  /**
   * Manual outbound/offline entry. Sales, manager and admin only — the backend
   * enforces the role; the UI guard is convenience.
   */
  createCard(body: SalesCardCreateRequest): Promise<SalesCardCreateResponse>;
  /** Optimistic-concurrency partial update. Rejects 409 on a stale revision. */
  updateCard(id: string, body: SalesCardUpdateRequest): Promise<SalesCardUpdateResponse>;
  /** Stage transition, guarded by expectedRevision. */
  moveCard(id: string, body: SalesCardMoveRequest): Promise<SalesCardMoveResponse>;
}

/** Sales proposes sensitive Deal transitions; Manager/Admin decides them. */
export interface DealChangeRequestService {
  create(dealId: string, body: DealChangeRequestCreate): Promise<DealChangeRequest>;
  listForDeal(dealId: string): Promise<DealChangeRequest[]>;
  listQueue(query?: {
    status?: string;
    requestType?: string;
    cursor?: string;
    limit?: number;
  }): Promise<DealChangeRequestPage>;
  decide(requestId: string, body: DealChangeRequestDecision): Promise<DealChangeRequest>;
}

/**
 * Technical Due Diligence — `DD API.md`.
 *
 * Exactly the five documented operations, no more. `DD API.md` states the
 * complete/cancel transitions are OPEN ("no authority exists") and instructs:
 * "Do NOT invent POST /complete or POST /cancel." There is likewise no
 * eligible-deals list, no workspace aggregate and no evidence upload — see the
 * "Not on the wire" section of `models/dueDiligence.ts`.
 *
 * Authorization is the backend's. `DD API.md`: read is open to every staff
 * role and denied to `customer`; create and response updates are
 * technical/manager/admin only. The UI guard is convenience.
 *
 * The backend gateway is implemented; the mock adapter remains available for
 * local UI development and contract tests.
 */
export interface DueDiligenceService {
  /** Assessments on one deal. */
  listAssessments(dealId: string): Promise<DdAssessmentListResponse>;
  /** Initialize an assessment from the published template (UC-010). */
  createAssessment(
    dealId: string,
    body: DdAssessmentCreate,
  ): Promise<DdAssessmentCreateResponse>;
  /** Full assessment: all 68 requirements plus every response recorded so far. */
  getAssessment(assessmentId: string): Promise<DdAssessmentDetail>;
  /** Just the metrics — cheap enough to poll after a write. */
  getProgress(assessmentId: string): Promise<DdProgress>;
  /**
   * Upsert one requirement's response (UC-011). Keyed by template item.
   * Rejects 409 when `expectedRevision` is stale, or when the assessment is
   * already completed or cancelled.
   */
  updateResponse(
    assessmentId: string,
    templateItemId: string,
    body: DdResponsePatch,
  ): Promise<DdResponseUpdateResponse>;
}

/**
 * NCNDA — the Legal workspace (UC-015).
 *
 * Authorization is the backend's: `convex/ncnda.ts` requires `legal`,
 * `manager` or `admin`. Sales has read access per UC-015 ("Sales read"), but
 * no read function exists to grant it through yet.
 *
 * Create and update are ONE operation, because the backend models it that way
 * (`upsertAgreement`). `expectedRevision` is absent when creating and
 * mandatory when updating; the backend rejects an update without it.
 *
 * There is no delete: an agreement that is off is `cancelled`, `rejected` or
 * `expired`, preserving the audit trail — the same convention the sales board
 * uses for lost deals.
 *
 * The HTTP adapter follows the NCNDA gateway contract; the mock adapter remains
 * available for local UI development until the backend routes are deployed.
 */
export interface LegalService {
  listAgreements(dealId: string): Promise<NcndaAgreementListResponse>;
  /** Agreement plus its immutable version history, newest first. */
  getAgreement(agreementId: string): Promise<NcndaAgreementDetail>;
  /**
   * Create or update. Rejects 409 when a second `active` agreement is
   * attempted for the same (deal, counterparty), or on a stale revision.
   */
  upsertAgreement(body: NcndaAgreementUpsert): Promise<NcndaAgreementUpsertResponse>;
  listDocuments(agreementId: string): Promise<NcndaAgreementDetail["versions"]>;
  attachDocument(agreementId: string, body: NcndaDocumentAttach): Promise<NcndaAgreementDetail["versions"][number]>;
  detachDocument(agreementId: string, documentId: string): Promise<void>;
}

/**
 * KYC — the Compliance workspace (UC-016).
 *
 * Backend roles: `compliance`, `manager`, `admin`. Create and update are
 * separate operations here because the backend models them separately, with
 * different validation on each.
 *
 * Document links are part of the implemented KYC gateway. The mock adapter
 * remains available for local UI development and contract tests.
 */
export interface ComplianceService {
  listCases(dealId: string): Promise<KycCaseListResponse>;
  getCase(caseId: string): Promise<KycCase>;
  /** Exactly one subject. A duplicate provider case is a 409. */
  createCase(dealId: string, body: Omit<KycCaseCreate, "dealId">): Promise<KycCaseCreateResponse>;
  listDocuments(caseId: string): Promise<KycDocumentListResponse>;
  attachDocument(caseId: string, body: KycDocumentAttach): Promise<{ linkId: string; documentId: string }>;
  detachDocument(caseId: string, documentId: string): Promise<{ documentId: string; detached: boolean }>;
  /** Full status write guarded by `expectedRevision`. */
  updateCase(caseId: string, body: KycCaseUpdate): Promise<KycCaseUpdateResponse>;
}

export interface DocumentsService {
  createUploadSession(body: DocumentUploadSessionRequest): Promise<DocumentUploadSessionResponse>;
  uploadToSignedUrl(url: string, file: File, requiredHeaders?: Record<string, string>): Promise<void>;
  finalize(documentId: string): Promise<DocumentFinalizeResponse>;
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
  submissions: SubmissionService;
  sales: SalesService;
  dealRequests: DealChangeRequestService;
  salesWorkspace: SalesWorkspaceService;
  dueDiligence: DueDiligenceService;
  legal: LegalService;
  compliance: ComplianceService;
  documents: DocumentsService;
  workspace: WorkspaceService;
  manager: ManagerService;
  admin: AdminService;
}

