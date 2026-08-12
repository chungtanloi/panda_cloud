import type {
  AssessmentResult,
  AssessmentSubmission,
  AuthSession,
  AuthTokens,
  BookingQuote,
  BookingRequestResult,
  BookingSubmission,
  ChoosePathRequest,
  DashboardSummary,
  GpuModel,
  HyperscaleResult,
  HyperscaleSubmission,
  InvestmentResult,
  InvestmentSubmission,
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
      http.post<AuthSession>(endpoints.auth.login, payload, { anonymous: true }),

    signUp: (payload: SignUpRequest) =>
      http.post<AuthSession>(endpoints.auth.signUp, payload, { anonymous: true }),

    refresh: (refreshToken: string) =>
      http.post<AuthTokens>(endpoints.auth.refresh, { refreshToken }, { anonymous: true }),

    me: () => http.get<User>(endpoints.auth.me),

    choosePath: (payload: ChoosePathRequest) => http.put<User>(endpoints.auth.choosePath, payload),

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

    quote: (payload: Partial<BookingSubmission>) =>
      http.post<BookingQuote>(endpoints.booking.quote, payload),

    submit: (payload: BookingSubmission) =>
      http.post<BookingRequestResult>(endpoints.booking.submit, payload),

    getRequest: (id: string) => http.get<BookingRequestResult>(endpoints.booking.byId(id)),
  },

  investment: {
    getRate: () => http.get<TokenRate>(endpoints.investment.rate, { anonymous: true }),

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
};
