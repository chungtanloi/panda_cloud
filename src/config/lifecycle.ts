import type { StatusTone } from "@/components/workspace/StatusPill";
import type { DdAssessmentStatus, DdResponseStatus, KycRiskLevel, KycStatus, NcndaStatus } from "@/models";

/**
 * Status → colour mapping for the Technical, Legal and Compliance workspaces.
 *
 * Kept out of the components so the enums are exhaustively mapped in one place:
 * `Record<Status, StatusTone>` makes a new backend status a **compile error**
 * rather than a silently grey pill. The backend owns these enums; when one
 * grows, this file is where the build stops and asks what the new value means.
 */

export const NCNDA_STATUS_TONES: Record<NcndaStatus, StatusTone> = {
  not_requested: "neutral",
  drafting: "progress",
  sent: "waiting",
  received: "progress",
  under_review: "progress",
  signed: "progress",
  countersigned: "progress",
  // The only status that means the agreement is in force.
  active: "good",
  rejected: "bad",
  expired: "bad",
  cancelled: "bad",
};

export const KYC_STATUS_TONES: Record<KycStatus, StatusTone> = {
  not_started: "neutral",
  requested: "waiting",
  pending_documents: "waiting",
  submitted: "progress",
  under_review: "progress",
  approved: "good",
  rejected: "bad",
  expired: "bad",
  cancelled: "bad",
  // Not the customer's fault and not a decision — someone has to retry it.
  provider_error: "bad",
};

export const KYC_RISK_TONES: Record<KycRiskLevel, StatusTone> = {
  low: "good",
  medium: "waiting",
  high: "bad",
  // Deliberately the same tone as `high` rather than something louder: the
  // difference is stated in words on the case, because a colour cannot say
  // "stop" as unambiguously as a sentence can.
  prohibited: "bad",
};

export const DD_ASSESSMENT_STATUS_TONES: Record<DdAssessmentStatus, StatusTone> = {
  not_started: "neutral",
  in_progress: "progress",
  under_review: "waiting",
  completed: "good",
  cancelled: "bad",
};

export const DD_RESPONSE_STATUS_TONES: Record<DdResponseStatus, StatusTone> = {
  not_reviewed: "neutral",
  compliant: "good",
  partially_compliant: "waiting",
  non_compliant: "bad",
  not_applicable: "neutral",
  information_pending: "waiting",
  needs_verification: "waiting",
};
