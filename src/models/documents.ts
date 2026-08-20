export type DocumentUploadContextType = "deal" | "dd_assessment" | "ncnda" | "kyc" | "submission";
export type DocumentRetentionClass = "standard" | "legal" | "kyc" | "audit";
export type DocumentScanStatus = "pending" | "clean" | "infected" | "failed";
export type DocumentEncryptionStatus = "pending" | "encrypted" | "failed";
export type DocumentRole = "evidence" | "report" | "approval" | "supporting";

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

/** Safe document metadata returned by the gateway. It deliberately has no
 * storage bucket, object path, provider credential, or signed URL. */
export interface DocumentSummary {
  documentId: string;
  organizationId: string | null;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  encryptionStatus: DocumentEncryptionStatus;
  malwareScanStatus: DocumentScanStatus;
  retentionClass: DocumentRetentionClass;
  uploadedBy: string;
  archivedAt: string | null;
}

/** A short-lived URL returned only when the gateway authorizes a download. */
export interface DocumentDownloadSessionResponse {
  documentId: string;
  downloadUrl: string;
  expiresAt: string;
}
