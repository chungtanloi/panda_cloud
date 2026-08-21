import { describe, expect, it } from "vitest";
import { strongPassword } from "./validation";

describe("strongPassword", () => {
  it("rejects passwords below the required score", () => {
    expect(strongPassword("password1")).toContain("at least 3");
    expect(strongPassword("Password1!")).toBeUndefined();
  });
});
