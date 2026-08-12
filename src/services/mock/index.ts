import type {
  AssessmentSubmission,
  AuthSession,
  BookingSubmission,
  ChoosePathRequest,
  EnergyMix,
  HyperscaleSubmission,
  InvestmentSubmission,
  LivePreview,
  LivePreviewRequest,
  LoginRequest,
  SignUpRequest,
} from "@/models";
import type { ApiClient } from "../contracts";
import { apiConfig } from "../config";
import { ApiError } from "../http";
import {
  mockAssessmentResult,
  mockDashboard,
  mockGpuModels,
  mockReceipt,
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

function session(email: string, fullName: string): AuthSession {
  return {
    user: { ...mockUser, email, fullName },
    tokens: {
      accessToken: `mock.access.${Date.now()}`,
      refreshToken: `mock.refresh.${Date.now()}`,
      expiresIn: 3600,
      tokenType: "Bearer",
    },
  };
}

/** Mirrors the ESG maths the backend is expected to perform. */
function computePreview(mix: EnergyMix, ppa: boolean): LivePreview {
  const table: Record<EnergyMix, { score: string; percent: number; carbon: number; ratio: number }> =
    {
      standard_grid: { score: "C+", percent: 42, carbon: 68.9, ratio: 18 },
      renewable_100: { score: "A-", percent: 82, carbon: 12.4, ratio: 100 },
      hybrid: { score: "B", percent: 64, carbon: 34.1, ratio: 55 },
    };

  const base = table[mix];
  // A PPA improves the grade slightly and trims residual emissions.
  return {
    esgScore: ppa && mix !== "renewable_100" ? `${base.score}+` : base.score,
    esgPercent: Math.min(100, base.percent + (ppa ? 6 : 0)),
    carbonFootprintTco2e: Number((base.carbon * (ppa ? 0.88 : 1)).toFixed(1)),
    renewableRatioPercent: Math.min(100, base.ratio + (ppa ? 10 : 0)),
  };
}

export const mockApi: ApiClient = {
  auth: {
    login: (payload: LoginRequest) => {
      // Always reject rather than throw synchronously, so the mock behaves
      // exactly like the HTTP adapter from the caller's point of view.
      if (!payload.email.includes("@")) {
        return Promise.reject(
          new ApiError({
            code: "VALIDATION_FAILED",
            message: "Please check the highlighted fields.",
            status: 422,
            fieldErrors: { email: ["Enter a valid email address."] },
          }),
        );
      }
      // Any password of 8+ chars succeeds; shorter ones exercise the 401 path.
      if (payload.password.length < 8) {
        return Promise.reject(
          new ApiError({
            code: "UNAUTHORIZED",
            message: "Incorrect email or password.",
            status: 401,
          }),
        );
      }
      return delay(session(payload.email, mockUser.fullName));
    },

    signUp: (payload: SignUpRequest) => delay(session(payload.email, payload.fullName)),

    refresh: () =>
      delay({
        accessToken: `mock.access.${Date.now()}`,
        refreshToken: `mock.refresh.${Date.now()}`,
        expiresIn: 3600,
        tokenType: "Bearer" as const,
      }),

    me: () => delay(mockUser),

    choosePath: (payload: ChoosePathRequest) => delay({ ...mockUser, path: payload.path }),

    logout: () => delay(undefined),
  },

  assessment: {
    preview: (payload: LivePreviewRequest) =>
      delay(computePreview(payload.energyMix, payload.ppaAvailable)),

    submit: (payload: AssessmentSubmission) => {
      const preview = computePreview(
        payload.energySource.energyMix,
        payload.energySource.ppaAvailable,
      );
      return delay({
        ...mockAssessmentResult,
        id: reference("asm").toLowerCase(),
        esgScore: preview.esgScore,
        esgPercent: preview.esgPercent,
        carbonFootprintTco2e: preview.carbonFootprintTco2e,
        renewableRatioPercent: preview.renewableRatioPercent,
        estimatedAnnualRevenueUsd: Math.round(payload.powerCapacity.availableMw * 100_000),
      });
    },

    getResult: (id: string) => delay({ ...mockAssessmentResult, id }),
  },

  booking: {
    listGpuModels: () => delay(mockGpuModels),

    quote: (payload: Partial<BookingSubmission>) => {
      const count = payload.gpuHardware?.gpuCount ?? 8;
      const model =
        mockGpuModels.find((m) => m.id === payload.gpuHardware?.gpuModelId) ?? mockGpuModels[0]!;
      const months = payload.scaleDeployment?.durationMonths ?? 1;
      const discount =
        payload.scaleDeployment?.commitment === "annual"
          ? 22
          : payload.scaleDeployment?.commitment === "monthly"
            ? 12
            : 0;

      const gross = model.hourlyRateUsd * count * 730;
      const monthly = gross * (1 - discount / 100);

      return delay({
        id: reference("qte").toLowerCase(),
        monthlyCostUsd: Math.round(monthly),
        totalCostUsd: Math.round(monthly * months),
        effectiveHourlyRateUsd: Number((model.hourlyRateUsd * (1 - discount / 100)).toFixed(3)),
        discountPercent: discount,
        lineItems: [
          { label: `${count} × ${model.name}`, amountUsd: Math.round(gross) },
          { label: `Commitment discount (${discount}%)`, amountUsd: -Math.round(gross - monthly) },
        ],
        validUntil: "2026-09-12T00:00:00Z",
      });
    },

    submit: () =>
      delay({
        id: reference("bkg").toLowerCase(),
        reference: reference("CP-GPU"),
        status: "received" as const,
        createdAt: new Date().toISOString(),
      }),

    getRequest: (id: string) =>
      delay({
        id,
        reference: reference("CP-GPU"),
        status: "in_review" as const,
        createdAt: "2026-08-10T09:41:00Z",
      }),
  },

  investment: {
    getRate: () => delay(mockTokenRate),

    uploadKycDocument: (file: File) =>
      delay({
        id: reference("doc").toLowerCase(),
        fileName: file.name,
        sizeBytes: file.size,
        uploadedAt: new Date().toISOString(),
      }),

    submit: (payload: InvestmentSubmission) =>
      delay({
        id: reference("inv").toLowerCase(),
        reference: reference("CP-INV"),
        status: "processing" as const,
        amountUsd: payload.volume.amountUsd,
        tokenQuantity: payload.volume.tokenQuantity,
        kycStatus: "pending" as const,
        createdAt: new Date().toISOString(),
      }),

    getInvestment: (id: string) =>
      delay({
        id,
        reference: reference("CP-INV"),
        status: "confirmed" as const,
        amountUsd: 25_000,
        tokenQuantity: 10_339,
        kycStatus: "approved" as const,
        createdAt: "2026-08-09T11:00:00Z",
      }),
  },

  hyperscale: {
    submit: () =>
      delay({
        id: reference("hyp").toLowerCase(),
        reference: reference("CP-HYP"),
        status: "received" as const,
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

  leads: {
    create: () =>
      delay({
        id: reference("lead").toLowerCase(),
        reference: reference("CP-LEAD"),
        status: "received" as const,
        createdAt: new Date().toISOString(),
      }),
  },
};
