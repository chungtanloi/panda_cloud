import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, http } from "@/services/http";

/**
 * Guards against the client ever mislabelling a real backend error as a
 * network failure: a 4xx/5xx with a standard error body MUST surface the
 * backend's errorCode, never NETWORK_ERROR.
 */
describe("http error normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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
});
