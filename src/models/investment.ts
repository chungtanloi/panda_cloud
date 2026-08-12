import type { IsoDateTime } from "./common";

/**
 * AI Token Investment — 5-step wizard.
 * Intro → Volume (2) → Payment Method (3) → KYC Verification (4)
 * → Investment Confirmation (5)
 *
 * PROVISIONAL: verified against Figma as each screen is implemented.
 */

export interface VolumeStep {
  /** Amount to invest, in USD. */
  amountUsd: number;
  /** Token quantity derived from amount × current rate. */
  tokenQuantity: number;
}

export type PaymentMethodType = "bank_transfer" | "card" | "crypto";

export interface PaymentMethodStep {
  method: PaymentMethodType;
  /** Present when method === "crypto". */
  walletAddress?: string;
  /** Last 4 digits only — full PAN never touches the frontend state. */
  cardLast4?: string;
}

export type IdDocumentType = "passport" | "national_id" | "drivers_license";

export interface KycStep {
  fullName: string;
  dateOfBirth: string;
  country: string;
  documentType: IdDocumentType;
  documentNumber: string;
  /** Object keys returned by the upload endpoint, not raw files. */
  documentUploadIds: string[];
}

export interface InvestmentDraft {
  volume?: Partial<VolumeStep>;
  paymentMethod?: Partial<PaymentMethodStep>;
  kyc?: Partial<KycStep>;
}

export interface InvestmentSubmission {
  volume: VolumeStep;
  paymentMethod: PaymentMethodStep;
  kyc: KycStep;
}

/** Current token pricing, polled by the Volume screen. */
export interface TokenRate {
  /** USD per token. */
  priceUsd: number;
  /** 24-hour change, e.g. -1.24 for −1.24%. */
  change24hPercent: number;
  updatedAt: IsoDateTime;
}

export interface InvestmentResult {
  id: string;
  reference: string;
  status: "pending_payment" | "processing" | "confirmed" | "failed";
  amountUsd: number;
  tokenQuantity: number;
  kycStatus: "not_started" | "pending" | "approved" | "rejected";
  createdAt: IsoDateTime;
}

/** Response from the KYC document upload endpoint. */
export interface UploadedDocument {
  id: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: IsoDateTime;
}
