import type {
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
  KycDocumentAttach,
  KycDocument,
  KycDocumentListResponse,
  Submission,
  SubmissionListResponse,
  SubmissionCreateRequest,
  SubmissionCreateResponse,
  SubmissionConvertRequest,
  SubmissionConvertResponse,
  ManagerOverview, ManagerTeamResponse, ManagerTeamMember, ManagerProjectReport, ManagerProjectListResponse, ManagerProjectConversionResponse, AdminOverview, AdminUserPage, AdminRoles, AdminHealth, AdminAuditPage,
  DdAssessmentCreate,
  DdAssessmentCreateResponse,
  DdAssessmentDetail,
  DdAssessmentSummary,
  DdAssessmentListResponse,
  DdProgress,
  DdResponsePatch,
  DdResponseUpdateResponse,
  DdMetrics,
  DdTemplateItem,
  DdResponse,
  AssessmentResult,
  AssessmentSubmission,
  AuthProfile,
  BookingDraft,
  BookingQuote,
  BookingRequestResult,
  BookingSubmission,
  WorkloadRecommendation,
  WorkloadType,
  DashboardSummary,
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
  RequestReceipt,
  TokenRate,
  UploadedDocument,
  DocumentUploadSessionRequest,
  DocumentUploadSessionResponse,
  DocumentFinalizeResponse,
  DealChangeRequest,
  DealChangeRequestCreate,
  DealChangeRequestDecision,
  DealChangeRequestPage,
  SalesCardCreateRequest,
  SalesCardCreateResponse,
  SalesCardDetailDto,
  SalesCardListQuery,
  SalesCardMoveRequest,
  SalesCardMoveResponse,
  SalesTransitionOptionsResponse,
  SalesCardPage,
  SalesCardUpdateRequest,
  SalesCardUpdateResponse,
  SalesColumnListResponse, SalesOverview, SalesConversionReport, SalesActivityReport, SalesForecastReport, SalesLeadPage, SalesLeadDetail, SalesLeadQualifyRequest, SalesLeadQualifyResponse, ActivityPage, ActivityCreateRequest, TaskPage, TaskUpdateRequest, ActivitySummary, CustomerPage, CustomerDetail,
} from "@/models";
import { normalizeMembershipRole } from "@/models";
import type { ApiClient } from "../contracts";
import { endpoints } from "../endpoints";
import { http } from "../http";

/**
 * Real backend adapter. Thin by design — it maps a typed method onto a path
 * and nothing more. All error handling, auth headers, retries and envelope
 * unwrapping live in `services/http.ts`.
 */
export type BackendNcndaAgreement = NcndaAgreementDetail & { documentVersions?: NcndaAgreementDetail["versions"] };

function isoToMillis(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? millis : undefined;
}

function mapNcndaAgreement(raw: BackendNcndaAgreement): NcndaAgreementDetail {
  return {
    ...raw,
    dealTitle: raw.dealTitle ?? null,
    counterpartyName: raw.counterpartyName ?? null,
    ownerName: raw.ownerName ?? null,
    versions: raw.versions ?? raw.documentVersions ?? [],
  };
}

type BackendKycCase = { caseId: string; dealId: string; subjectOrganizationId: string | null; subjectContactId: string | null; provider: string | null; providerCaseId: string | null; status: KycCase["status"]; riskLevel: KycCase["riskLevel"]; assignedTo: string | null; rejectionReason: string | null; submittedAt: string | number | null; verifiedAt: string | number | null; expiresAt: string | number | null; revision: number; updatedAt: string | number; };
function dateIso(value: string | number | null | undefined): string | null { if (value === null || value === undefined) return null; const date = typeof value === "number" ? new Date(value) : new Date(value); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
function mapKycCase(raw: BackendKycCase): KycCase { return { caseId: raw.caseId, dealId: raw.dealId, dealTitle: null, subject: raw.subjectOrganizationId ? { kind: "organization", organizationId: raw.subjectOrganizationId, displayName: null } : { kind: "contact", contactId: raw.subjectContactId ?? "", displayName: null }, provider: raw.provider, providerCaseId: raw.providerCaseId, status: raw.status, riskLevel: raw.riskLevel, assignedToId: raw.assignedTo, assignedToName: null, rejectionReason: raw.rejectionReason, submittedAt: dateIso(raw.submittedAt), verifiedAt: dateIso(raw.verifiedAt), expiresAt: dateIso(raw.expiresAt), revision: raw.revision, updatedAt: dateIso(raw.updatedAt) ?? new Date(0).toISOString() }; }
function dateMillis(value?: string | null): number | undefined { if (!value) return undefined; const n=Date.parse(value); return Number.isFinite(n) ? n : undefined; }

export const httpApi: ApiClient = {
  auth: {
    me: () => http.get<AuthProfile>(endpoints.auth.me).then(normalizeAuthProfile),
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
      http.post<LeadResponse>(endpoints.submissions.collection, {
        source: "website",
        persona: "other",
        summary: payload.useCase ?? `${payload.contactName}: ${payload.interests.join(", ")}`,
      }, { anonymous: true }),
  },

  submissions: {
    create: (body: SubmissionCreateRequest) =>
      http.post<SubmissionCreateResponse>(endpoints.submissions.collection, body, { anonymous: true }),
    list: (query = {}) =>
      http.get<SubmissionListResponse>(endpoints.submissions.collection, { query }),
    get: (submissionId: string) =>
      http.get<Submission>(endpoints.submissions.byId(submissionId)),
    convert: (submissionId: string, body: SubmissionConvertRequest) =>
      http.post<SubmissionConvertResponse>(endpoints.submissions.convert(submissionId), body),
  },

  workspace: {
    getResource: (kind: WorkspaceResourceKind) =>
      http.get<ResourceTable>(endpoints.workspace.resource(kind)),
  },

  // Staff only — every call carries the bearer token, and the backend must
  // reject non-sales roles with 403 rather than relying on the UI guard.
  sales: {
    listColumns: () => http.get<SalesColumnListResponse>(endpoints.sales.columns),

    listCards: (query: SalesCardListQuery) =>
      http.get<SalesCardPage>(endpoints.sales.cards, { query: { ...query } }),

    getCard: (id: string) => http.get<SalesCardDetailDto>(endpoints.sales.cardById(id)),

    createCard: (body: SalesCardCreateRequest) =>
      http.post<SalesCardCreateResponse>(endpoints.sales.cards, body),

    updateCard: (id: string, body: SalesCardUpdateRequest) =>
      http.patch<SalesCardUpdateResponse>(endpoints.sales.cardById(id), body),

    moveCard: (id: string, body: SalesCardMoveRequest) =>
      http.post<SalesCardMoveResponse>(endpoints.sales.moveCard(id), body),
    getTransitionOptions: (id: string) =>
      http.get<SalesTransitionOptionsResponse>(endpoints.sales.transitionOptions(id)),
  },

  dealRequests: {
    create: (dealId: string, body: DealChangeRequestCreate) =>
      http.post<DealChangeRequest>(endpoints.dealRequests.forDeal(dealId), body),
    listForDeal: async (dealId: string) =>
      (await http.get<{ items: DealChangeRequest[] }>(endpoints.dealRequests.forDeal(dealId))).items,
    listQueue: (query: Record<string, string | number | undefined> = {}) =>
      http.get<DealChangeRequestPage>(endpoints.dealRequests.queue, { query }),
    decide: (requestId: string, body: DealChangeRequestDecision) =>
      http.post<DealChangeRequest>(endpoints.dealRequests.decision(requestId), body),
  },

  salesWorkspace: {
    overview: (query: Record<string,string|number|boolean|undefined> = {}) => http.get<SalesOverview>(endpoints.salesWorkspace.overview, { query }),
    conversionReport: (query: Record<string,string|number|boolean|undefined> = {}) => http.get<SalesConversionReport>(endpoints.salesWorkspace.reports.conversion, { query }),
    activityReport: (query: Record<string,string|number|boolean|undefined> = {}) => http.get<SalesActivityReport>(endpoints.salesWorkspace.reports.activity, { query }),
    forecastReport: (query: Record<string,string|number|boolean|undefined> = {}) => http.get<SalesForecastReport>(endpoints.salesWorkspace.reports.forecast, { query }),
    listLeads: (query: Record<string,string|number|boolean|undefined> = {}) => http.get<SalesLeadPage>(endpoints.salesWorkspace.leads, { query }),
    getLead: (id: string) => http.get<SalesLeadDetail>(endpoints.salesWorkspace.leadById(id)),
    qualifyLead: (id: string, body: SalesLeadQualifyRequest) => http.post<SalesLeadQualifyResponse>(endpoints.salesWorkspace.qualifyLead(id), body),
    listTasks: (query: Record<string,string|number|boolean|undefined> = {}) => http.get<TaskPage>(endpoints.salesWorkspace.tasks, { query }),
    getTask: (id: string) => http.get<ActivitySummary>(endpoints.salesWorkspace.taskById(id)),
    updateTask: (id: string, body: TaskUpdateRequest) => http.patch<{activityId:string;updatedAt:string}>(endpoints.salesWorkspace.taskById(id), body),
    listActivities: (dealId: string, query: Record<string,string|number|boolean|undefined> = {}) => http.get<ActivityPage>(endpoints.salesWorkspace.activities(dealId), { query }),
    createActivity: (body: ActivityCreateRequest) => http.post<{activityId:string;dealRevision:number;updatedAt:string}>(endpoints.salesWorkspace.activities(body.dealId), body),
    listCustomers: (query: Record<string,string|number|boolean|undefined> = {}) => http.get<CustomerPage>(endpoints.salesWorkspace.customers, { query }),
    getCustomer: (id: string) => http.get<CustomerDetail>(endpoints.salesWorkspace.customerById(id)),
  },

  /** Technical Due Diligence gateway operations. */
  dueDiligence: {
    listAssessments: async (dealId: string) => {
      const response = await http.get<{ assessments: BackendDdAssessmentSummary[] }>(
        endpoints.dueDiligence.dealAssessments(dealId),
      );
      return { items: response.assessments.map(mapDdAssessment) };
    },

    createAssessment: (dealId: string, body: DdAssessmentCreate) =>
      http.post<DdAssessmentCreateResponse>(
        endpoints.dueDiligence.dealAssessments(dealId),
        {
          ...(body.templateVersionId ? { templateVersionId: body.templateVersionId } : {}),
          ...(body.assignedToUserId ? { assignedTo: body.assignedToUserId } : {}),
        },
      ),

    getAssessment: async (assessmentId: string) => {
      const response = await http.get<BackendDdAssessmentDetail>(
        endpoints.dueDiligence.assessmentById(assessmentId),
      );
      return mapDdDetail(response);
    },

    getProgress: async (assessmentId: string) => {
      const response = await http.get<BackendDdProgress>(
        endpoints.dueDiligence.assessmentProgress(assessmentId),
      );
      const live = mapDdMetrics(response.live);
      return { assessmentId, status: "in_progress", revision: 0, ...live, materialized: response.materialized ? mapDdMetrics(response.materialized) : null, live, consistent: response.consistent };
    },

    updateResponse: async (assessmentId: string, templateItemId: string, body: DdResponsePatch) => {
      const response = await http.patch<{ responseId: string; revision: number; progress: BackendDdMetrics }>(
        endpoints.dueDiligence.response(assessmentId, templateItemId),
        {
          ...(body.status ? { status: body.status } : {}),
          ...(body.responseValue !== undefined ? { responseValue: body.responseValue } : {}),
          ...(body.comments !== undefined ? { comments: body.comments } : {}),
          expectedRevision: body.expectedRevision,
        },
      );
      return { assessmentId, templateItemId, responseRevision: response.revision, assessmentRevision: response.revision, progress: mapDdMetrics(response.progress) };
    },
  },

  /** NCNDA gateway operations. */
  legal: {
    listAgreements: async (dealId: string) => {
      const response = await http.get<{ agreements: BackendNcndaAgreement[] }>(
        endpoints.ncnda.agreementsForDeal(dealId),
      );
      return { items: response.agreements.map(mapNcndaAgreement) };
    },

    getAgreement: async (agreementId: string) => {
      const response = await http.get<{ agreement: BackendNcndaAgreement }>(
        endpoints.ncnda.agreementById(agreementId),
      );
      return mapNcndaAgreement(response.agreement);
    },

    upsertAgreement: (body: NcndaAgreementUpsert) =>
      http.patch<NcndaAgreementUpsertResponse>(
        endpoints.ncnda.agreementsForDeal(body.dealId),
        {
          ...body,
          expectedRevision: body.expectedRevision ?? 1,
          ...(body.expiresAt ? { expiresAt: isoToMillis(body.expiresAt) } : {}),
          ...(body.sentAt ? { sentAt: isoToMillis(body.sentAt) } : {}),
          ...(body.signedAt ? { signedAt: isoToMillis(body.signedAt) } : {}),
          ...(body.countersignedAt ? { countersignedAt: isoToMillis(body.countersignedAt) } : {}),
        },
      ),

    listDocuments: async (agreementId: string) => {
      const response = await http.get<{ versions: NcndaAgreementDetail["versions"] }>(
        endpoints.ncnda.agreementDocuments(agreementId),
      );
      return response.versions;
    },

    attachDocument: (agreementId: string, body: NcndaDocumentAttach) =>
      http.post<NcndaAgreementDetail["versions"][number]>(
        endpoints.ncnda.agreementDocuments(agreementId),
        body,
      ),

    detachDocument: async (agreementId: string, documentId: string) => {
      await http.delete<{ documentId: string; detached: boolean }>(
        endpoints.ncnda.agreementDocument(agreementId, documentId));
    },
  },

  /** KYC gateway operations. */
  compliance: {
    listCases: async (dealId: string) => {
      const response = await http.get<{ cases: BackendKycCase[] }>(endpoints.kyc.casesForDeal(dealId));
      return { items: response.cases.map(mapKycCase) };
    },
    getCase: async (caseId: string) => {
      const response = await http.get<{ case: BackendKycCase; documents?: KycDocument[] }>(endpoints.kyc.caseById(caseId));
      return { ...mapKycCase(response.case), ...(response.documents ? { documents: response.documents } : {}) };
    },
    createCase: (dealId: string, body: Omit<KycCaseCreate, "dealId">) =>
      http.post<KycCaseCreateResponse>(endpoints.kyc.casesForDeal(dealId), body),
    updateCase: (caseId: string, body: KycCaseUpdate) =>
      http.patch<KycCaseUpdateResponse>(endpoints.kyc.caseById(caseId), {
        ...body,
        ...(body.submittedAt ? { submittedAt: dateMillis(body.submittedAt) } : {}),
        ...(body.verifiedAt ? { verifiedAt: dateMillis(body.verifiedAt) } : {}),
        ...(body.expiresAt ? { expiresAt: dateMillis(body.expiresAt) } : {}),
      }),
    listDocuments: (caseId: string) =>
      http.get<KycDocumentListResponse>(endpoints.kyc.caseDocuments(caseId)),
    attachDocument: (caseId: string, body: KycDocumentAttach) =>
      http.post<{ linkId: string; documentId: string }>(endpoints.kyc.caseDocuments(caseId), body),
    detachDocument: (caseId: string, documentId: string) =>
      http.delete<{ documentId: string; detached: boolean }>(endpoints.kyc.caseDocument(caseId, documentId)),
  },

  documents: {
    createUploadSession: (body: DocumentUploadSessionRequest) =>
      http.post<DocumentUploadSessionResponse>(endpoints.documents.uploadSessions, body),
    uploadToSignedUrl: async (url: string, file: File, requiredHeaders: Record<string, string> = {}) => {
      const response = await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type || "application/octet-stream", ...requiredHeaders } });
      if (!response.ok) throw new Error(`Storage upload failed with status ${response.status}.`);
    },
    finalize: (documentId: string) =>
      http.post<DocumentFinalizeResponse>(endpoints.documents.finalize(documentId), {}),
  },
  admin: {
    overview: () => http.get<AdminOverview>(endpoints.admin.overview),
    users: (query = {}) => http.get<AdminUserPage>(endpoints.admin.users, { query }),
    user: (id: string) => http.get<Record<string, unknown>>(endpoints.admin.userById(id)),
    roles: () => http.get<AdminRoles>(endpoints.admin.roles),
    health: () => http.get<AdminHealth>(endpoints.admin.health),
    auditLogs: (query = {}) => http.get<AdminAuditPage>(endpoints.admin.auditLogs, { query }),
    auditLog: (id: string) => http.get<Record<string, unknown>>(endpoints.admin.auditById(id)),
  },

  manager: {
    overview: () => http.get<ManagerOverview>(endpoints.manager.overview),
    team: (query = {}) => http.get<ManagerTeamResponse>(endpoints.manager.team, { query }),
    teamMember: (userId: string, query = {}) => http.get<ManagerTeamMember | null>(endpoints.manager.teamMember(userId), { query }),
    projects: (query = {}) => http.get<ManagerProjectListResponse>(endpoints.manager.projects, { query }),
    project: (projectId: string) => http.get<Record<string, unknown>>(endpoints.manager.projectById(projectId)),
    projectReport: (query = {}) => http.get<ManagerProjectReport>(endpoints.manager.projectReport, { query }),
    convertDealToProject: (dealId, body) => http.post<ManagerProjectConversionResponse>(endpoints.manager.convertDealToProject(dealId), body),
  },
};

type BackendDdMetrics = {
  totalItems: number;
  reviewedItems: number;
  applicableReviewedItems: number;
  compliantItems: number;
  partiallyCompliantItems: number;
  criticalFailures: number;
  completionRate: number | null;
  complianceRate: number | null;
};
type BackendDdAssessmentSummary = {
  assessmentId: string;
  dealId: string;
  templateVersionId: string;
  status: DdAssessmentSummary["status"];
  assignedTo: string | null;
  createdBy: string;
  startedAt: string | null;
  completedAt: string | null;
  summarySnapshot: BackendDdMetrics | null;
  revision: number;
  updatedAt: string;
};
type BackendDdAssessmentDetail = {
  assessment: BackendDdAssessmentSummary;
  items: Array<Record<string, unknown>>;
  responses: Array<Record<string, unknown>>;
};
type BackendDdProgress = { materialized: BackendDdMetrics | null; live: BackendDdMetrics; consistent: boolean };
function mapDdMetrics(raw: BackendDdMetrics | null | undefined): DdMetrics {
  return { totalItems: raw?.totalItems ?? 0, reviewedItems: raw?.reviewedItems ?? 0, completionRate: raw?.completionRate ?? null, complianceRate: raw?.complianceRate ?? null, criticalFailures: raw?.criticalFailures ?? 0 };
}
function mapDdAssessment(raw: BackendDdAssessmentSummary): DdAssessmentSummary {
  return { id: raw.assessmentId, dealId: raw.dealId, dealTitle: raw.dealId, organizationName: "—", templateVersionLabel: raw.templateVersionId, status: raw.status, ...(raw.assignedTo ? { assignedToName: raw.assignedTo } : {}), ...(raw.startedAt ? { startedAt: raw.startedAt } : {}), ...(raw.completedAt ? { completedAt: raw.completedAt } : {}), updatedAt: raw.updatedAt, revision: raw.revision, metrics: mapDdMetrics(raw.summarySnapshot) };
}
function mapDdDetail(raw: BackendDdAssessmentDetail): DdAssessmentDetail {
  return {
    ...mapDdAssessment(raw.assessment),
    items: raw.items.map((item) => ({ id: String(item.templateItemId ?? ""), requirementCode: String(item.requirementCode ?? ""), position: Number(item.position ?? 0), category: String(item.category ?? ""), ...(item.subcategory ? { subcategory: String(item.subcategory) } : {}), ...(item.requirementType ? { requirementType: String(item.requirementType) } : {}), criticality: item.criticality as DdTemplateItem["criticality"], question: String(item.question ?? ""), ...(item.targetCriteria ? { targetCriteria: String(item.targetCriteria) } : {}), ...(item.unit ? { unit: String(item.unit) } : {}), responseType: item.responseType as DdTemplateItem["responseType"], ...(item.requiredEvidence ? { requiredEvidence: String(item.requiredEvidence) } : {}), required: Boolean(item.required) })),
    responses: raw.responses.map((response) => ({ id: String(response.responseId ?? ""), assessmentId: String(response.assessmentId ?? raw.assessment.assessmentId), templateItemId: String(response.templateItemId ?? ""), status: response.status as DdResponse["status"], ...(response.responseValue !== null && response.responseValue !== undefined ? { responseValue: response.responseValue as DdResponse["responseValue"] } : {}), ...(response.comments ? { comments: String(response.comments) } : {}), ...(response.reviewedBy ? { reviewedBy: String(response.reviewedBy) } : {}), ...(response.reviewedAt ? { reviewedAt: String(response.reviewedAt) } : {}), updatedAt: String(response.updatedAt ?? raw.assessment.updatedAt), revision: Number(response.revision ?? 0), evidence: [] })),
  };
}

/**
 * Fail-closed membership normalisation.
 *
 * PHASE_1_FRONTEND_AUTH_HANDOFF requires the frontend to handle every backend
 * role value with an unknown-value fallback. A membership whose role this build
 * does not recognise is dropped: it grants nothing, rather than being coerced
 * into a role that happens to look similar. Dropping is visible in development
 * so a contract change is noticed instead of silently under-authorising.
 */
function normalizeAuthProfile(profile: AuthProfile): AuthProfile {
  const memberships = [];
  for (const membership of profile.authorization.memberships ?? []) {
    const role = normalizeMembershipRole(membership.role);
    if (role) {
      memberships.push({ ...membership, role });
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[api] /auth/me returned an unrecognised membership role; it grants nothing. ` +
          `Pin a newer contract release or raise a Change Request.`,
      );
    }
  }
  return { ...profile, authorization: { ...profile.authorization, memberships } };
}



