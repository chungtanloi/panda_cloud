import type { IsoDateTime } from "./common";

/**
 * AI Token Investment — a five-step wizard.
 *
 * Intent (1) → Volume (2) → Payment Method (3) → KYC (4) → Confirmation (5)
 *
 * ⚠ The exported screens disagree on the step count: Intent reads "STEP 1 OF
 * 4", Volume "PHASE 02 / 03", Payment "STEP 03 / 04". Confirmed with the
 * product owner on 2026-08-12 that the flow is **five steps**, and every
 * indicator is normalised to that.
 */

/* ------------------------------ Step 1 ------------------------------ */

export type InvestmentIntent = "compute_redemption" | "staking_yield" | "asset_holding";

export interface IntentStep {
  intent: InvestmentIntent;
}

/* ------------------------------ Step 2 ------------------------------ */

export type VolumeTier = "micro" | "custom" | "enterprise";

export interface VolumeStep {
  /** Capital allocation in USD. */
  amountUsd: number;
}

/** The live projection panel on the Volume step. */
export interface VolumeProjection {
  /** Tokens received for the chosen allocation. */
  tokenAllocation: number;
  /** Ticker, e.g. "CPT". */
  tokenSymbol: string;
  /** Equivalent hash-rate share, pre-formatted e.g. "450 TH/s". */
  hashRate: string;
  /** Five-year ROI, e.g. 215 → "215%". */
  roiPercent: number;
  /** Break-even point, pre-formatted e.g. "Y1". */
  breakEven: string;
  /** Peak yield point, pre-formatted e.g. "Y5". */
  maxYield: string;
}

/* ------------------------------ Step 3 ------------------------------ */

export type PaymentMethodType = "usdc" | "bank_wire" | "credit_card";
export type SettlementNetwork = "polygon" | "ethereum" | "arbitrum";

export interface PaymentStep {
  method: PaymentMethodType;
  /** Required when method is "usdc". */
  network?: SettlementNetwork;
}

/** The Settlement Details panel. */
export interface SettlementQuote {
  /** Pre-formatted, e.g. "50,000 GPU" — see the note in the config. */
  allocationVolume: string;
  estimatedUsdValue: number;
  networkFeeUsd: number;
  /** Pre-formatted, e.g. "~2 Mins". */
  settlementTime: string;
  /** Minutes the quoted rate is held for. */
  rateLockMinutes: number;
}

/* ------------------------------ Step 4 ------------------------------ */

export type InvestorClassification = "individual" | "institutional";

export interface KycStep {
  classification: InvestorClassification;
  /** Required when classification is "institutional". */
  organizationName?: string;
  /** Object ids returned by the upload endpoint — never raw files. */
  documentIds: string[];
}

/** Live checklist in the Processing Status panel. */
export interface KycProgress {
  secureConnection: KycCheckState;
  walletSignature: KycCheckState;
  sourcingDocuments: KycCheckState;
  nodeValidation: KycCheckState;
}

export type KycCheckState = "pending" | "active" | "complete" | "failed";

export interface UploadedDocument {
  id: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: IsoDateTime;
}

/* --------------------------- Aggregate draft ------------------------ */

export interface InvestmentDraft {
  intent?: Partial<IntentStep>;
  volume?: Partial<VolumeStep>;
  payment?: Partial<PaymentStep>;
  kyc?: Partial<KycStep>;
}

export interface InvestmentSubmission {
  intent: IntentStep;
  volume: VolumeStep;
  payment: PaymentStep;
  kyc: KycStep;
}

/* ------------------------------ Result ------------------------------ */

export interface InvestmentResult {
  id: string;
  reference: string;
  status: "pending_payment" | "processing" | "confirmed" | "failed";
  totalInvestmentUsd: number;
  tokenAllocation: number;
  tokenSymbol: string;
  /** On-chain or ledger transaction id. */
  transactionId: string;
  transactionDate: IsoDateTime;
  /** e.g. "Solana". */
  network: string;
  /** Estimated APY, e.g. 14.2. */
  estimatedApyPercent: number;
  /** Five-year projected value in USD. */
  fiveYearValueUsd: number;
  createdAt: IsoDateTime;
}

/** Current token pricing, polled by the Volume step. */
export interface TokenRate {
  /** USD per token. */
  priceUsd: number;
  /** 24-hour change, e.g. -1.24 for −1.24%. */
  change24hPercent: number;
  updatedAt: IsoDateTime;
}
