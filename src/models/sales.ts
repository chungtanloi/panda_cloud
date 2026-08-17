import type { IsoDate, IsoDateTime } from "./common";

/**
 * Sales pipeline — the internal Kanban board.
 *
 * The wire shapes below mirror the backend OpenAPI contract exactly
 * (`PandaCloudBackend/api-contracts/paths/sales-*.yaml`). The backend is the
 * single source of truth; anything here that disagrees with the contract is a
 * frontend bug.
 *
 * Two distinct layers meet here:
 *
 *   - The **wire DTOs** (`SalesColumnDto`, `SalesCardDto`, ...) are the raw
 *     backend shapes, including opaque identifiers and the money-as-string
 *     convention. They must never be mutated into a board shape.
 *   - `SalesCard` is the Kanban-facing shape. It satisfies the library's
 *     `BaseCard` (id, title, columnId, order, createdAt, updatedAt) and is
 *     produced by the adapter, which is the ONLY place the two layers are
 *     translated.
 *
 * The backend owns pipeline structure (10 stage codes, no client-derived
 * stages) and card creation (a card is created transactionally with the
 * submission that produced it; there is no `POST /sales/cards` and no
 * `DELETE /sales/cards/{dealId}` in the contract).
 */

/* ------------------------------ Wire DTOs ------------------------------- */

/** Backend column/state codes — `components.yaml#/components/schemas/ColumnCode`. */
export type ColumnCode =
  | "new"
  | "contacted"
  | "qualified"
  | "due_diligence"
  | "evaluation"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost"
  | "on_hold";

/** `components.yaml#/components/schemas/ColumnStageCategory`. */
export type ColumnStageCategory = "open" | "won" | "lost" | "paused";

/** `components.yaml#/components/schemas/CardVertical`. */
export type DealVertical = "land" | "gpu" | "token" | "hyperscale";

/** `components.yaml#/components/schemas/CardPriority`. */
export type DealPriority = "low" | "normal" | "high" | "urgent";

/** `components.yaml#/components/schemas/DealStatus`. */
export type DealStatus = "open" | "won" | "lost" | "on_hold" | "archived";

/** `components.yaml#/components/schemas/LastContactMethod`. */
export type LastContactMethod = "call" | "email" | "text" | "meeting";

/** `components.yaml#/components/schemas/SalesColumn`. */
export interface SalesColumnDto {
  columnId: string;
  code: ColumnCode;
  name: string;
  /** Board order, 1-based. */
  position: number;
  color: string | null;
  stageCategory: ColumnStageCategory;
  isTerminal: boolean;
}

/** `components.yaml#/components/schemas/SalesColumnListResponse`. */
export interface SalesColumnListResponse {
  columns: SalesColumnDto[];
}

/** `components.yaml#/components/schemas/SalesCard`. */
export interface SalesCardDto {
  dealId: string;
  title: string;
  organizationId: string;
  ownerId: string;
  columnId: string;
  status: DealStatus;
  vertical: DealVertical;
  priority: DealPriority;
  /** Minor units of `currency`, transported as a string to avoid precision loss. */
  estimatedValueMinor: string | null;
  /** ISO 4217. Present whenever `estimatedValueMinor` is present. */
  currency: string | null;
  probabilityPercent: number | null;
  expectedCloseDate: IsoDate | null;
  lastContactAt: IsoDateTime | null;
  lastContactMethod: LastContactMethod | null;
  revision: number;
  updatedAt: IsoDateTime;
}

/** `components.yaml#/components/schemas/SalesCardDetail` — adds list-invisible fields. */
export interface SalesCardDetailDto extends SalesCardDto {
  description: string | null;
  lostReason: string | null;
  wonAt: IsoDateTime | null;
  projectId: string | null;
  createdAt: IsoDateTime;
  createdBy: string;
  archivedAt: IsoDateTime | null;
}

/** `components.yaml#/components/schemas/SalesCardPage`. */
export interface SalesCardPage {
  items: SalesCardDto[];
  /** Absent == last page. */
  nextCursor: string | null;
}

/** Query for `GET /api/v1/sales/cards`. `columnId` is required. */
export interface SalesCardListQuery {
  columnId: string;
  cursor?: string;
  limit?: number;
  vertical?: DealVertical;
  ownerId?: string;
  priority?: DealPriority;
}

/**
 * `components.yaml#/components/schemas/SalesCardUpdateRequest`.
 *
 * `expectedRevision` must match the current revision or the backend answers
 * 409/CONFLICT. Both omission and explicit null mean "no change" for a field;
 * clearing an optional field is not supported by this candidate.
 */
export interface SalesCardUpdateRequest {
  expectedRevision: number;
  title?: string | null;
  description?: string | null;
  priority?: DealPriority | null;
  estimatedValueMinor?: string | null;
  currency?: string | null;
  probabilityPercent?: number | null;
  expectedCloseDate?: IsoDate | null;
}

/** `components.yaml#/components/schemas/SalesCardUpdateResponse`. */
export interface SalesCardUpdateResponse {
  dealId: string;
  revision: number;
}

/**
 * `components.yaml#/components/schemas/SalesCardMoveRequest`.
 *
 * `reason` is required by the domain when the target column category is
 * `lost` or `paused`. Moving to `won`/`lost` columns is restricted to manager
 * and admin roles.
 */
export interface SalesCardMoveRequest {
  toColumnId: string;
  expectedRevision: number;
  reason?: string | null;
}

/** `components.yaml#/components/schemas/SalesCardMoveResponse`. */
export interface SalesCardMoveResponse {
  dealId: string;
  status: DealStatus;
  revision: number;
}

/* ------------------------- Kanban-facing shape --------------------------- */

/**
 * Satisfies the library's `BaseCard` (id, title, columnId, order, createdAt,
 * updatedAt) plus the fields the board renders. Produced by `salesAdapter`
 * from the wire DTOs; never written to the wire directly.
 *
 * The library-only `order` is derived from the card's position within the
 * backend-returned column page for stable rendering. It is never sent back —
 * the backend owns ordering and the move operation ignores it.
 */
export interface SalesCard {
  id: string;
  title: string;
  columnId: string;
  order: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;

  organizationId: string;
  ownerId: string;
  status: DealStatus;
  vertical: DealVertical;
  priority: DealPriority;
  estimatedValueMinor: string | null;
  currency: string | null;
  probabilityPercent: number | null;
  expectedCloseDate: IsoDate | null;
  lastContactAt: IsoDateTime | null;
  lastContactMethod: LastContactMethod | null;
  revision: number;

  /** Detail-only fields. Absent until a detail fetch has populated them. */
  description?: string | null;
  lostReason?: string | null;
  wonAt?: IsoDateTime | null;
  projectId?: string | null;
  createdBy?: string;
  archivedAt?: IsoDateTime | null;
}
