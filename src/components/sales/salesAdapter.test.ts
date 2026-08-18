import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/services/http";
import type { SalesService } from "@/services/contracts";
import type {
  SalesCardDetailDto,
  SalesCardListQuery,
  SalesCardMoveRequest,
  SalesCardPage,
  SalesCardUpdateRequest,
  SalesColumnListResponse,
} from "@/models/sales";
import { mockDealCards, mockSalesColumns } from "@/services/mock/salesFixtures";
import { createSalesAdapter } from "./salesAdapter";

/**
 * Fake service: implements the 5-op wire contract and records every call, so
 * the tests assert the adapter's exact behaviour without any HTTP layer.
 *
 * The default listCards emulates the real list endpoint: column-filtered,
 * detail-invisible fields stripped (the wire list payload really has no
 * `createdAt`/`description`/…).
 */
function makeService(overrides: Partial<SalesService> = {}) {
  const slim = (card: SalesCardDetailDto) => {
    const { description, lostReason, wonAt, projectId, createdAt, createdBy, archivedAt, ...rest } = card;
    return rest;
  };
  // Deliberately un-annotated so `.mock` stays typed on the returned vi.fns;
  // structural typing satisfies SalesService at the call sites.
  const service = {
    listColumns: vi.fn(async (): Promise<SalesColumnListResponse> => ({ columns: mockSalesColumns })),
    listCards: vi.fn(async (query: SalesCardListQuery): Promise<SalesCardPage> => ({
      items: mockDealCards.filter((card) => card.columnId === query.columnId).map(slim),
      nextCursor: null,
    })),
    getCard: vi.fn(async (id: string): Promise<SalesCardDetailDto> => {
      const card = mockDealCards.find((deal) => deal.dealId === id);
      if (!card) throw new ApiError({ code: "NOT_FOUND", message: "missing", status: 404 });
      return card;
    }),
    createCard: vi.fn(async (): Promise<{ dealId: string; revision: number }> => ({ dealId: "deal_new", revision: 1 })),
    updateCard: vi.fn(async (): Promise<{ dealId: string; revision: number }> => ({ dealId: "deal_05", revision: 2 })),
    moveCard: vi.fn(async (): Promise<{ dealId: string; status: "won"; revision: number }> => ({ dealId: "deal_05", status: "won", revision: 2 })),
    ...overrides,
  };
  return service;
}

describe("createSalesAdapter — columns", () => {
  it("unwraps the list response and maps opaque ids to board columns", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);

    const columns = await adapter.fetchColumns();

    expect(columns).toHaveLength(10);
    expect(columns[0]).toMatchObject({ id: "col_new", title: "New", order: 1, color: "#94a3b8" });
    // Opaque id is preserved verbatim — never re-derived.
    expect(columns[7]).toMatchObject({ id: "col_won", title: "Won", order: 8 });
    // Null color is dropped rather than serialised.
    expect(columns.every((column) => column.color === undefined || typeof column.color === "string")).toBe(true);
  });
});

describe("createSalesAdapter — cards", () => {
  it("calls listCards with a columnId and pagination for every column", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);

    await adapter.fetchCards();

    for (const column of mockSalesColumns) {
      expect(service.listCards).toHaveBeenCalledWith({
        columnId: column.columnId,
        limit: 100,
        cursor: undefined,
      });
    }
  });

  it("flattens an {items, nextCursor} page and keeps backend order", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);

    const cards = await adapter.fetchCards();

    const colNew = cards.filter((card) => card.columnId === "col_new");
    expect(colNew.map((card) => card.id)).toEqual(["deal_05"]);
    expect(colNew[0]!.order).toBe(0);
  });

  it("follows nextCursor across pages and keeps a running order", async () => {
    const first = mockDealCards[0]!;
    const second = mockDealCards[1]!;
    const service = makeService({
      listCards: vi.fn(async (query: SalesCardListQuery): Promise<SalesCardPage> => {
        if (query.cursor === "c2") return { items: [second], nextCursor: null };
        return { items: [first], nextCursor: "c2" };
      }),
    });
    const adapter = createSalesAdapter(service);

    const cards = await adapter.fetchCards();

    // The adapter followed every column's cursor to its second page.
    expect(service.listCards).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: "c2" }),
    );
    expect(cards.map((card) => card.id)).toContain(first.dealId);
    expect(cards.map((card) => card.id)).toContain(second.dealId);
    // Running order is assigned as pages are consumed.
    const mapped = cards.find((card) => card.id === first.dealId);
    const mappedSecond = cards.find((card) => card.id === second.dealId);
    expect(mapped?.order).toBe(0);
    expect(mappedSecond?.order).toBe(1);
  });

  it("aggregates cards across all columns", async () => {
    const service = makeService({
      listCards: vi.fn(async (query) => ({
        items: mockDealCards.filter((card) => card.columnId === query.columnId),
        nextCursor: null,
      })),
    });
    const adapter = createSalesAdapter(service);

    const cards = await adapter.fetchCards();

    expect(cards.length).toBe(mockDealCards.length);
    // One card landed in each of its backend columns.
    for (const column of mockSalesColumns) {
      expect(cards.filter((card) => card.columnId === column.columnId).length).toBe(
        mockDealCards.filter((card) => card.columnId === column.columnId).length,
      );
    }
  });

  it("maps the DTO onto the Kanban-facing card shape", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);

    const cards = await adapter.fetchCards();
    const card = cards.find((item) => item.id === "deal_05")!;

    expect(card).toMatchObject({
      id: "deal_05",
      title: "Kestrel AI — general enquiry",
      columnId: "col_new",
      order: 0,
      status: "open",
      vertical: "gpu",
      priority: "low",
      estimatedValueMinor: null,
      currency: null,
      probabilityPercent: null,
      expectedCloseDate: null,
      revision: 1,
    });
    // List payload carries no createdAt — the adapter falls back to updatedAt.
    expect(card.createdAt).toBe(card.updatedAt);
  });

  it("populates the real createdAt from the detail fetch", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);

    const detail = await adapter.fetchCardDetail!("deal_01");

    expect(detail.id).toBe("deal_01");
    expect(detail.description).toBe("Greenfield 120ha parcel with existing substation proximity.");
    // detail.createdAt is the backend's real value, distinct from updatedAt.
    expect(detail.createdAt).not.toBe(detail.updatedAt);
  });
});

describe("createSalesAdapter — update", () => {
  it("sends the cached expectedRevision with the patch", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);
    await adapter.fetchCards(); // warms the revision cache

    await adapter.updateCard("deal_05", { title: "Renamed deal" });

    expect(service.updateCard).toHaveBeenCalledWith(
      "deal_05",
      expect.objectContaining({ expectedRevision: 1, title: "Renamed deal" }),
    );
  });

  it("never sends columnId or order in an update", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);
    await adapter.fetchCards();

    await adapter.updateCard("deal_05", {
      title: "Renamed",
      columnId: "col_won",
      order: 99,
    });

    const body = vi.mocked(service.updateCard).mock.calls[0]?.[1] as SalesCardUpdateRequest;
    expect(body).not.toHaveProperty("columnId");
    expect(body).not.toHaveProperty("order");
  });

  it("reconciles with the fresh detail after the PATCH", async () => {
    const service = makeService({
      updateCard: vi.fn(async () => ({ dealId: "deal_05", revision: 2 })),
      getCard: vi.fn(async (id: string): Promise<SalesCardDetailDto> => {
        const card = { ...mockDealCards.find((deal) => deal.dealId === id)! };
        return { ...card, title: "Renamed deal", revision: 2 };
      }),
    });
    const adapter = createSalesAdapter(service);
    await adapter.fetchCards();

    const result = await adapter.updateCard("deal_05", { title: "Renamed deal" });

    expect(result.title).toBe("Renamed deal");
    expect(result.revision).toBe(2);
  });

  it("cold-starts the revision from a detail read when the cache is empty", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);

    await adapter.updateCard("deal_05", { priority: "high" });

    expect(service.getCard).toHaveBeenCalledWith("deal_05");
    expect(service.updateCard).toHaveBeenCalledWith(
      "deal_05",
      expect.objectContaining({ expectedRevision: 1, priority: "high" }),
    );
  });
});

describe("createSalesAdapter — move", () => {
  it("sends toColumnId and expectedRevision, never a client order", async () => {
    const service = makeService();
    const adapter = createSalesAdapter(service);
    await adapter.fetchCards();

    // Library calls moveCard(cardId, newColumnId, newOrder) — the third arg
    // must be ignored as the backend owns ordering.
    await adapter.moveCard("deal_05", "col_won", 42);

    const body = vi.mocked(service.moveCard).mock.calls[0]?.[1] as SalesCardMoveRequest;
    expect(body).toEqual({ toColumnId: "col_won", expectedRevision: 1 });
  });

  it("reconciles with the moved card's fresh detail", async () => {
    const service = makeService({
      moveCard: vi.fn(async () => ({ dealId: "deal_05", status: "won" as const, revision: 2 })),
      getCard: vi.fn(async (id: string): Promise<SalesCardDetailDto> => {
        const card = { ...mockDealCards.find((deal) => deal.dealId === id)! };
        return { ...card, columnId: "col_won", status: "won" as const, revision: 2, updatedAt: card.updatedAt };
      }),
    });
    const adapter = createSalesAdapter(service);
    await adapter.fetchCards();

    const result = await adapter.moveCard("deal_05", "col_won");

    expect(result.columnId).toBe("col_won");
    expect(result.status).toBe("won");
    expect(result.revision).toBe(2);
  });

  it("does NOT blindly retry on a 409 — refreshes its cache and rethrows", async () => {
    const conflict = new ApiError({
      code: "CONFLICT",
      message: "This deal changed on the server. Reloading the latest version.",
      status: 409,
    });
    const service = makeService({
      moveCard: vi.fn(async () => {
        throw conflict;
      }),
    });
    const adapter = createSalesAdapter(service);
    await adapter.fetchCards();

    await expect(adapter.moveCard("deal_05", "col_won")).rejects.toBe(conflict);
    // Exactly one POST — the 409 was surfaced, not retried.
    expect(service.moveCard).toHaveBeenCalledTimes(1);
    // The adapter refetched the detail so a later user-initiated retry starts
    // from a current revision.
    expect(service.getCard).toHaveBeenCalledWith("deal_05");
  });
});

describe("createSalesAdapter — wire surface", () => {
  it("does not expose createCard (no POST /sales/cards in the contract)", () => {
    const adapter = createSalesAdapter(makeService());
    expect(adapter.createCard).toBeUndefined();
  });

  it("does not expose deleteCard (no DELETE /sales/cards in the contract)", () => {
    const adapter = createSalesAdapter(makeService());
    expect(adapter.deleteCard).toBeUndefined();
  });
});
