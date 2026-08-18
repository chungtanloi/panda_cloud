import { describe, expect, it } from "vitest";
import {
  formatDaysInStatus,
  transitionRequiresEffectiveDate,
  transitionRequiresReason,
} from "./legalQueue";
import { NCNDA_STATUSES } from "./ncnda";

/**
 * Pure helpers the transition form uses to ask for the right fields before a
 * round trip. They mirror backend rules; the backend enforces them regardless,
 * so what matters here is that the mirror does not drift into asking for more
 * than the backend wants, or less.
 */

describe("transitionRequiresEffectiveDate", () => {
  it("is true only for active", () => {
    for (const status of NCNDA_STATUSES) {
      expect(transitionRequiresEffectiveDate(status)).toBe(status === "active");
    }
  });
});

describe("transitionRequiresReason", () => {
  it("is true only for the two terminal statuses a human chooses", () => {
    // `expired` is terminal too but is reached by the passage of time, not by a
    // decision, so there is nobody to ask for a reason.
    for (const status of NCNDA_STATUSES) {
      expect(transitionRequiresReason(status)).toBe(
        status === "rejected" || status === "cancelled",
      );
    }
  });
});

describe("formatDaysInStatus", () => {
  it("renders an em dash for an unmeasurable stall, never a zero", () => {
    expect(formatDaysInStatus(null)).toBe("—");
  });

  it("distinguishes today from one day", () => {
    expect(formatDaysInStatus(0)).toBe("today");
    expect(formatDaysInStatus(1)).toBe("1 day");
    expect(formatDaysInStatus(11)).toBe("11 days");
  });
});
