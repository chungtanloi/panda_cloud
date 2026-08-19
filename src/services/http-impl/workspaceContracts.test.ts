import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, patch, remove } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), remove: vi.fn() }));
vi.mock("@/services/http", () => ({ http: { get, post, patch, delete: remove } }));

import { httpApi } from "@/services/http-impl";

describe("workspace HTTP contracts", () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); patch.mockReset(); remove.mockReset(); });

  it("maps Sales overview and reports to implemented backend paths", async () => {
    get.mockResolvedValue({});
    await httpApi.salesWorkspace.overview();
    await httpApi.salesWorkspace.conversionReport();
    await httpApi.salesWorkspace.activityReport();
    await httpApi.salesWorkspace.forecastReport();
    expect(get.mock.calls.map(([path]) => path)).toEqual(["/sales/overview", "/sales/reports/conversion", "/sales/reports/activity", "/sales/reports/forecast"]);
  });

  it("creates deal-scoped KYC without sending identity or role fields", async () => {
    post.mockResolvedValue({ caseId: "case-1", revision: 1 });
    await httpApi.compliance.createCase("deal-1", { subjectOrganizationId: "org-1" });
    expect(post).toHaveBeenCalledWith("/deals/deal-1/kyc", { subjectOrganizationId: "org-1" });
  });

  it("creates NCNDA through the deal-scoped PATCH contract", async () => {
    patch.mockResolvedValue({ agreementId: "agreement-1", revision: 1, created: true });
    await httpApi.legal.upsertAgreement({ dealId: "deal-1", counterpartyOrganizationId: "org-1", ownerId: "user-1", status: "drafting", expectedRevision: 1 });
    expect(patch).toHaveBeenCalledWith("/deals/deal-1/ncnda", { counterpartyOrganizationId: "org-1", ownerId: "user-1", status: "drafting", expectedRevision: 1 });
    expect(patch.mock.calls[0]![1]).not.toHaveProperty("dealId");
    expect(patch.mock.calls[0]![1]).not.toHaveProperty("role");
    expect(patch.mock.calls[0]![1]).not.toHaveProperty("organizationId");
  });

  it("uses only approved NCNDA document paths", async () => {
    get.mockResolvedValue({ agreementId: "agreement-1", versions: [] });
    post.mockResolvedValue({ versionId: "version-1", documentId: "document-1" });
    remove.mockResolvedValue({ documentId: "document-1", detached: true });

    await httpApi.legal.listDocuments("agreement-1");
    await httpApi.legal.attachDocument("agreement-1", { documentId: "document-1", documentRole: "signed" });
    await httpApi.legal.detachDocument("agreement-1", "document-1");

    expect(get).toHaveBeenCalledWith("/ncnda/agreement-1/documents");
    expect(post).toHaveBeenCalledWith("/ncnda/agreement-1/documents", { documentId: "document-1", documentRole: "signed" });
    expect(remove).toHaveBeenCalledWith("/ncnda/agreement-1/documents/document-1");
  });

  it("uses the implemented DD deal list endpoint", async () => {
    get.mockResolvedValue({ assessments: [] });
    await httpApi.dueDiligence.listAssessments("deal-1");
    expect(get).toHaveBeenCalledWith("/deals/deal-1/due-diligence/assessments");
  });

  it("uses DD create, detail, progress and response OCC operations", async () => {
    const metrics = {
      totalItems: 68,
      reviewedItems: 1,
      applicableReviewedItems: 1,
      compliantItems: 1,
      partiallyCompliantItems: 0,
      criticalFailures: 0,
      completionRate: 1 / 68,
      complianceRate: 1,
    };
    const publicMetrics = {
      totalItems: 68,
      reviewedItems: 1,
      applicableReviewedItems: 1,
      compliantItems: 1,
      partiallyCompliantItems: 0,
      completionRate: 1 / 68,
      complianceRate: 1,
      criticalFailures: 0,
    };
    post.mockResolvedValue({ assessmentId: "assessment-1", responseCount: 68, revision: 1 });
    get
      .mockResolvedValueOnce({ assessment: { assessmentId: "assessment-1", dealId: "deal-1", templateVersionId: "template-1", status: "not_started", assignedTo: null, createdBy: "user-1", startedAt: null, completedAt: null, summarySnapshot: null, revision: 1, updatedAt: "2026-08-18T00:00:00.000Z" }, items: [], responses: [] })
      .mockResolvedValueOnce({ materialized: metrics, live: metrics, consistent: true });
    patch.mockResolvedValue({ responseId: "response-1", revision: 2, progress: metrics });

    const created = await httpApi.dueDiligence.createAssessment("deal-1", {});
    const assessment = await httpApi.dueDiligence.getAssessment("assessment-1");
    const progress = await httpApi.dueDiligence.getProgress("assessment-1");
    const updated = await httpApi.dueDiligence.updateResponse("assessment-1", "item-1", {
      status: "compliant",
      expectedRevision: 1,
      comments: "Verified against the supplied layout.",
    });

    expect(post).toHaveBeenCalledWith("/deals/deal-1/due-diligence/assessments", {});
    expect(get).toHaveBeenNthCalledWith(1, "/due-diligence/assessments/assessment-1");
    expect(get).toHaveBeenNthCalledWith(2, "/due-diligence/assessments/assessment-1/progress");
    expect(patch).toHaveBeenCalledWith(
      "/due-diligence/assessments/assessment-1/responses/item-1",
      {
        status: "compliant",
        comments: "Verified against the supplied layout.",
        expectedRevision: 1,
      },
    );
    expect(patch.mock.calls[0]![1]).not.toHaveProperty("markReviewed");
    expect(created).toEqual({ assessmentId: "assessment-1", responseCount: 68, revision: 1 });
    expect(assessment).toEqual(expect.objectContaining({
      assessmentId: "assessment-1",
      templateVersionId: "template-1",
      assignedTo: null,
      createdBy: "user-1",
      metrics: null,
    }));
    expect(assessment).not.toHaveProperty("dealTitle");
    expect(progress).toEqual({ materialized: publicMetrics, live: publicMetrics, consistent: true });
    expect(updated).toEqual({ responseId: "response-1", revision: 2, progress: expect.objectContaining({ reviewedItems: 1 }) });
  });

  it("converts a Deal using OCC and idempotency only", async () => {
    const body = { expectedRevision: 7, idempotencyKey: "request-1", projectCode: "CP-001", projectName: "Project One" };
    post.mockResolvedValue({ projectId: "project-1" });
    await httpApi.manager.convertDealToProject("deal-1", body);
    expect(post).toHaveBeenCalledWith("/deals/deal-1/project", body);
    expect(post.mock.calls[0]![1]).not.toHaveProperty("role");
    expect(post.mock.calls[0]![1]).not.toHaveProperty("ownerId");
  });

  it("submits sensitive Deal changes for Manager approval", async () => {
    const body = {
      requestType: "mark_won" as const,
      reason: "Commercial terms accepted by the customer.",
      expectedDealRevision: 7,
      idempotencyKey: "request-won-1",
    };
    post.mockResolvedValue({ requestId: "change-1", status: "pending" });
    await httpApi.dealRequests.create("deal-1", body);
    expect(post).toHaveBeenCalledWith("/deals/deal-1/change-requests", body);
    expect(post.mock.calls[0]![1]).not.toHaveProperty("role");
    expect(post.mock.calls[0]![1]).not.toHaveProperty("ownerId");
  });

  it("uses the Manager queue and OCC decision endpoint", async () => {
    get.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
    post.mockResolvedValue({ requestId: "change-1", status: "approved" });
    await httpApi.dealRequests.listQueue({ status: "pending", limit: 25 });
    await httpApi.dealRequests.decide("change-1", {
      decision: "approve",
      expectedRequestRevision: 2,
      comment: "Reviewed",
    });
    expect(get).toHaveBeenCalledWith("/manager/deal-change-requests", {
      query: { status: "pending", limit: 25 },
    });
    expect(post).toHaveBeenCalledWith("/manager/deal-change-requests/change-1/decision", {
      decision: "approve",
      expectedRequestRevision: 2,
      comment: "Reviewed",
    });
  });

  it("maps Manager project reads and Admin governance reads to approved paths", async () => {
    get.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
    await httpApi.manager.overview();
    await httpApi.manager.team({ from: "2026-01-01T00:00:00.000Z" });
    await httpApi.manager.teamMember("user-1");
    await httpApi.manager.projects({ status: "active", vertical: "gpu", ownerId: "user-1", cursor: "opaque", limit: 10 });
    await httpApi.manager.project("project-1");
    await httpApi.manager.projectReport({ from: "2026-01-01T00:00:00.000Z" });
    await httpApi.admin.overview();
    await httpApi.admin.users({ limit: 10 });
    await httpApi.admin.user("user-1");
    await httpApi.admin.auditLogs({ limit: 10 });
    await httpApi.admin.events({ status: "failed", limit: 10 });
    await httpApi.admin.event("event-1");
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      "/manager/overview", "/manager/team", "/manager/team/user-1", "/manager/projects", "/manager/projects/project-1", "/manager/reports/projects",
      "/admin/overview", "/admin/users", "/admin/users/user-1", "/admin/audit-logs", "/admin/integrations/events", "/admin/integrations/events/event-1",
    ]);
  });

  it("creates and finalizes a secure document upload session", async () => {
    const body = { context: { type: "kyc" as const, resourceId: "case-1" }, originalFilename: "passport.pdf", mimeType: "application/pdf", sizeBytes: 12, sha256Checksum: "a".repeat(64), retentionClass: "kyc" as const, idempotencyKey: "upload-1" };
    post.mockResolvedValueOnce({ documentId: "doc-1", uploadUrl: "https://storage.example/upload", expiresAt: "2026-08-18T00:00:00Z", replayed: false }).mockResolvedValueOnce({ documentId: "doc-1", finalized: true, checksumVerified: false, malwareScanStatus: "pending", encryptionStatus: "pending" });
    await httpApi.documents.createUploadSession(body);
    await httpApi.documents.finalize("doc-1");
    expect(post).toHaveBeenNthCalledWith(1, "/document-upload-sessions", body);
    expect(post).toHaveBeenNthCalledWith(2, "/documents/doc-1/finalize", {});
  });

  it("uses the published DD evidence and document download operations without storage fields", async () => {
    get.mockResolvedValue({ dealId: "deal-1", assessmentId: "assessment-1", templateItemId: "item-1", documents: [] });
    post.mockResolvedValue({ documentId: "document-1" });
    remove.mockResolvedValue({ documentId: "document-1", detached: true });

    await httpApi.dueDiligence.listEvidence("assessment-1", "item-1");
    await httpApi.dueDiligence.attachEvidence("assessment-1", "item-1", {
      documentId: "document-1",
      documentRole: "evidence",
    });
    await httpApi.dueDiligence.detachEvidence("assessment-1", "item-1", "document-1");
    await httpApi.documents.getDocument("document-1");
    await httpApi.documents.createDownloadSession("document-1");

    expect(get).toHaveBeenNthCalledWith(1, "/due-diligence/assessments/assessment-1/responses/item-1/evidence");
    expect(post).toHaveBeenNthCalledWith(1, "/due-diligence/assessments/assessment-1/responses/item-1/evidence", {
      documentId: "document-1",
      documentRole: "evidence",
    });
    expect(remove).toHaveBeenCalledWith("/due-diligence/assessments/assessment-1/responses/item-1/evidence/document-1");
    expect(get).toHaveBeenNthCalledWith(2, "/documents/document-1");
    expect(post).toHaveBeenNthCalledWith(2, "/documents/document-1/download-session", {});
    expect(post.mock.calls[0]![1]).not.toHaveProperty("bucket");
    expect(post.mock.calls[0]![1]).not.toHaveProperty("objectPath");
  });
});
