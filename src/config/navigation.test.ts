import { describe, expect, it } from "vitest";
import { FOOTER_NAV, MARKETING_NAV } from "./navigation";

describe("marketing navigation", () => {
  it("exposes About Us last in both primary and footer navigation", () => {
    expect(MARKETING_NAV.at(-1)).toEqual({ label: "About Us", href: "/about" });
    expect(FOOTER_NAV.at(-1)).toEqual({ label: "About Us", href: "/about" });
  });
});
