/**
 * Domain models and DTOs for AI-Assisted Site Inspection.
 *
 * Canonical authority: AI_ASSISTED_SITE_INSPECTION_SPEC.md & SITE_INSPECTION_UX_FRONTEND_SPEC.md
 * Requirement tags: INS-PROD-001..006, INS-UX-001..008, INS-API-001..010
 */

export type InspectionStatus =
  | "draft"
  | "collecting"
  | "reviewing"
  | "submitted"
  | "analyzing"
  | "provisional"
  | "in_review"
  | "final"
  | "cancelled";

export type EvidenceStatus =
  | "uploading"
  | "scanning"
  | "analyzing"
  | "accepted"
  | "retake_required"
  | "wrong_evidence"
  | "manual_review"
  | "failed"
  | "replaced"
  | "unavailable";

export type InspectionVerdict =
  | "ready"
  | "not_ready"
  | "provisional"
  | "indeterminate";

export type CriterionVerdict =
  | "pass"
  | "fail"
  | "not_verified"
  | "not_applicable";

export type CriterionCriticality = "critical" | "high" | "medium" | "low";

export type AiAnalysisStage =
  | "queued"
  | "evidence_verified"
  | "facts_extracted"
  | "criteria_evaluated"
  | "provisional_prepared"
  | "completed"
  | "retryable_failed"
  | "permanent_failed";

export type DemoScenarioId =
  | "ready"
  | "retake"
  | "critical"
  | "override"
  | "missing"
  | "outage"
  | "conflict";

export interface UsAddress {
  streetAddress: string;
  unitOrSuite?: string;
  city: string;
  state: string;
  postalCode: string;
}

export type FacilityType =
  | "enterprise_dc"
  | "colocation_facility"
  | "edge_dc"
  | "industrial_substation"
  | "modular_pod"
  | "other";

export type OperationalState =
  | "greenfield_construction"
  | "brownfield_retrofit"
  | "commissioned_active"
  | "decommissioned_idle";

export type InspectionObjective =
  | "ai_readiness_assessment"
  | "pre_acquisition_due_diligence"
  | "risk_capacity_review"
  | "remediation_verification";

export interface KnownSystemsMap {
  utilityFeeder: boolean;
  mainTransformerSwitchgear: boolean;
  upsSystem: boolean;
  batteryEnergyStorage: boolean;
  backupGenerators: boolean;
  hvacCooling: boolean;
  fireSuppression: boolean;
  physicalSecurityAccess: boolean;
}

export interface JurisdictionInfo {
  ahjName?: string;
  adoptedCodes?: string[];
  isUnknown: boolean;
}

export interface InspectionProfile {
  id: string;
  code: string;
  name: string;
  description: string;
  market: string;
  activeVersionId: string;
  status: "draft" | "published" | "retired";
  createdAt: string;
  updatedAt: string;
}

export interface InspectionCriterion {
  id: string;
  code: string;
  category: string;
  title: string;
  description: string;
  criticality: CriterionCriticality;
  requiredEvidenceTypes: string[];
  safeCaptureInstruction: string;
  remediationGuidance: string;
  applicabilityRule?: string;
}

export interface ConditionalRule {
  id: string;
  sourceFact: string;
  triggerCondition: string;
  activateTaskId: string;
  description: string;
}

export interface InspectionProfileVersion {
  id: string;
  profileId: string;
  version: number;
  status: "draft" | "published" | "retired";
  market: string;
  name: string;
  criteria: InspectionCriterion[];
  conditionalRules: ConditionalRule[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteInspection {
  id: string;
  organizationId: string;
  organizationName: string;
  profileVersionId: string;
  profileName: string;
  siteName: string;
  address: UsAddress;
  timeZone: string;
  facilityType: FacilityType;
  operationalState: OperationalState;
  objective: InspectionObjective;
  knownSystems: KnownSystemsMap;
  jurisdiction: JurisdictionInfo;
  status: InspectionStatus;
  overallVerdict?: InspectionVerdict;
  revision: number;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  limitationsAcknowledged: boolean;
  linkedSalesSubmissionId?: string;
  submittedAt?: string;
  provisionalReadyAt?: string;
  finalizedAt?: string;
  reportVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteInspectionCreateRequest {
  organizationId: string;
  profileVersionId: string;
  siteName: string;
  address: UsAddress;
  timeZone: string;
  facilityType: FacilityType;
  operationalState: OperationalState;
  objective: InspectionObjective;
  knownSystems: KnownSystemsMap;
  jurisdiction: JurisdictionInfo;
  idempotencyKey: string;
}

export interface SiteInspectionUpdateRequest {
  siteName?: string;
  address?: UsAddress;
  timeZone?: string;
  facilityType?: FacilityType;
  operationalState?: OperationalState;
  objective?: InspectionObjective;
  knownSystems?: KnownSystemsMap;
  jurisdiction?: JurisdictionInfo;
  expectedRevision: number;
}

export interface EvidenceFeedback {
  usableQuality: boolean;
  summary: string;
  details?: string;
  missingItems?: string[];
  suggestedAction?: string;
}

export interface EvidenceRecord {
  id: string;
  taskId: string;
  documentId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  status: EvidenceStatus;
  uploadedAt: string;
  processedAt?: string;
  feedback?: EvidenceFeedback;
  localPreviewUrl?: string; // transient session only
  isConditionalOrigin?: boolean;
}

export interface CaptureTask {
  id: string;
  inspectionId: string;
  criterionId: string;
  category: string;
  title: string;
  instruction: string;
  criticality: CriterionCriticality;
  allowedMimeTypes: string[];
  maxFiles: number;
  isConditional: boolean;
  conditionalTriggerReason?: string;
  isUnavailable: boolean;
  unavailableReason?: string;
  evidence: EvidenceRecord[];
  status: "pending" | "uploading" | "ready" | "needs_action" | "unavailable";
}

export interface EvidenceAttachRequest {
  documentId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  localPreviewUrl?: string;
}

export interface CompletenessGroup {
  acceptedCount: number;
  retakeCount: number;
  missingRequiredCount: number;
  unavailableCount: number;
  pendingReviewCount: number;
  totalTasks: number;
}

export interface CompletenessSummary {
  inspectionId: string;
  groups: CompletenessGroup;
  canSubmitNormally: boolean;
  canSubmitWithLimitations: boolean;
  criticalMissingItems: string[];
  blockingPendingUploads: number;
  limitations: string[];
}

export interface InspectionSubmitRequest {
  expectedRevision: number;
  idempotencyKey: string;
  acknowledgeLimitations?: boolean;
}

export interface InspectionAnalysisStatus {
  inspectionId: string;
  stage: AiAnalysisStage;
  progressPercent: number;
  message: string;
  isRetryable: boolean;
  lastAttemptAt: string;
  errorMessage?: string;
}

export interface EvidenceCitation {
  evidenceId: string;
  fileName: string;
  pageOrTimestamp?: string;
  relevantFindingSnippet: string;
}

export interface CriterionFinding {
  id: string;
  criterionId: string;
  criterionCode: string;
  category: string;
  title: string;
  criticality: CriterionCriticality;
  provisionalVerdict: CriterionVerdict;
  finalVerdict?: CriterionVerdict;
  isOverridden: boolean;
  overrideReason?: string;
  overrideReviewerName?: string;
  directObservation: string;
  engineeringRationale: string;
  remediationRecommendation: string;
  limitationsNote?: string;
  citations: EvidenceCitation[];
}

export interface InspectionResult {
  inspectionId: string;
  organizationName: string;
  siteName: string;
  profileName: string;
  profileVersion: number;
  overallVerdict: InspectionVerdict;
  isProvisional: boolean;
  findings: CriterionFinding[];
  criticalFindingsCount: number;
  highFindingsCount: number;
  notVerifiedCount: number;
  limitations: string[];
  evaluatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reportVersion?: string;
}

export interface TechnicalQueueItem {
  id: string;
  organizationName: string;
  siteName: string;
  facilityType: FacilityType;
  submittedAt: string;
  slaTargetAt: string;
  isSlaBreached: boolean;
  provisionalVerdict: InspectionVerdict;
  criticalIssuesCount: number;
  notVerifiedCount: number;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  revision: number;
  status: InspectionStatus;
}

export interface TechnicalQueueQuery {
  status?: InspectionStatus | "all";
  reviewerId?: string | "all" | "unassigned";
  slaFilter?: "all" | "approaching" | "breached";
  page?: number;
  pageSize?: number;
}

export interface TechnicalQueuePage {
  items: TechnicalQueueItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TechnicalInspectionDetail {
  inspection: SiteInspection;
  profile: InspectionProfileVersion;
  tasks: CaptureTask[];
  result: InspectionResult;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  isClaimedByCurrentUser: boolean;
  canFinalize: boolean;
  blockingReasons: string[];
}

export interface ReviewerClaimRequest {
  expectedRevision: number;
}

export interface ReviewerDecisionRequest {
  verdict: CriterionVerdict;
  reason: string;
  customerRationale: string;
  expectedRevision: number;
}

export interface InspectionFinalizeRequest {
  expectedRevision: number;
  confirmReadiness: boolean;
  executiveSummaryNote?: string;
}

export interface FinalReport {
  inspectionId: string;
  reportVersion: string;
  reportHash: string;
  issuedAt: string;
  reviewerName: string;
  overallVerdict: InspectionVerdict;
  result: InspectionResult;
  downloadSessionUrl?: string;
  expiresAt?: string;
}
