import type {
  InspectionProfile,
  InspectionProfileVersion,
  SiteInspection,
  SiteInspectionCreateRequest,
  SiteInspectionUpdateRequest,
  CaptureTask,
  EvidenceRecord,
  EvidenceAttachRequest,
  CompletenessSummary,
  InspectionSubmitRequest,
  InspectionAnalysisStatus,
  InspectionResult,
  FinalReport,
  TechnicalQueueQuery,
  TechnicalQueuePage,
  TechnicalInspectionDetail,
  ReviewerClaimRequest,
  ReviewerDecisionRequest,
  InspectionFinalizeRequest,
  DemoScenarioId,
} from "@/models";
import type {
  SiteInspectionService,
  InspectionReviewService,
  InspectionProfileAdminService,
} from "../contracts";
import { ApiError } from "../http";
import {
  DEMO_PROFILE_ID,
  DEMO_PROFILE_VERSION_ID,
  DEMO_INSPECTION_PROFILE,
  DEMO_PROFILE_VERSION,
  createInitialTasks,
  createDefaultInspection,
  createDefaultFindings,
  createDefaultQueueItems,
} from "./siteInspectionFixtures";

const STORAGE_KEY = "panda-cloud:site-inspection-demo:v1";

interface DemoStorageState {
  version: 1;
  scenario: DemoScenarioId;
  inspections: Record<string, SiteInspection>;
  tasks: Record<string, CaptureTask[]>; // inspectionId -> tasks
  results: Record<string, InspectionResult>;
  finalReports: Record<string, FinalReport>;
  analysisProgress: Record<string, { stage: string; percent: number; attempt: number }>;
}

// In-memory ephemeral object URL registry (never stored in localStorage)
const objectUrlRegistry = new Map<string, string>(); // documentId -> objectUrl

function registerObjectUrl(documentId: string, url: string) {
  if (objectUrlRegistry.has(documentId)) {
    try {
      URL.revokeObjectURL(objectUrlRegistry.get(documentId)!);
    } catch {
      // ignore
    }
  }
  objectUrlRegistry.set(documentId, url);
}

export function revokeAllDemoObjectUrls() {
  for (const url of objectUrlRegistry.values()) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
  objectUrlRegistry.clear();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getInitialState(scenario: DemoScenarioId = "ready"): DemoStorageState {
  const inspectionId = `insp_demo_${scenario}`;
  const inspection = createDefaultInspection(inspectionId);
  const tasks = createInitialTasks(inspectionId);

  // Configure initial scenario specific adjustments
  if (scenario === "ready" || scenario === "critical" || scenario === "override") {
    // Seed pre-filled evidence for all standard tasks for rapid demoing
    for (const task of tasks) {
      if (task.id === "task_demo_battery_room") continue; // conditional task starts clean
      const docId = `doc_${task.id}`;
      task.status = "ready";
      task.evidence = [
        {
          id: `evid_${task.id}`,
          taskId: task.id,
          documentId: docId,
          fileName: task.allowedMimeTypes.includes("application/pdf")
            ? "annual_preventive_scan_2026.pdf"
            : `${task.id.replace("task_demo_", "")}_photo.jpg`,
          fileSizeBytes: 2450000,
          mimeType: task.allowedMimeTypes[0] || "image/jpeg",
          status: "accepted",
          uploadedAt: new Date(Date.now() - 1800000).toISOString(),
          processedAt: new Date(Date.now() - 1700000).toISOString(),
          feedback: {
            usableQuality: true,
            summary: "Resolution and lighting verified. Equipment label clearly readable.",
          },
        },
      ];
    }
  }

  const findings = createDefaultFindings(inspectionId, scenario);

  const initialResult: InspectionResult = {
    inspectionId,
    organizationName: inspection.organizationName,
    siteName: inspection.siteName,
    profileName: inspection.profileName,
    profileVersion: 1,
    overallVerdict: scenario === "critical" ? "not_ready" : "ready",
    isProvisional: true,
    findings,
    criticalFindingsCount: scenario === "critical" ? 1 : 0,
    highFindingsCount: 0,
    notVerifiedCount: scenario === "missing" ? 2 : 0,
    limitations: [
      "Rapid advisory inspection — does not replace AHJ or Professional Engineer certification.",
      "Scope limited to non-invasive visual observation and provided document review.",
    ],
    evaluatedAt: new Date(Date.now() - 900000).toISOString(),
  };

  return {
    version: 1,
    scenario,
    inspections: { [inspectionId]: inspection },
    tasks: { [inspectionId]: tasks },
    results: { [inspectionId]: initialResult },
    finalReports: {},
    analysisProgress: {},
  };
}

class MockSiteInspectionStore {
  private state: DemoStorageState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DemoStorageState {
    if (typeof window === "undefined") {
      return getInitialState("ready");
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return getInitialState("ready");
      const parsed = JSON.parse(raw) as DemoStorageState;
      if (parsed.version !== 1) {
        return getInitialState("ready");
      }
      return parsed;
    } catch {
      return getInitialState("ready");
    }
  }

  private saveState(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // ignore storage write errors
    }
  }

  public resetScenario(scenario: DemoScenarioId = "ready"): void {
    revokeAllDemoObjectUrls();
    this.state = getInitialState(scenario);
    this.saveState();
  }

  public getScenario(): DemoScenarioId {
    return this.state.scenario;
  }

  public getInspection(id: string): SiteInspection {
    const item = this.state.inspections[id];
    if (!item) {
      // Auto-fallback: if asking for default ready inspection or newly generated
      const created = createDefaultInspection(id);
      this.state.inspections[id] = created;
      if (!this.state.tasks[id]) {
        this.state.tasks[id] = createInitialTasks(id);
      }
      this.saveState();
      return created;
    }
    return item;
  }

  public saveInspection(inspection: SiteInspection): void {
    this.state.inspections[inspection.id] = {
      ...inspection,
      revision: inspection.revision + 1,
      updatedAt: new Date().toISOString(),
    };
    this.saveState();
  }

  public getTasks(inspectionId: string): CaptureTask[] {
    if (!this.state.tasks[inspectionId]) {
      this.state.tasks[inspectionId] = createInitialTasks(inspectionId);
      this.saveState();
    }
    return this.state.tasks[inspectionId];
  }

  public saveTasks(inspectionId: string, tasks: CaptureTask[]): void {
    this.state.tasks[inspectionId] = tasks;
    this.saveState();
  }

  public getResult(inspectionId: string): InspectionResult {
    if (!this.state.results[inspectionId]) {
      const inspection = this.getInspection(inspectionId);
      const findings = createDefaultFindings(inspectionId, this.state.scenario);
      this.state.results[inspectionId] = {
        inspectionId,
        organizationName: inspection.organizationName,
        siteName: inspection.siteName,
        profileName: inspection.profileName,
        profileVersion: 1,
        overallVerdict: this.state.scenario === "critical" ? "not_ready" : "ready",
        isProvisional: true,
        findings,
        criticalFindingsCount: this.state.scenario === "critical" ? 1 : 0,
        highFindingsCount: 0,
        notVerifiedCount: 0,
        limitations: [
          "Rapid advisory inspection — does not replace AHJ or Professional Engineer certification.",
        ],
        evaluatedAt: new Date().toISOString(),
      };
      this.saveState();
    }
    return this.state.results[inspectionId];
  }

  public saveResult(result: InspectionResult): void {
    this.state.results[result.inspectionId] = result;
    this.saveState();
  }

  public getFinalReport(inspectionId: string): FinalReport | undefined {
    return this.state.finalReports[inspectionId];
  }

  public saveFinalReport(report: FinalReport): void {
    this.state.finalReports[report.inspectionId] = report;
    this.saveState();
  }
}

const mockStore = new MockSiteInspectionStore();

export const mockSiteInspectionService: SiteInspectionService = {
  async getPublishedProfiles(): Promise<InspectionProfileVersion[]> {
    await delay(120);
    return [DEMO_PROFILE_VERSION];
  },

  async getProfileVersion(profileId: string, versionId: string): Promise<InspectionProfileVersion> {
    await delay(100);
    if (profileId === DEMO_PROFILE_ID && versionId === DEMO_PROFILE_VERSION_ID) {
      return DEMO_PROFILE_VERSION;
    }
    return DEMO_PROFILE_VERSION;
  },

  async createInspection(body: SiteInspectionCreateRequest): Promise<SiteInspection> {
    await delay(250);
    const newId = `insp_${Date.now().toString(36)}`;
    const inspection: SiteInspection = {
      id: newId,
      organizationId: body.organizationId,
      organizationName: "Demo Workspace Active Org",
      profileVersionId: body.profileVersionId || DEMO_PROFILE_VERSION_ID,
      profileName: DEMO_PROFILE_VERSION.name,
      siteName: body.siteName,
      address: body.address,
      timeZone: body.timeZone,
      facilityType: body.facilityType,
      operationalState: body.operationalState,
      objective: body.objective,
      knownSystems: body.knownSystems,
      jurisdiction: body.jurisdiction,
      status: "collecting",
      revision: 1,
      limitationsAcknowledged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockStore.saveInspection(inspection);
    mockStore.saveTasks(newId, createInitialTasks(newId));
    return inspection;
  },

  async getInspection(id: string): Promise<SiteInspection> {
    await delay(150);
    return mockStore.getInspection(id);
  },

  async updateInspection(id: string, body: SiteInspectionUpdateRequest): Promise<SiteInspection> {
    await delay(200);
    const current = mockStore.getInspection(id);

    if (body.expectedRevision !== current.revision) {
      throw new ApiError({
        status: 409,
        code: "REVISION_CONFLICT",
        message: "The inspection was modified by another session. Please reload the latest changes.",
      });
    }

    const updated: SiteInspection = {
      ...current,
      ...(body.siteName ? { siteName: body.siteName } : {}),
      ...(body.address ? { address: body.address } : {}),
      ...(body.timeZone ? { timeZone: body.timeZone } : {}),
      ...(body.facilityType ? { facilityType: body.facilityType } : {}),
      ...(body.operationalState ? { operationalState: body.operationalState } : {}),
      ...(body.objective ? { objective: body.objective } : {}),
      ...(body.knownSystems ? { knownSystems: body.knownSystems } : {}),
      ...(body.jurisdiction ? { jurisdiction: body.jurisdiction } : {}),
    };

    mockStore.saveInspection(updated);
    return mockStore.getInspection(id);
  },

  async getTasks(inspectionId: string): Promise<CaptureTask[]> {
    await delay(120);
    return mockStore.getTasks(inspectionId);
  },

  async attachEvidence(inspectionId: string, taskId: string, body: EvidenceAttachRequest): Promise<EvidenceRecord> {
    await delay(400);
    const tasks = mockStore.getTasks(inspectionId);
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: `Task ${taskId} not found` });
    }

    if (body.localPreviewUrl) {
      registerObjectUrl(body.documentId, body.localPreviewUrl);
    }

    const scenario = mockStore.getScenario();
    let status: EvidenceRecord["status"] = "accepted";
    let feedback: EvidenceRecord["feedback"] = {
      usableQuality: true,
      summary: "Document verified and readable. Resolution satisfies preflight criteria.",
    };

    // Scenario simulation for retake and wrong evidence
    if (scenario === "retake" && targetTask.id === "task_demo_util_feeder" && targetTask.evidence.length === 0) {
      status = "retake_required";
      feedback = {
        usableQuality: false,
        summary: "Image is too blurred to read the primary nameplate ratings.",
        details: "Optical character recognition detected unreadable numbers on switchgear label.",
        suggestedAction: "Ensure direct focus on the manufacturer placard with adequate illumination.",
      };
    } else if (scenario === "retake" && targetTask.id === "task_demo_ups_topo" && targetTask.evidence.length === 0) {
      status = "wrong_evidence";
      feedback = {
        usableQuality: false,
        summary: "Provided image appears to show air conditioning unit rather than UPS control panel.",
        details: "Expected UPS LCD display showing active inverter load.",
        suggestedAction: "Please photograph the front control interface of the UPS module.",
      };
    }

    const newEvidence: EvidenceRecord = {
      id: `evid_${Date.now().toString(36)}`,
      taskId,
      documentId: body.documentId,
      fileName: body.fileName,
      fileSizeBytes: body.fileSizeBytes,
      mimeType: body.mimeType,
      status,
      uploadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      feedback,
      localPreviewUrl: body.localPreviewUrl,
    };

    targetTask.evidence.push(newEvidence);
    targetTask.status = status === "accepted" ? "ready" : "needs_action";
    mockStore.saveTasks(inspectionId, [...tasks]);

    return newEvidence;
  },

  async removeEvidence(inspectionId: string, taskId: string, evidenceId: string): Promise<void> {
    await delay(200);
    const tasks = mockStore.getTasks(inspectionId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.evidence = task.evidence.filter((e) => e.id !== evidenceId);
    task.status = task.evidence.length > 0 && task.evidence.every((e) => e.status === "accepted") ? "ready" : "pending";
    mockStore.saveTasks(inspectionId, [...tasks]);
  },

  async markTaskUnavailable(inspectionId: string, taskId: string, reason?: string): Promise<CaptureTask> {
    await delay(200);
    const tasks = mockStore.getTasks(inspectionId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new ApiError({ status: 404, code: "NOT_FOUND", message: `Task ${taskId} not found` });
    }

    task.isUnavailable = true;
    task.unavailableReason = reason || "Equipment not accessible during site inspection.";
    task.status = "unavailable";
    mockStore.saveTasks(inspectionId, [...tasks]);
    return task;
  },

  async getCompleteness(inspectionId: string): Promise<CompletenessSummary> {
    await delay(150);
    const tasks = mockStore.getTasks(inspectionId);

    let acceptedCount = 0;
    let retakeCount = 0;
    let missingRequiredCount = 0;
    let unavailableCount = 0;
    let pendingReviewCount = 0;
    const criticalMissingItems: string[] = [];

    for (const task of tasks) {
      if (task.isUnavailable) {
        unavailableCount++;
        if (task.criticality === "critical" || task.criticality === "high") {
          criticalMissingItems.push(`${task.title} (Marked unavailable)`);
        }
      } else if (task.evidence.length === 0) {
        missingRequiredCount++;
        if (task.criticality === "critical" || task.criticality === "high") {
          criticalMissingItems.push(task.title);
        }
      } else if (task.evidence.some((e) => e.status === "retake_required" || e.status === "wrong_evidence")) {
        retakeCount++;
      } else if (task.evidence.every((e) => e.status === "accepted")) {
        acceptedCount++;
      } else {
        pendingReviewCount++;
      }
    }

    const canSubmitNormally = retakeCount === 0 && missingRequiredCount === 0 && unavailableCount === 0;
    const canSubmitWithLimitations = retakeCount === 0; // Allowed if missing/unavailable is acknowledged

    return {
      inspectionId,
      groups: {
        acceptedCount,
        retakeCount,
        missingRequiredCount,
        unavailableCount,
        pendingReviewCount,
        totalTasks: tasks.length,
      },
      canSubmitNormally,
      canSubmitWithLimitations,
      criticalMissingItems,
      blockingPendingUploads: 0,
      limitations: [
        "Unprovided or unavailable items will be recorded as not_verified in the provisional finding.",
      ],
    };
  },

  async submitInspection(inspectionId: string, body: InspectionSubmitRequest): Promise<SiteInspection> {
    await delay(350);
    const current = mockStore.getInspection(inspectionId);

    if (body.expectedRevision !== current.revision) {
      throw new ApiError({
        status: 409,
        code: "REVISION_CONFLICT",
        message: "Inspection revision mismatch. Please refresh and resubmit.",
      });
    }

    const updated: SiteInspection = {
      ...current,
      status: "submitted",
      limitationsAcknowledged: !!body.acknowledgeLimitations,
      submittedAt: new Date().toISOString(),
    };

    mockStore.saveInspection(updated);
    return mockStore.getInspection(inspectionId);
  },

  async getAnalysisStatus(inspectionId: string): Promise<InspectionAnalysisStatus> {
    await delay(150);
    const scenario = mockStore.getScenario();

    if (scenario === "outage") {
      return {
        inspectionId,
        stage: "retryable_failed",
        progressPercent: 35,
        message: "AI preflight synthesis provider temporarily unavailable (503 Service Unavailable).",
        isRetryable: true,
        lastAttemptAt: new Date().toISOString(),
        errorMessage: "Simulated AI provider rate limit / upstream timeout.",
      };
    }

    return {
      inspectionId,
      stage: "completed",
      progressPercent: 100,
      message: "Synthesis complete. Provisional assessment prepared for Technical review.",
      isRetryable: false,
      lastAttemptAt: new Date().toISOString(),
    };
  },

  async retryAnalysis(inspectionId: string): Promise<InspectionAnalysisStatus> {
    await delay(500);
    return {
      inspectionId,
      stage: "completed",
      progressPercent: 100,
      message: "Retry succeeded. Provisional findings evaluated successfully.",
      isRetryable: false,
      lastAttemptAt: new Date().toISOString(),
    };
  },

  async getResult(inspectionId: string): Promise<InspectionResult> {
    await delay(180);
    return mockStore.getResult(inspectionId);
  },

  async getFinalReport(inspectionId: string): Promise<FinalReport> {
    await delay(200);
    const report = mockStore.getFinalReport(inspectionId);
    if (!report) {
      const result = mockStore.getResult(inspectionId);
      return {
        inspectionId,
        reportVersion: "REV-2026-FINAL-01",
        reportHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        issuedAt: new Date().toISOString(),
        reviewerName: "Alex Vance, Senior PE Reviewer",
        overallVerdict: result.overallVerdict,
        result,
        downloadSessionUrl: "https://mock.storage.pandacloud.internal/reports/final-report-2026.pdf",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
    }
    return report;
  },

  async getCopilotContext(inspectionId: string, taskId?: string, findingId?: string): Promise<{ suggestedPrompts: string[]; explanation?: string }> {
    await delay(150);
    if (taskId) {
      return {
        suggestedPrompts: [
          "What should I capture for this task?",
          "Why is this evidence required?",
          "How to safely photograph switchgear nameplates?",
        ],
        explanation: "This task verifies primary electrical service sizing and safety clearances according to standard data center design guidelines.",
      };
    }

    if (findingId) {
      return {
        suggestedPrompts: [
          "Explain why this finding received its verdict",
          "What remediation steps are recommended?",
          "What evidence could upgrade this finding in a reinspection?",
        ],
        explanation: "The evaluation is grounded directly in the provided nameplate photos and IR thermography reports.",
      };
    }

    return {
      suggestedPrompts: [
        "What are the critical checklist items?",
        "How is the provisional verdict derived?",
        "When will the technical reviewer finalize the report?",
      ],
      explanation: "Panda Cloud AI preflights each capture in real-time, followed by comprehensive synthesis upon submission.",
    };
  },
};

export const mockInspectionReviewService: InspectionReviewService = {
  async listQueue(query?: TechnicalQueueQuery): Promise<TechnicalQueuePage> {
    await delay(200);
    let items = createDefaultQueueItems();

    if (query?.status && query.status !== "all") {
      items = items.filter((i) => i.status === query.status);
    }
    if (query?.slaFilter === "breached") {
      items = items.filter((i) => i.isSlaBreached);
    }

    return {
      items,
      total: items.length,
      page: query?.page || 1,
      pageSize: query?.pageSize || 10,
    };
  },

  async getDetail(id: string): Promise<TechnicalInspectionDetail> {
    await delay(220);
    const inspection = mockStore.getInspection(id);
    const tasks = mockStore.getTasks(id);
    const result = mockStore.getResult(id);

    return {
      inspection,
      profile: DEMO_PROFILE_VERSION,
      tasks,
      result,
      assignedReviewerId: inspection.assignedReviewerId,
      assignedReviewerName: inspection.assignedReviewerName,
      isClaimedByCurrentUser: !!inspection.assignedReviewerId,
      canFinalize: !result.findings.some((f) => f.provisionalVerdict === "not_verified" && !f.finalVerdict),
      blockingReasons: [],
    };
  },

  async claimInspection(id: string, body: ReviewerClaimRequest): Promise<TechnicalInspectionDetail> {
    await delay(300);
    const inspection = mockStore.getInspection(id);

    const scenario = mockStore.getScenario();
    if (scenario === "conflict") {
      throw new ApiError({
        status: 409,
        code: "REVISION_CONFLICT",
        message: "Inspection has already been claimed or modified by another reviewer.",
      });
    }

    if (body.expectedRevision !== inspection.revision) {
      throw new ApiError({
        status: 409,
        code: "REVISION_CONFLICT",
        message: "Revision mismatch. Reloading latest queue state.",
      });
    }

    inspection.assignedReviewerId = "rev_current_user";
    inspection.assignedReviewerName = "Alex Vance, Lead PE";
    inspection.status = "in_review";
    mockStore.saveInspection(inspection);

    return this.getDetail(id);
  },

  async releaseClaim(id: string, reason?: string): Promise<TechnicalInspectionDetail> {
    await delay(200);
    const inspection = mockStore.getInspection(id);
    inspection.assignedReviewerId = undefined;
    inspection.assignedReviewerName = undefined;
    mockStore.saveInspection(inspection);
    return this.getDetail(id);
  },

  async reassignClaim(id: string, reviewerId: string, reason: string): Promise<TechnicalInspectionDetail> {
    await delay(250);
    const inspection = mockStore.getInspection(id);
    inspection.assignedReviewerId = reviewerId;
    inspection.assignedReviewerName = `Reviewer ${reviewerId}`;
    mockStore.saveInspection(inspection);
    return this.getDetail(id);
  },

  async resolveCriterion(id: string, criterionId: string, body: ReviewerDecisionRequest): Promise<TechnicalInspectionDetail> {
    await delay(300);
    const result = mockStore.getResult(id);
    const finding = result.findings.find((f) => f.criterionId === criterionId);
    if (finding) {
      finding.finalVerdict = body.verdict;
      finding.isOverridden = body.verdict !== finding.provisionalVerdict;
      finding.overrideReason = body.reason;
      finding.overrideReviewerName = "Alex Vance, Lead PE";
      finding.engineeringRationale = body.customerRationale || finding.engineeringRationale;
      mockStore.saveResult(result);
    }
    return this.getDetail(id);
  },

  async finalizeInspection(id: string, body: InspectionFinalizeRequest): Promise<FinalReport> {
    await delay(450);
    const inspection = mockStore.getInspection(id);

    if (body.expectedRevision !== inspection.revision) {
      throw new ApiError({
        status: 409,
        code: "REVISION_CONFLICT",
        message: "Revision conflict before finalization. Please review the updated inspection.",
      });
    }

    inspection.status = "final";
    inspection.finalizedAt = new Date().toISOString();
    inspection.reportVersion = "PANDA-REVIEWED-2026-V1";
    mockStore.saveInspection(inspection);

    const result = mockStore.getResult(id);
    result.isProvisional = false;
    result.reviewedAt = new Date().toISOString();
    result.reviewedBy = "Alex Vance, Lead PE";
    result.reportVersion = inspection.reportVersion;
    mockStore.saveResult(result);

    const report: FinalReport = {
      inspectionId: id,
      reportVersion: inspection.reportVersion,
      reportHash: "sha256:8e12b489a5c71d3e2098b67199c0d12543fa0892019b8823acde5421098ef912",
      issuedAt: new Date().toISOString(),
      reviewerName: "Alex Vance, Lead PE",
      overallVerdict: result.overallVerdict,
      result,
      downloadSessionUrl: "https://mock.storage.pandacloud.internal/reports/final-report-2026.pdf",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    mockStore.saveFinalReport(report);
    return report;
  },
};

export const mockInspectionProfileAdminService: InspectionProfileAdminService = {
  async listProfiles(): Promise<InspectionProfile[]> {
    await delay(120);
    return [DEMO_INSPECTION_PROFILE];
  },

  async getProfile(id: string): Promise<InspectionProfile> {
    await delay(100);
    return DEMO_INSPECTION_PROFILE;
  },

  async createProfileDraft(id: string): Promise<InspectionProfileVersion> {
    await delay(250);
    return {
      ...DEMO_PROFILE_VERSION,
      id: `prof_ver_${Date.now().toString(36)}`,
      version: DEMO_PROFILE_VERSION.version + 1,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async updateProfileDraft(id: string, versionId: string, data: Partial<InspectionProfileVersion>): Promise<InspectionProfileVersion> {
    await delay(200);
    return {
      ...DEMO_PROFILE_VERSION,
      ...data,
      id: versionId,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
  },

  async publishProfileDraft(id: string, versionId: string): Promise<InspectionProfileVersion> {
    await delay(350);
    return {
      ...DEMO_PROFILE_VERSION,
      id: versionId,
      status: "published",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

export { mockStore as demoSiteInspectionStore };
