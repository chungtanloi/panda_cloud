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
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

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
    // `lookup` selects an adapter when its module loads. Re-import it after
    // choosing HTTP so this verifies the shared lookup service's real gateway
    // path rather than its local visual-development fixture.
    vi.stubEnv("NEXT_PUBLIC_API_ADAPTER", "http");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://gateway.example/api/v1");
    vi.resetModules();
    const { lookup } = await import("@/services/lookup");
    const { sessionBridge: httpSessionBridge } = await import("@/services/session");
    const unregister = httpSessionBridge.registerTokenProvider(vi.fn().mockResolvedValue("clerk-session-jwt"));
    const fetchMock = vi.fn().mockResolvedValue(ok({ items: [], nextCursor: null, isDone: true }));
    vi.stubGlobal("fetch", fetchMock);

    await lookup.deals({ q: "Panda", vertical: "gpu", limit: 10 });

    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/api/v1/lookups/deals");
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ q: "Panda", vertical: "gpu", limit: "10" });
    unregister();
  });
});
