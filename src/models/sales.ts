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
 * stages). A card produced by a customer flow is created transactionally with
 * the submission; `POST /sales/cards` exists only for manual outbound/offline
 * entry by staff. There is still no `DELETE /sales/cards/{dealId}` in the
 * contract — a lost deal is moved to the `lost` column, never erased.
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

/**
 * `components.yaml#/components/schemas/SalesCardContact`.
 *
 * The deal's primary business contact, denormalized onto the card by the
 * backend so a salesperson can call or email straight from the board (UC-006).
 * `contacts` is the source of truth; nothing here is ever written back.
 *
 * `status: "do_not_contact"` is a hard instruction from DEALFLOW § 5.1 — render
 * the details as plain text with **no** `tel:` or `mailto:` affordance. See
 * `contactChannels()` below, which is the only sanctioned way to build them.
 */
export interface SalesContactDto {
  contactId: string;
  fullName: string;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive" | "do_not_contact";
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
  /** Company display name. Null when the reference cannot be resolved. */
  organizationName: string | null;
  /**
   * Deal owner's display name. Render this, never `ownerId` — the id is an
   * opaque Convex key and means nothing to the person reading the panel.
   */
  ownerName: string | null;
  /** Null when the deal has no primary contact, or the contact was archived. */
  primaryContact: SalesContactDto | null;
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

/**
 * `components.yaml#/components/schemas/SalesCardCreateRequest`.
 *
 * Manual outbound/offline entry only (UC-004). Customer-form submissions create
 * their card inside the submission transaction and must not use this.
 *
 * Organization selection (previously U-?? / NEEDS CLARIFICATION, now decided):
 * the caller sends **exactly one** of `organizationId` or `organizationName`.
 * A name is matched case-insensitively against existing organizations and a
 * `customer`/`prospect` organization is created when nothing matches, which is
 * what `API_CONTRACT.md` § 9.2 describes while still satisfying UC-004's
 * requirement that a deal reference a real organization row.
 *
 * The UI only ever sends `organizationName`; `organizationId` exists for
 * machine callers and imports.
 */
export interface SalesCardCreateRequest {
  title: string;
  /**
   * Primary contact for the deal. `contactName` plus at least one of
   * `contactEmail` / `contactPhone` — DEALFLOW § 5.1 requires a contact to be
   * reachable, and a card nobody can act on is the problem this field exists to
   * solve. Matched by email inside the company, created when nothing matches.
   */
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactJobTitle?: string;
  /** Mutually exclusive with `organizationName`. Not used by the UI. */
  organizationId?: string;
  /** Company name. Find-or-create. Mutually exclusive with `organizationId`. */
  organizationName?: string;
  /** Defaults to the authenticated caller. The UI never sends this. */
  ownerId?: string;
  vertical: DealVertical;
  priority?: DealPriority;
  /** Defaults to the seeded `new` column when omitted. */
  stageId?: string;
  leadId?: string;
  primaryContactId?: string;
  description?: string;
  estimatedValueMinor?: string;
  currency?: string;
  probabilityPercent?: number;
  expectedCloseDate?: IsoDate;
}

/** `components.yaml#/components/schemas/SalesCardCreateResponse`. */
export interface SalesCardCreateResponse {
  dealId: string;
  revision: number;
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
  followUpAt?: number;
  override?: boolean;
  overrideReason?: string;
}

export interface TransitionIssue {
  code: string;
  message: string;
  field?: string;
  actionHref?: string;
}

export interface SalesTransitionOption {
  columnId: string;
  code: string;
  name: string;
  allowed: boolean;
  canOverride: boolean;
  blockers: TransitionIssue[];
  warnings: TransitionIssue[];
  requiredFields: string[];
}

export interface SalesTransitionOptionsResponse {
  dealId: string;
  currentColumnId: string;
  dealRevision: number;
  options: SalesTransitionOption[];
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
  /** Company display name — what the card shows instead of the opaque id. */
  organizationName: string | null;
  /** Owner's display name. The UI must never print `ownerId`. */
  ownerName: string | null;
  /** Reachable primary contact, or null. Always build links via `contactChannels`. */
  primaryContact: SalesContactDto | null;
  revision: number;

  /** Detail-only fields. Absent until a detail fetch has populated them. */
  description?: string | null;
  lostReason?: string | null;
  wonAt?: IsoDateTime | null;
  projectId?: string | null;
  createdBy?: string;
  archivedAt?: IsoDateTime | null;
}

/* ----------------------------- Contact helpers ---------------------------- */

/** A ready-to-render contact channel. `href` is null when linking is forbidden. */
export interface ContactChannel {
  kind: "phone" | "email";
  /** What the user reads. */
  label: string;
  /** `tel:`/`mailto:` target, or null when the contact must not be contacted. */
  href: string | null;
}

/**
 * Turns a contact into the channels the UI may offer.
 *
 * Centralised on purpose: `do_not_contact` must suppress the link everywhere,
 * and a rule enforced in one helper cannot be forgotten in the third component
 * that renders a contact. The details still render — a salesperson needs to
 * recognise the record — but nothing is one click from dialling it.
 *
 * `tel:` strips spaces, dots and dashes because dialers reject them; the
 * visible label keeps whatever formatting the data has.
 */
export function contactChannels(contact: SalesContactDto | null): ContactChannel[] {
  if (!contact) return [];
  const linkable = contact.status !== "do_not_contact";
  const channels: ContactChannel[] = [];
  if (contact.phone) {
    const dialable = contact.phone.replace(/[\s.()-]/g, "");
    channels.push({
      kind: "phone",
      label: contact.phone,
      href: linkable && dialable ? `tel:${dialable}` : null,
    });
  }
  if (contact.email) {
    channels.push({
      kind: "email",
      label: contact.email,
      href: linkable ? `mailto:${contact.email}` : null,
    });
  }
  return channels;
}
