import type { IsoDateTime } from "./common";
import type { RequestKind } from "./dashboard";

/**
 * Sales pipeline — the internal Kanban board.
 *
 * A deal card is created **by the backend, in the same transaction** that
 * stores a wizard submission or a lead. The frontend never creates one: two
 * separate writes could half-fail, leaving a customer recorded with no card
 * for sales to act on.
 *
 * Card and column shapes deliberately mirror `BaseCard` / `Column` from
 * `@kanban/library` so the adapter is a straight pass-through with no mapping
 * layer to drift.
 */

/** Pipeline stages. Ids match the column ids the board renders. */
export type DealStage =
  | "lead"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface DealColumn {
  id: DealStage;
  title: string;
  order: number;
  /** WIP cap; the board shows "n / limit" and blocks drops past it. */
  cardLimit?: number;
  color?: string;
}

/**
 * Satisfies `BaseCard` (id, title, columnId, order, createdAt, updatedAt) and
 * adds the fields sales needs to triage an inbound request.
 */
export interface DealCard {
  id: string;
  /** Card headline, e.g. "Northwind Energy — 120ha assessment". */
  title: string;
  /** Current stage. Named `columnId` because the library requires that key. */
  columnId: DealStage;
  order: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;

  /** Which flow produced this deal — drives the badge and the filter. */
  source: RequestKind | "lead_form";
  /** Human-readable reference shown to the customer, e.g. "CP-GPU-1190". */
  reference: string;

  companyName?: string;
  contactName: string;
  email: string;
  phone?: string;

  /** Estimated deal value in USD. Absent when the flow produced no figure. */
  dealValueUsd?: number;
  /** 0–100. Set by sales, not by the wizard. */
  probability?: number;
  /** Target close date, ISO-8601 date. */
  closeDate?: string;

  /** Staff user id the deal is assigned to. */
  ownerId?: string;
  /** Free-text notes added by sales. */
  notes?: string;

  /**
   * The submission that produced this card, so sales can open the full answers
   * rather than re-asking the customer.
   */
  submissionId?: string;
  /** Key figures lifted from the submission, pre-formatted for display. */
  highlights?: DealHighlight[];
}

export interface DealHighlight {
  label: string;
  value: string;
}

/** Payload for the fields sales may edit. */
export type DealCardPatch = Partial<
  Pick<
    DealCard,
    | "title"
    | "columnId"
    | "order"
    | "probability"
    | "closeDate"
    | "ownerId"
    | "notes"
    | "dealValueUsd"
  >
>;
