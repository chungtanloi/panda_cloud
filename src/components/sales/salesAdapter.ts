import type { DataAdapter } from "@kanban/library";
import type { DealCard, DealCardPatch, DealStage } from "@/models/sales";
import { api } from "@/services/api";

/**
 * Bridges the Kanban library's `DataAdapter` onto our `api.sales` service.
 *
 * This is the only place the two type systems meet. It is deliberately thin:
 * `DealCard` was defined to satisfy `BaseCard` exactly (id, title, columnId,
 * order, createdAt, updatedAt), so no field mapping happens here — a mapping
 * layer is a place for the two shapes to drift apart silently.
 *
 * Because everything routes through `api.sales`, the board works against the
 * mock adapter today and the real backend after the usual one-line env change.
 * The library's own `createFetchApiAdapter` is intentionally NOT used: it would
 * bypass our HTTP client and therefore our auth header, token refresh, timeout
 * and error normalisation.
 *
 * `createCard` is omitted from the returned object. Cards are created by the
 * backend alongside the submission that produced them; the library treats a
 * missing `createCard` as "creation not permitted" and hides the affordance.
 */
export function createSalesAdapter(): DataAdapter<DealCard> {
  return {
    fetchColumns: () => api.sales.listColumns(),

    fetchCards: () => api.sales.listCards(),

    // Lets the detail panel load the heavier record on open rather than
    // shipping notes and full answers with the list.
    fetchCardDetail: (id) => api.sales.getCard(id),

    createCard: (data) => api.sales.createCard(data as Parameters<typeof api.sales.createCard>[0]),

    updateCard: (id, data) => api.sales.updateCard(id, data as DealCardPatch),

    moveCard: (cardId, newColumnId, newOrder) =>
      api.sales.moveCard(cardId, newColumnId as DealStage, newOrder),

    deleteCard: (id) => api.sales.deleteCard(id),
  };
}
