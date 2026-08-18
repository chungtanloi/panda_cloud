import { describe, expect, it } from "vitest";
import { lookup } from "./lookup";
import {
  LOOKUP_MIN_QUERY_LENGTH,
  isLookupForbidden,
  isLookupQueryReady,
} from "@/models/lookup";

/**
 * The lookup mock deliberately enforces the gateway's own guards rather than
 * being permissive, so a query that passes locally passes for real. The two
 * that matter: `q` must be at least two characters, and a contacts lookup
 * without an `organizationId` is a 400.
 */

describe("isLookupQueryReady", () => {
  it("requires the backend's minimum length, ignoring surrounding space", () => {
    expect(isLookupQueryReady("")).toBe(false);
    expect(isLookupQueryReady("n")).toBe(false);
    expect(isLookupQueryReady("  n  ")).toBe(false);
    expect(isLookupQueryReady("no")).toBe(true);
    expect(LOOKUP_MIN_QUERY_LENGTH).toBe(2);
  });
});

describe("isLookupForbidden", () => {
  /**
   * `deals` and `contacts` resolve the Kanban scope, which fails closed for
   * legal, compliance and technical. Those roles get REQUIRES_RESOURCE_SCOPE,
   * not a plain FORBIDDEN, so both must be recognised or the picker will retry
   * a search that can never succeed.
   */
  it("recognises both shapes of a role rejection", () => {
    expect(isLookupForbidden(403, "FORBIDDEN")).toBe(true);
    expect(isLookupForbidden(undefined, "REQUIRES_RESOURCE_SCOPE")).toBe(true);
    expect(isLookupForbidden(403, undefined)).toBe(true);
  });

  it("does not mistake other failures for a role rejection", () => {
    expect(isLookupForbidden(500, "INTERNAL_ERROR")).toBe(false);
    expect(isLookupForbidden(400, "VALIDATION_ERROR")).toBe(false);
    expect(isLookupForbidden(undefined, "NETWORK_ERROR")).toBe(false);
  });
});

describe("mock lookup — deals", () => {
  it("returns nothing for a query the gateway would reject", async () => {
    const page = await lookup.deals({ q: "n" });
    expect(page.items).toEqual([]);
  });

  it("matches on deal title", async () => {
    const page = await lookup.deals({ q: "Northwind" });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items[0]!.title).toMatch(/Northwind/i);
  });

  it("is case-insensitive", async () => {
    const upper = await lookup.deals({ q: "HELIO" });
    const lower = await lookup.deals({ q: "helio" });
    expect(upper.items.map((item) => item.dealId)).toEqual(lower.items.map((item) => item.dealId));
  });

  it("returns a shape with no opaque id on display", async () => {
    const page = await lookup.deals({ q: "Northwind" });
    const item = page.items[0]!;
    expect(item.dealId).toBeTruthy();
    expect(item.title).toBeTruthy();
    expect(item.organizationName).toBeTruthy();
  });

  it("returns a single complete page — the mock does not paginate", async () => {
    const page = await lookup.deals({ q: "Northwind" });
    expect(page.nextCursor).toBeNull();
    expect(page.isDone).toBe(true);
  });
});

describe("mock lookup — organizations and owners", () => {
  it("finds an organization by display name", async () => {
    const page = await lookup.organizations({ q: "Helio" });
    expect(page.items.map((item) => item.organizationId)).toContain("org_helio");
  });

  it("finds an owner by full name", async () => {
    const page = await lookup.owners({ q: "Ada" });
    expect(page.items[0]!.fullName).toMatch(/Ada/);
  });
});

describe("mock lookup — contacts", () => {
  it("is scoped to one organization, as the backend requires", async () => {
    const inScope = await lookup.contacts({ q: "Erik", organizationId: "org_northwind" });
    const outOfScope = await lookup.contacts({ q: "Erik", organizationId: "org_helio" });
    expect(inScope.items.length).toBe(1);
    expect(outOfScope.items.length).toBe(0);
  });
});
