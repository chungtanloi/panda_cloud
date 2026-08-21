import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, http } from "@/services/http";
import { sessionBridge } from "@/services/session";

/**
 * Guards against the client ever mislabelling a real backend error as a
 * network failure: a 4xx/5xx with a standard error body MUST surface the
 * backend's errorCode, never NETWORK_ERROR.
 */
describe("http error normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hands authenticated 401 responses to the session recovery handler", async () => {
    const recover = vi.fn().mockResolvedValue(undefined);
    const unregister = sessionBridge.registerUnauthorizedHandler(recover);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ errorCode: "UNAUTHENTICATED", message: "Sign in again.", details: [] }),
      headers: new Headers(),
    }));
    await expect(http.get("/private", { anonymous: false })).rejects.toMatchObject({ status: 401 });
    expect(recover).toHaveBeenCalledTimes(1);
    unregister();
  });

  it("normalises a 409 into CONFLICT with the backend message", async () => {
    const response = {
      ok: false,
      status: 409,
      json: async () => ({
        errorCode: "CONFLICT",
        message: "This deal changed on the server. Reloading the latest version.",
        details: [],
      }),
      headers: new Headers({ "x-correlation-id": "test-correlation" }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(http.get("/api/v1/sales/cards/deal_01", { anonymous: true })).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
      correlationId: "test-correlation",
      message: "This deal changed on the server. Reloading the latest version.",
    });
  });

  it("normalises a 404 into NOT_FOUND", async () => {
    const response = {
      ok: false,
      status: 404,
      json: async () => ({ errorCode: "NOT_FOUND", message: "Deal not found.", details: [] }),
      headers: new Headers(),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(http.get("/api/v1/sales/cards/nope", { anonymous: true })).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("distinguishes a real network failure from an HTTP error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    await expect(http.get("/api/v1/sales/columns", { anonymous: true })).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });

    // And it is an ApiError, so callers can branch on the code.
    await expect(
      http.get("/api/v1/sales/columns", { anonymous: true }).catch((error) => {
        expect(error).toBeInstanceOf(ApiError);
        throw error;
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("retries transient GET failures but does not retry writes", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ message: "busy", details: [] }), headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ value: "ok" }), headers: new Headers() });
    vi.stubGlobal("fetch", fetchMock);
    await expect(http.get<{ value: string }>("/health", { anonymous: true })).resolves.toEqual({ value: "ok" });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockReset().mockResolvedValue({ ok: false, status: 503, json: async () => ({ message: "busy", details: [] }), headers: new Headers() });
    await expect(http.post("/submit", {}, { anonymous: true })).rejects.toMatchObject({ status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
