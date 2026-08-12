/**
 * Every backend path in one place. Paths are relative to
 * NEXT_PUBLIC_API_BASE_URL — no absolute URLs anywhere in the codebase.
 *
 * Keep this file in lockstep with docs/API_CONTRACT.md.
 */
export const endpoints = {
  auth: {
    login: "/auth/login",
    signUp: "/auth/signup",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
    choosePath: "/auth/path",
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
  sales: {
    columns: "/sales/columns",
    cards: "/sales/cards",
    cardById: (id: string) => `/sales/cards/${id}`,
    moveCard: (id: string) => `/sales/cards/${id}/move`,
  },
} as const;
