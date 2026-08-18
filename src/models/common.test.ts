import { describe, expect, it } from "vitest";
import { formatMinorUnits } from "./common";

describe("formatMinorUnits", () => {
  it("formats a value beyond Number.MAX_SAFE_INTEGER without rounding it", () => {
    expect(formatMinorUnits("900719925474099312345", "USD")).toBe("$9,007,199,254,740,993,123.45");
  });
});
