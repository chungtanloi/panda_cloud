import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAssessment: vi.fn(),
  getProgress: vi.fn(),
  updateResponse: vi.fn(),
}));

vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({
    profile: {
      user: { id: "technical-1", email: "technical@pandacloud.example", fullName: "Tess Technical", userType: "staff", status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      authorization: { isStaff: true, memberships: [{ organizationId: "cloud-panda", role: "technical" }] },
    },
  }),
}));

vi.mock("@/services/api", () => ({
  api: { dueDiligence: mocks },
  normalizeError: (cause: unknown) => cause,
}));

import { AssessmentDetail } from "./AssessmentDetail";

const metrics = {
  totalItems: 1,
  reviewedItems: 0,
  applicableReviewedItems: 0,
  compliantItems: 0,
  partiallyCompliantItems: 0,
  completionRate: 0,
  complianceRate: null,
  criticalFailures: 0,
};

const detail = {
  assessmentId: "assessment-1",
  dealId: "deal-1",
  templateVersionId: "template-1",
  status: "in_progress" as const,
  assignedTo: null,
  createdBy: "technical-1",
  startedAt: "2026-01-01T00:00:00.000Z",
  completedAt: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  revision: 1,
  metrics,
  items: [{ id: "item-1", requirementCode: "IDC-001", position: 1, category: "Power", criticality: "high" as const, question: "Is redundancy documented?", responseType: "text" as const, required: true }],
  responses: [{ responseId: "response-1", assessmentId: "assessment-1", templateItemId: "item-1", status: "not_reviewed" as const, responseValue: null, comments: null, reviewedBy: null, reviewedAt: null, updatedAt: "2026-01-01T00:00:00.000Z", revision: 3 }],
};

describe("AssessmentDetail OCC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAssessment.mockResolvedValue(detail);
    mocks.getProgress.mockResolvedValue({ materialized: metrics, live: metrics, consistent: true });
    mocks.updateResponse.mockRejectedValue({ code: "CONFLICT", status: 409, message: "The response changed on the server.", correlationId: "corr-409" });
  });

  afterEach(cleanup);

  it("reloads after a 409 instead of overwriting a stale DD response", async () => {
    render(<AssessmentDetail assessmentId="assessment-1" />);
    const select = await screen.findByLabelText("Response");
    fireEvent.change(select, { target: { value: "compliant" } });

    await waitFor(() => expect(mocks.updateResponse).toHaveBeenCalledWith("assessment-1", "item-1", {
      status: "compliant",
      expectedRevision: 3,
    }));
    await waitFor(() => expect(mocks.getAssessment).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("alert")).toHaveTextContent("The response changed on the server. (correlation corr-409)");
  });
});
