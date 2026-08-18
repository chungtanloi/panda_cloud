export type DocumentUploadContextType = "deal" | "dd_assessment" | "ncnda" | "kyc";
export type DocumentRetentionClass = "standard" | "legal" | "kyc" | "audit";
export type DocumentScanStatus = "pending" | "clean" | "infected" | "failed";
export type DocumentEncryptionStatus = "pending" | "encrypted" | "failed";

export interface DocumentUploadSessionRequest {
  context: { type: DocumentUploadContextType; resourceId: string };
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  retentionClass: DocumentRetentionClass;
  idempotencyKey?: string;
}
export interface DocumentUploadSessionResponse {
  documentId: string;
  uploadUrl: string;
  expiresAt: string;
  requiredHeaders?: Record<string, string>;
  replayed: boolean;
}
export interface DocumentFinalizeResponse {
  documentId: string;
  finalized: boolean;
  checksumVerified: boolean;
  malwareScanStatus: DocumentScanStatus;
  encryptionStatus: DocumentEncryptionStatus;
}
