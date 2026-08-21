export type SubmissionSource = "website" | "referral" | "event" | "manual" | "partner" | "other";
/**
 * PHẢI khớp VALID_PERSONAS ở PandaCloudBackend/src/http/submissions-handlers.ts
 * và validator `persona` ở convex/leads.ts.
 *
 * Union cũ có "procurement" và "other" — hai giá trị KHÔNG tồn tại ở backend.
 * Chúng không gây 400 (backend âm thầm đặt persona = undefined), nên lỗi đi
 * lọt qua kiểm thử và chỉ lộ ra khi lead tới đội Sales mà không có persona.
 */
export type SubmissionPersona =
  | "asset_owner"
  | "enterprise_leaser"
  | "token_buyer"
  | "gpu_buyer"
  | "investor"
  | "hyperscaler";
export type SubmissionVertical = "land" | "gpu" | "token" | "hyperscale";
export type SubmissionPriority = "low" | "normal" | "high" | "urgent";
export type SubmissionStatus = "new" | "qualified" | "converted" | "disqualified" | "nurture" | "archived";

export interface Submission {
  leadId: string;
  source: SubmissionSource;
  persona?: SubmissionPersona | null;
  vertical?: SubmissionVertical | null;
  status: SubmissionStatus;
  summary: string | null;
  updatedAt: string;
  organizationId?: string | null;
  primaryContactId?: string | null;
  createdBy?: string | null;
  convertedAt?: string | null;
  archivedAt?: string | null;
}
export interface SubmissionListResponse { leads: readonly Submission[]; continueCursor: string | null; isDone: boolean; }
/**
 * Thân yêu cầu POST /submissions.
 *
 * `contact` là BẮT BUỘC ở phía backend (submissions-handlers.ts kiểm
 * `contact.fullName` và `contact.email` rồi trả 400 nếu thiếu). Trước đây kiểu
 * này không khai báo `contact`, nên mọi form liên hệ trên trang marketing đều
 * bị từ chối — lead không bao giờ tới được đội Sales.
 */
export interface SubmissionContact {
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
}

export interface SubmissionCreateRequest {
  source: SubmissionSource;
  persona?: SubmissionPersona;
  vertical?: SubmissionVertical;
  summary: string;
  contact: SubmissionContact;
  /** Chỉ nhận giá trị vô hướng; tối đa 50 khoá. Xem submissions-handlers.ts. */
  sourcePayload?: Record<string, string | number | boolean | null>;
  /** Bắt buộc khi vertical là gpu / token / hyperscale. */
  idempotencyKey?: string;
  documentIds?: string[];
}
export interface SubmissionCreateResponse extends Submission {}
export interface SubmissionConvertRequest { organizationId: string; ownerId: string; title: string; vertical: SubmissionVertical; priority: SubmissionPriority; description?: string; }
export interface SubmissionConvertResponse { leadId: string; dealId: string; dealRevision: number; leadStatus: "converted"; updatedAt: string; }
