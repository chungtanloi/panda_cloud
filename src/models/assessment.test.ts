import { describe, expect, it } from "vitest";
import { toLandIntakeData, type AssessmentSubmission } from "./assessment";

describe("toLandIntakeData", () => {
  it("normalizes the five-step Land Owner submission without losing fields", () => {
    const submission: AssessmentSubmission = {
      landProfile: { areaAcres: 12, landUse: "industrial", location: "Can Tho" },
      powerCapacity: {
        gridTier: "10_50mw",
        substationDistance: "under_1km",
        voltage: "66_138kv",
      },
      energySource: { energyMix: "hybrid", ppaAvailable: false },
      facilities: {
        buildingSqft: 0,
        buildingClassification: "none",
        fiberProximity: "unknown",
      },
    };

    expect(toLandIntakeData(submission)).toEqual({
      areaAcres: 12,
      landUse: "industrial",
      location: "Can Tho",
      gridTier: "10_50mw",
      substationDistance: "under_1km",
      voltage: "66_138kv",
      energyMix: "hybrid",
      ppaAvailable: false,
      buildingSqft: 0,
      buildingClassification: "none",
      fiberProximity: "unknown",
    });
  });
});
