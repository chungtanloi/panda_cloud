import { describe, expect, it } from "vitest";
import { evaluateReadiness, lanePercent, laneNextAction } from "./readiness";
import type { DdAssessmentSummary } from "@/models/dueDiligence";
import type { KycCase } from "@/models/kyc";
import type { NcndaAgreement } from "@/models/ncnda";

/**
 * `evaluateReadiness` is the single source of truth for "is this deal clear to
 * hand over". Before it existed the same question was answered three ways —
 * `DealReadinessView` took the newest record by `updatedAt`, `DealHandoffPanel`
 * took `items[0]` — so one deal could read Ready in one place and Needs
 * attention in another.
 *
 * These tests pin the parts of the rule that are easy to regress by accident:
 * the record-selection rule, and the three guards that are stricter than a
 * naive status equality check.
 */

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();

function agreement(overrides: Partial<NcndaAgreement> = {}): NcndaAgreement {
  return {
    agreementId: "ncnda_1",
    dealId: "deal_1",
    dealTitle: "Deal one",
    counterpartyOrganizationId: "org_1",
    counterpartyName: "Org one",
    status: "active",
    effectiveDate: "2026-01-01",
    expiresAt: null,
    sentAt: null,
    signedAt: null,
    countersignedAt: null,
    ownerId: "user_1",
    ownerName: "Owner one",
    notes: null,
    updatedAt: iso(-1),
    revision: 1,
    ...overrides,
  };
}

function kyc(overrides: Partial<KycCase> = {}): KycCase {
  return {
    caseId: "kyc_1",
    dealId: "deal_1",
    dealTitle: "Deal one",
    subject: { kind: "organization", organizationId: "org_1", displayName: "Org one" },
    provider: null,
    providerCaseId: null,
    status: "approved",
    riskLevel: "low",
    assignedToId: null,
    assignedToName: null,
    rejectionReason: null,
    submittedAt: null,
    verifiedAt: iso(-10),
    expiresAt: iso(30),
    updatedAt: iso(-1),
    revision: 1,
    ...overrides,
  } as KycCase;
}

function assessment(overrides: Partial<DdAssessmentSummary> = {}): DdAssessmentSummary {
  return {
    id: "dd_1",
    dealId: "deal_1",
    dealTitle: "Deal one",
    organizationName: "Org one",
    templateVersionLabel: "v1",
    status: "completed",
    updatedAt: iso(-1),
    revision: 1,
    metrics: {
      totalItems: 68,
      reviewedItems: 68,
      completionRate: 1,
      complianceRate: 1,
      criticalFailures: 0,
    },
    ...overrides,
  };
}

const ready = () => ({
  agreements: [agreement()],
  cases: [kyc()],
  assessments: [assessment()],
});

describe("evaluateReadiness — overall", () => {
  it("is ready only when all three lanes are ready", () => {
    const result = evaluateReadiness(ready());
    expect(result.overall).toBe("ready");
    expect(result.readyCount).toBe(3);
    expect(result.nextAction).toMatch(/convert/i);
  });

  it("reports missing lanes rather than treating absence as ready", () => {
    const result = evaluateReadiness({ agreements: [], cases: [], assessments: [] });
    expect(result.lanes).toEqual({ ncnda: "missing", kyc: "missing", dd: "missing" });
    expect(result.overall).toBe("attention");
    expect(result.readyCount).toBe(0);
  });

  it("lets one blocked lane block the whole deal", () => {
    const result = evaluateReadiness({ ...ready(), cases: [kyc({ status: "rejected" })] });
    expect(result.overall).toBe("blocked");
    expect(result.worstLane).toBe("kyc");
    expect(result.blocker).toMatch(/blocked/i);
  });

  it("ranks blocked above not-started above in-progress when choosing the worst lane", () => {
    const result = evaluateReadiness({
      agreements: [],                                        // missing
      cases: [kyc({ status: "under_review", verifiedAt: null })], // attention
      assessments: [assessment({ status: "cancelled" })],    // blocked
    });
    expect(result.worstLane).toBe("dd");
  });
});

describe("evaluateReadiness — record selection", () => {
  /**
   * The rule is "newest by updatedAt", fixed deliberately: the list endpoints
   * promise no ordering, so reading items[0] is reading an implementation
   * detail. A backend that returns oldest-first must not flip the verdict.
   */
  it("judges the newest record, not the first one returned", () => {
    const result = evaluateReadiness({
      agreements: [
        agreement({ agreementId: "old", status: "rejected", updatedAt: iso(-9) }),
        agreement({ agreementId: "new", status: "active", updatedAt: iso(-1) }),
      ],
      cases: [kyc()],
      assessments: [assessment()],
    });
    expect(result.current.ncnda?.agreementId).toBe("new");
    expect(result.lanes.ncnda).toBe("ready");
  });
});

describe("evaluateReadiness — guards stricter than status equality", () => {
  it("does not accept an approved KYC that was never verified", () => {
    const result = evaluateReadiness({ ...ready(), cases: [kyc({ verifiedAt: null })] });
    expect(result.lanes.kyc).toBe("attention");
  });

  it("does not accept an approved KYC whose verification has lapsed", () => {
    const result = evaluateReadiness({ ...ready(), cases: [kyc({ expiresAt: iso(-1) })] });
    expect(result.lanes.kyc).toBe("attention");
  });

  it("blocks on a prohibited risk level whatever the status says", () => {
    const result = evaluateReadiness({ ...ready(), cases: [kyc({ riskLevel: "prohibited" })] });
    expect(result.lanes.kyc).toBe("blocked");
    expect(result.overall).toBe("blocked");
  });

  it("blocks a fully reviewed assessment that still has a critical failure", () => {
    const result = evaluateReadiness({
      ...ready(),
      assessments: [
        assessment({ metrics: { totalItems: 68, reviewedItems: 68, completionRate: 1, complianceRate: 0.9, criticalFailures: 1 } }),
      ],
    });
    expect(result.lanes.dd).toBe("blocked");
  });

  it("treats every non-active NCNDA status as unfinished", () => {
    for (const status of ["drafting", "sent", "received", "under_review", "signed", "countersigned"] as const) {
      expect(evaluateReadiness({ ...ready(), agreements: [agreement({ status })] }).lanes.ncnda).toBe(
        "attention",
      );
    }
  });
});

describe("lanePercent", () => {
  it("uses the assessment's real completion rate rather than a fixed bar", () => {
    const result = evaluateReadiness({
      ...ready(),
      assessments: [
        assessment({ status: "in_progress", metrics: { totalItems: 68, reviewedItems: 34, completionRate: 0.5, complianceRate: null, criticalFailures: 0 } }),
      ],
    });
    expect(lanePercent("dd", result)).toBe(50);
  });

  it("is 0 for a lane nobody has started", () => {
    const result = evaluateReadiness({ agreements: [], cases: [], assessments: [] });
    expect(lanePercent("ncnda", result)).toBe(0);
  });
});

describe("laneNextAction", () => {
  it("names the number of reviewed requirements while an assessment is in progress", () => {
    const result = evaluateReadiness({
      ...ready(),
      assessments: [
        assessment({ status: "in_progress", metrics: { totalItems: 68, reviewedItems: 34, completionRate: 0.5, complianceRate: null, criticalFailures: 0 } }),
      ],
    });
    expect(laneNextAction("dd", result.current)).toContain("34 of 68");
  });
});
