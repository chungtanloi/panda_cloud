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

  leads: {
    create: "/leads",
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

  sales: {
    columns: "/sales/columns",
    cards: "/sales/cards",
    cardById: (id: string) => `/sales/cards/${id}`,
    moveCard: (id: string) => `/sales/cards/${id}/move`,
  },
} as const;
