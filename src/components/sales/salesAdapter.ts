import type { DataAdapter } from "@kanban/library";
import type { SalesCard, SalesCardDto, SalesCardDetailDto, SalesCardUpdateRequest } from "@/models/sales";
import type { SalesService } from "@/services/contracts";
import { api } from "@/services/api";
import { ApiError } from "@/services/http";

/**
 * Structural stand-in for the library's `Column` interface. The library's
 * dist types re-export `Column` as a component value only, so importing the
 * interface by name fails at typecheck — this structural twin is assignable to
 * it (the library's extra fields are optional).
 */
export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  color?: string;
}

/** A wire card as the list or the detail endpoint returns it. */
type WireCard = SalesCardDto & Partial<Omit<SalesCardDetailDto, keyof SalesCardDto>>;

/**
 * Bridges the Kanban library's `DataAdapter` onto our `api.sales` service.
 *
 * This is the only place the two type systems meet. The backend wire shapes
 * (`SalesColumnDto`, `SalesCardDto`, …) and the Kanban shapes (`Column`,
 * `SalesCard`) are deliberately different, so every field is mapped here and
 * nowhere else:
 *
 *   columnId -> Column.id   name -> Column.title   position -> Column.order
 *   color    -> Column.color
 *   dealId   -> SalesCard.id   title -> SalesCard.title
 *   columnId -> SalesCard.columnId   updatedAt -> SalesCard.updatedAt
 *
 * The library-only visual `order` is derived from the card's position inside
 * the backend-returned column page so the board renders the backend's own
 * ordering. It is NEVER sent back: the backend owns ordering and both the
 * update and move operations ignore it.
 *
 * The list payload has no `createdAt`, so `createdAt` is a documented
 * technical fallback to `updatedAt`; the real value arrives with the detail
 * fetch (`getCard`).
 */

const PAGE_SIZE = 100;

export interface SalesCardCacheEntry {
  revision: number;
  order: number;
  updatedAt: string;
}

/** Maps a wire column into the library `Column` shape. */
export function mapColumnDto(column: {
  columnId: string;
  name: string;
  position: number;
  color: string | null;
}): BoardColumn {
  return {
    id: column.columnId,
    title: column.name,
    order: column.position,
    color: column.color ?? undefined,
  };
}

/** Maps a wire card into the Kanban-facing `SalesCard` shape. */
export function mapCardDto(dto: WireCard, order: number): SalesCard {
  return {
    id: dto.dealId,
    title: dto.title,
    columnId: dto.columnId,
    order,
    // List payload has no createdAt — see header comment.
    createdAt: dto.createdAt ?? dto.updatedAt,
    updatedAt: dto.updatedAt,

    organizationId: dto.organizationId,
    ownerId: dto.ownerId,
    status: dto.status,
    vertical: dto.vertical,
    priority: dto.priority,
    estimatedValueMinor: dto.estimatedValueMinor,
    currency: dto.currency,
    probabilityPercent: dto.probabilityPercent,
    expectedCloseDate: dto.expectedCloseDate,
    lastContactAt: dto.lastContactAt,
    lastContactMethod: dto.lastContactMethod,
    revision: dto.revision,

    description: dto.description,
    lostReason: dto.lostReason,
    wonAt: dto.wonAt,
    projectId: dto.projectId,
    createdBy: dto.createdBy,
    archivedAt: dto.archivedAt,
  };
}

/** The mutable wire fields `updateCard` translates from a Kanban patch. */
const UPDATEABLE_FIELDS = [
  "title",
  "description",
  "priority",
  "estimatedValueMinor",
  "currency",
  "probabilityPercent",
  "expectedCloseDate",
] as const;

export function createSalesAdapter(service: SalesService = api.sales): DataAdapter<SalesCard> {
  /**
   * Shared in-flight column load. `useKanban.refresh()` calls `fetchColumns()`
   * and `fetchCards()` concurrently, so both must await the same request rather
   * than issuing it twice. Cached for the adapter's lifetime; the board
   * recreates the adapter on remount, and columns are low-churn.
   */
  let columnsPromise: Promise<BoardColumn[]> | null = null;
  const cardCache = new Map<string, SalesCardCacheEntry>();

  function fetchColumnsOnce(): Promise<BoardColumn[]> {
    if (!columnsPromise) {
      columnsPromise = service.listColumns().then(({ columns }) => columns.map(mapColumnDto));
    }
    return columnsPromise;
  }

  function updateCache(dto: WireCard, order?: number) {
    cardCache.set(dto.dealId, {
      revision: dto.revision,
      order: order ?? cardCache.get(dto.dealId)?.order ?? 0,
      updatedAt: dto.updatedAt,
    });
  }

  async function fetchColumnCards(columnId: string, onDto: (dto: WireCard, order: number) => void): Promise<void> {
    let cursor: string | undefined;
    let order = 0;
    do {
      const page = await service.listCards({ columnId, limit: PAGE_SIZE, cursor });
      for (const dto of page.items) {
        onDto(dto, order);
        order += 1;
      }
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
  }

  async function loadCardRevision(id: string): Promise<number> {
    const cached = cardCache.get(id);
    if (cached) return cached.revision;
    const detail = await service.getCard(id);
    updateCache(detail);
    return detail.revision;
  }

  return {
    fetchColumns: () => fetchColumnsOnce(),

    fetchCards: async () => {
      const columns = await fetchColumnsOnce();
      const cards: SalesCard[] = [];
      await Promise.all(
        columns.map((column) =>
          fetchColumnCards(column.id, (dto, order) => {
            updateCache(dto, order);
            cards.push(mapCardDto(dto, order));
          }),
        ),
      );
      return cards;
    },

    // Lazy heavier record for the detail panel — description, createdAt, …
    fetchCardDetail: async (id: string) => {
      const detail = await service.getCard(id);
      updateCache(detail);
      return mapCardDto(detail, cardCache.get(id)?.order ?? 0);
    },

    /**
     * Persists a partial update. `expectedRevision` comes from the last
     * server-confirmed state (cache or a fresh detail read), so the PATCH can
     * never send a self-invented revision. `columnId`/`order` are never sent —
     * stage changes belong to `moveCard`. On success the full fresh detail is
     * returned so the library merges the reconciled card.
     */
    updateCard: async (id, patch) => {
      const expectedRevision = await loadCardRevision(id);
      // The UPDATEABLE_FIELDS list is a fixed, known-safe subset of the wire
      // contract; the record avoids repeating a five-field conditional union.
      const body: Record<string, unknown> = { expectedRevision };
      for (const field of UPDATEABLE_FIELDS) {
        if (patch[field] !== undefined) {
          body[field] = patch[field];
        }
      }
      await service.updateCard(id, body as unknown as SalesCardUpdateRequest);
      const fresh = await service.getCard(id);
      updateCache(fresh);
      return mapCardDto(fresh, cardCache.get(id)?.order ?? 0);
    },

    /**
     * Stage transition. Client `order` is deliberately ignored — it is not
     * domain state. The backend decides placement and returns the new status;
     * we reconcile by refetching detail and returning the full card so the
     * library's optimistic state is replaced by server truth.
     */
    moveCard: async (cardId, newColumnId) => {
      const expectedRevision = await loadCardRevision(cardId);
      try {
        await service.moveCard(cardId, { toColumnId: newColumnId, expectedRevision });
      } catch (cause) {
        // A stale revision (409) tells us our state is behind the server. Drop
        // the outdated copy and refresh the revision cache so a subsequent
        // user-initiated retry starts from current state; never retry blindly.
        if (cause instanceof ApiError && cause.code === "CONFLICT") {
          try {
            const fresh = await service.getCard(cardId);
            updateCache(fresh);
          } catch {
            // Detail unreadable; the board rollback still surfaces the 409.
          }
        }
        throw cause;
      }
      const fresh = await service.getCard(cardId);
      updateCache(fresh);
      return mapCardDto(fresh, cardCache.get(cardId)?.order ?? 0);
    },
  };
}
