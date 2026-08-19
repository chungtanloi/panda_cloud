/**
 * Every backend path in one place. Paths are relative to
 * NEXT_PUBLIC_API_BASE_URL — no absolute URLs anywhere in the codebase.
 *
 * Transitional handwritten map. The pinned backend OpenAPI release is the
 * authority; replace this with generated operations under CR-007.
 */
export const endpoints = {
  /**
   * Identity. The ONLY authenticated operation the backend contract defines
   * (api-contracts/paths/auth-me.yaml, operationId getAuthenticatedIdentity).
   *
   * Clerk owns sign-in, sign-up, refresh and sign-out. PandaCloud has no
   * password login, no token issuance and no refresh endpoint
   * (PHASE_1_FRONTEND_AUTH_HANDOFF; collaboration workflow § 7.1).
   * `PUT /auth/path` was removed: no approved field or endpoint exists for it.
   */
  auth: {
    me: "/auth/me",
  },

  assessment: {
    preview: "/assessments/preview",
    submit: "/assessments",
    byId: (id: string) => `/assessments/${id}`,
    sessions: "/ai-assessment-sessions",
    session: (id: string) => `/ai-assessment-sessions/${id}`,
    messages: (id: string) => `/ai-assessment-sessions/${id}/messages`,
    summary: (id: string) => `/ai-assessment-sessions/${id}/summary`,
    checkout: (id: string) => `/ai-assessment-sessions/${id}/checkout`,
    entitlement: (id: string) => `/ai-assessment-sessions/${id}/entitlement`,
    startAdvanced: (id: string) => `/ai-assessment-sessions/${id}/advanced/start`,
  },

  booking: {
    gpuModels: "/gpu-models",
    recommend: "/bookings/recommend",
    quote: "/bookings/quote",
    submit: "/bookings",
    byId: (id: string) => `/bookings/${id}`,
  },

  investment: {
    rate: "/investments/rate",
    project: "/investments/project",
    settlement: "/investments/settlement",
    kycDocuments: "/investments/kyc-documents",
    submit: "/investments",
    byId: (id: string) => `/investments/${id}`,
  },

  hyperscale: {
    stageAnalysis: "/hyperscale/stage-analysis",
    capex: "/hyperscale/capex",
    regions: "/hyperscale/regions",
    schedule: "/hyperscale/schedule",
    documents: "/hyperscale/documents",
    submit: "/hyperscale-requests",
    byId: (id: string) => `/hyperscale-requests/${id}`,
  },

  dashboard: {
    summary: "/dashboard/summary",
    receipt: (reference: string) => `/requests/${reference}/receipt`,
  },

  submissions: {
    collection: "/submissions",
    byId: (id: string) => `/submissions/${id}`,
    convert: (id: string) => `/submissions/${id}/convert`,
  },

  dealRequests: {
    forDeal: (dealId: string) => `/deals/${dealId}/change-requests`,
    queue: "/manager/deal-change-requests",
    decision: (requestId: string) =>
      `/manager/deal-change-requests/${requestId}/decision`,
  },

  /**
   * Sales pipeline — internal, staff only. Paths follow the REST shape the
   * Kanban library's fetch adapter expects, so it can be pointed straight at
   * them if we ever drop our own adapter.
   */
  /**
   * Workspace list screens. One path, the resource kind as a segment — the
   * response carries its own column definitions. See models/workspace.ts.
   */
  workspace: {
    resource: (kind: string) => `/workspace/resources/${kind}`,
  },

  /**
   * Technical Due Diligence — `DD API.md`, five operations over four paths.
   * Two path families: assessments are listed and created **under a deal**,
   * then addressed **by their own id** once they exist.
   *
   * Implemented by the backend DD gateway. The mock adapter remains available
   * for local UI development.
   */
  dueDiligence: {
    dealAssessments: (dealId: string) => `/deals/${dealId}/due-diligence/assessments`,
    assessmentById: (assessmentId: string) => `/due-diligence/assessments/${assessmentId}`,
    assessmentProgress: (assessmentId: string) =>
      `/due-diligence/assessments/${assessmentId}/progress`,
    /** Keyed by template item — a never-answered requirement has no response row. */
    response: (assessmentId: string, templateItemId: string) =>
      `/due-diligence/assessments/${assessmentId}/responses/${templateItemId}`,
    evidence: (assessmentId: string, templateItemId: string) =>
      `/due-diligence/assessments/${assessmentId}/responses/${templateItemId}/evidence`,
    evidenceDocument: (assessmentId: string, templateItemId: string, documentId: string) =>
      `/due-diligence/assessments/${assessmentId}/responses/${templateItemId}/evidence/${documentId}`,
  },

  /**
   * Typeahead lookups — shipped 2026-08-18 and present in `openapi.yaml`.
   *
   * ⚠ The four do not share one authorization rule. `deals` and `contacts`
   * resolve the Kanban scope, which fails closed for legal, compliance and
   * technical; `organizations` and `owners` are manager/admin only. See
   * `models/lookup.ts#LOOKUP_ROLE_NOTES`.
   */
  lookups: {
    deals: "/lookups/deals",
    organizations: "/lookups/organizations",
    contacts: "/lookups/contacts",
    owners: "/lookups/owners",
  },

  /** NCNDA gateway operations (see ncnda api.md). */
  ncnda: {
    agreementsForDeal: (dealId: string) => `/deals/${dealId}/ncnda`,
    agreementById: (agreementId: string) => `/ncnda/${agreementId}`,
    agreementDocuments: (agreementId: string) => `/ncnda/${agreementId}/documents`,
    agreementDocument: (agreementId: string, documentId: string) =>
      `/ncnda/${agreementId}/documents/${documentId}`,

    /**
     * ⚠ CR-004 — PROPOSED, NOT IMPLEMENTED BY ANY BACKEND ROUTE.
     *
     * Drafted in `PandaCloudBackend/api-contracts/proposals/CR-004/`, which sits
     * outside `openapi.yaml` on purpose. These three answer 404 today.
     * `services/legalQueue.ts` treats that specific outcome as "not deployed"
     * and falls back to the deal-scoped landing, so the Legal workspace ships
     * now and starts showing the queue the day the backend deploys.
     *
     * Delete this note — not the paths — once CR-004 is approved, merged into
     * the contract and released.
     */
    queue: "/ncnda",
    summary: "/ncnda/summary",
    transitions: (agreementId: string) => `/ncnda/${agreementId}/transitions`,
  },
  /** KYC gateway operations. */
  kyc: {
    casesForDeal: (dealId: string) => `/deals/${dealId}/kyc`,
    caseById: (id: string) => `/kyc/${id}`,
    caseDocuments: (id: string) => `/kyc/${id}/documents`,
    caseDocument: (caseId: string, documentId: string) => `/kyc/${caseId}/documents/${documentId}`,
  },

  salesWorkspace: { overview: "/sales/overview", reports: { conversion: "/sales/reports/conversion", activity: "/sales/reports/activity", forecast: "/sales/reports/forecast" }, leads: "/sales/leads", leadById: (id: string) => "/sales/leads/" + id, qualifyLead: (id: string) => "/sales/leads/" + id + "/qualify", tasks: "/sales/tasks", taskById: (id: string) => "/sales/tasks/" + id, activities: (dealId: string) => "/deals/" + dealId + "/activities", customers: "/sales/customers", customerById: (id: string) => "/sales/customers/" + id },
  sales: {
    columns: "/sales/columns",
    cards: "/sales/cards",
    cardById: (id: string) => `/sales/cards/${id}`,
    moveCard: (id: string) => `/sales/cards/${id}/move`,
    transitionOptions: (id: string) => `/sales/cards/${id}/transition-options`,
  },
  documents: {
    uploadSessions: "/document-upload-sessions",
    byId: (documentId: string) => `/documents/${documentId}`,
    finalize: (documentId: string) => `/documents/${documentId}/finalize`,
    downloadSession: (documentId: string) => `/documents/${documentId}/download-session`,
  },
  admin: { overview: "/admin/overview", users: "/admin/users", userById: (id: string) => `/admin/users/${id}`, roles: "/admin/roles", health: "/admin/system/health", auditLogs: "/admin/audit-logs", auditById: (id: string) => `/admin/audit-logs/${id}` },
  manager: { overview: "/manager/overview", team: "/manager/team", teamMember: (userId: string) => `/manager/team/${userId}`, projects: "/manager/projects", projectById: (projectId: string) => `/manager/projects/${projectId}`, projectReport: "/manager/reports/projects", convertDealToProject: (dealId: string) => `/deals/${dealId}/project`, assessmentLeads: "/manager/assessment-leads", assignAssessmentLead: (leadId: string) => `/manager/assessment-leads/${leadId}/assign` },
} as const;
