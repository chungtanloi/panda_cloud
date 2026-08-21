import { describe, it, expect } from "vitest";
import { api } from "@/services/api";
import { demoSiteInspectionStore } from "@/services/mock/siteInspectionMock";

describe("Site Inspection Mock Adapter & 7 Scenarios Validation", () => {
  it("Scenario 1 (ready): loads published profiles and initializes all tasks", async () => {
    const profiles = await api.siteInspections.getPublishedProfiles();
    expect(profiles.length).toBeGreaterThan(0);
    const first = profiles[0];
    expect(first).toBeDefined();
    if (first) {
      expect(first.market).toBe("US");
      expect(first.criteria.length).toBeGreaterThanOrEqual(8);
    }
  });

  it("Scenario 1 (ready): creates an inspection and initializes capture tasks", async () => {
    const inspection = await api.siteInspections.createInspection({
      organizationId: "org_test_123",
      profileVersionId: "prof_ver_us_dc_electrical_1",
      siteName: "Test Campus West",
      address: {
        streetAddress: "500 Innovation Way",
        city: "San Jose",
        state: "CA",
        postalCode: "95110",
      },
      timeZone: "America/Los_Angeles",
      facilityType: "enterprise_dc",
      operationalState: "commissioned_active",
      objective: "ai_readiness_assessment",
      knownSystems: {
        utilityFeeder: true,
        mainTransformerSwitchgear: true,
        upsSystem: true,
        batteryEnergyStorage: true,
        backupGenerators: true,
        hvacCooling: true,
        fireSuppression: true,
        physicalSecurityAccess: true,
      },
      jurisdiction: {
        isUnknown: false,
        ahjName: "City of San Jose Fire & Building",
      },
      idempotencyKey: "idemp_unit_test_01",
    });

    expect(inspection.id).toBeDefined();
    expect(inspection.status).toBe("collecting");
    expect(inspection.revision).toBe(1);

    const tasks = await api.siteInspections.getTasks(inspection.id);
    expect(tasks.length).toBeGreaterThanOrEqual(8);
  });

  it("Scenario 1 (ready): attaches evidence and calculates completeness projection correctly", async () => {
    demoSiteInspectionStore.resetScenario("ready");

    // Attach remaining conditional task evidence
    await api.siteInspections.attachEvidence("insp_demo_ready", "task_demo_battery_room", {
      documentId: "doc_battery_01",
      fileName: "battery_rack_containment.png",
      fileSizeBytes: 1850000,
      mimeType: "image/png",
    });

    const completeness = await api.siteInspections.getCompleteness("insp_demo_ready");

    expect(completeness.groups.totalTasks).toBeGreaterThan(0);
    expect(completeness.canSubmitNormally).toBe(true);
  });

  it("Scenario 2 (retake): triggers preflight retake required on blurry image", async () => {
    demoSiteInspectionStore.resetScenario("retake");

    const retakeEvidence = await api.siteInspections.attachEvidence(
      "insp_demo_retake",
      "task_demo_util_feeder",
      {
        documentId: "doc_blurry_01",
        fileName: "blurred_nameplate.jpg",
        fileSizeBytes: 1200000,
        mimeType: "image/jpeg",
      },
    );

    expect(retakeEvidence.status).toBe("retake_required");
    expect(retakeEvidence.feedback?.usableQuality).toBe(false);
    expect(retakeEvidence.feedback?.suggestedAction).toBeDefined();
  });

  it("Scenario 3 (critical): derives NOT READY verdict on critical backup generator failure", async () => {
    demoSiteInspectionStore.resetScenario("critical");
    const result = await api.siteInspections.getResult("insp_demo_critical");

    expect(result.overallVerdict).toBe("not_ready");
    expect(result.criticalFindingsCount).toBeGreaterThan(0);

    const failedFinding = result.findings.find((f) => f.provisionalVerdict === "fail");
    expect(failedFinding).toBeDefined();
    expect(failedFinding?.criticality).toBe("critical");
  });

  it("Scenario 4 (override): allows reviewer to resolve and override criterion with audited reason", async () => {
    demoSiteInspectionStore.resetScenario("override");
    const detail = await api.inspectionReview.getDetail("insp_demo_override");
    expect(detail.result.findings.length).toBeGreaterThan(0);

    const target = detail.result.findings[0];
    expect(target).toBeDefined();

    if (target) {
      const updated = await api.inspectionReview.resolveCriterion(
        "insp_demo_override",
        target.criterionId,
        {
          verdict: "pass",
          reason: "Audited manual inspection of secondary breaker photos",
          customerRationale: "Verified and approved by Lead PE.",
          expectedRevision: detail.inspection.revision,
        },
      );

      const modifiedFinding = updated.result.findings.find((f) => f.criterionId === target.criterionId);
      expect(modifiedFinding?.finalVerdict).toBe("pass");
    }
  });

  it("Scenario 5 (missing): handles unavailable items and requires limitation acknowledgement", async () => {
    demoSiteInspectionStore.resetScenario("missing");
    const unavailableTask = await api.siteInspections.markTaskUnavailable(
      "insp_demo_missing",
      "task_demo_cool_redund",
      "Room locked during survey",
    );

    expect(unavailableTask.isUnavailable).toBe(true);
    expect(unavailableTask.status).toBe("unavailable");

    const completeness = await api.siteInspections.getCompleteness("insp_demo_missing");
    expect(completeness.canSubmitNormally).toBe(false);
    expect(completeness.canSubmitWithLimitations).toBe(true);
  });

  it("Scenario 6 (outage): handles simulated provider outage and recovers on retry", async () => {
    demoSiteInspectionStore.resetScenario("outage");
    const status = await api.siteInspections.getAnalysisStatus("insp_demo_outage");

    expect(status.stage).toBe("retryable_failed");
    expect(status.isRetryable).toBe(true);

    const retried = await api.siteInspections.retryAnalysis("insp_demo_outage");
    expect(retried.stage).toBe("completed");
  });

  it("Scenario 7 (conflict): rejects concurrent submission and claim with 409 REVISION_CONFLICT", async () => {
    demoSiteInspectionStore.resetScenario("conflict");

    await expect(
      api.inspectionReview.claimInspection("insp_demo_conflict", {
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "REVISION_CONFLICT",
    });
  });
});
