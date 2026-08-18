import { afterEach, describe, expect, it, vi } from "vitest";
import { httpApi } from "@/services/http-impl";
import { sessionBridge } from "@/services/session";

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", "X-Correlation-Id": "gateway-correlation" },
  });
}

describe("authenticated Sales HTTP client", () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it("attaches the current Clerk session token for a Sales request without persisting it", async () => {
    const unregister = sessionBridge.registerTokenProvider(vi.fn().mockResolvedValue("clerk-session-jwt"));
    const fetchMock = vi.fn().mockResolvedValue(ok({ columns: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await httpApi.sales.listColumns();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toMatchObject({ Authorization: "Bearer clerk-session-jwt" });
    expect(init.headers).toHaveProperty("X-Correlation-Id");
    unregister();
  });

  it("sends no Bearer header when Clerk has no current session", async () => {
    const unregister = sessionBridge.registerTokenProvider(vi.fn().mockResolvedValue(null));
    const fetchMock = vi.fn().mockResolvedValue(ok({ columns: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await httpApi.sales.listColumns();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty("Authorization");
    unregister();
  });

  it("forwards bounded lookup queries through the typed lookup operation", async () => {
    const unregister = sessionBridge.registerTokenProvider(vi.fn().mockResolvedValue("clerk-session-jwt"));
    const fetchMock = vi.fn().mockResolvedValue(ok({ items: [], nextCursor: null, isDone: true }));
    vi.stubGlobal("fetch", fetchMock);

    await httpApi.lookup.deals({ q: "Panda", vertical: "gpu", limit: 10 });

    expect(fetchMock.mock.calls[0]?.[0]).toContain("/lookups/deals?q=Panda&vertical=gpu&limit=10");
    unregister();
  });
});
