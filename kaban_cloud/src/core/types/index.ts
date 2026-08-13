import type { ReactNode } from 'react';

/**
 * Minimal shape every card must satisfy. Consuming projects extend this
 * with their own domain fields, e.g.:
 *
 *   interface SalesCard extends BaseCard {
 *     dealValue: number;
 *     contactName: string;
 *   }
 */
export interface BaseCard {
  id: string;
  title: string;
  columnId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  /** Optional cap; the board renders a "N / limit" badge and blocks drops past it when set. */
  cardLimit?: number;
  /** Optional accent color (any valid CSS color) used for the column header bar. */
  color?: string;
  cardCount?: number;
}

/**
 * Persistence boundary between the board and whatever backend a project
 * uses (REST API, Supabase, localStorage, ...). Implement this once per
 * backend and pass it into <Kanban adapter={...} />.
 */
export interface DataAdapter<TCard extends BaseCard = BaseCard> {
  fetchColumns(): Promise<Column[]>;
  fetchCards(): Promise<TCard[]>;
  /** Optional lazy-loaded full record for a single card (e.g. heavier fields the list view skips). When present, the DetailPanel shows a loading state while it resolves. */
  fetchCardDetail?(id: string): Promise<TCard>;
  createCard?(data: Partial<TCard>): Promise<TCard>;
  updateCard(id: string, data: Partial<TCard>): Promise<TCard>;
  moveCard(cardId: string, newColumnId: string, newOrder?: number): Promise<TCard>;
  deleteCard?(id: string): Promise<void>;
  reorderColumns?(columns: Column[]): Promise<void>;
}

/**
 * Minimal shape a "current user" must satisfy to be checked against
 * permission callbacks. Consuming projects extend this with roles, teams,
 * whatever their `can*Card` callbacks need — the library never inspects
 * fields beyond `id`.
 */
export interface KanbanUser {
  id: string;
  role?: string;
  [key: string]: unknown;
}

export interface KanbanConfig<TCard extends BaseCard = BaseCard, TUser extends KanbanUser = KanbanUser> {
  columns?: Column[];
  adapter: DataAdapter<TCard>;
  /** Called when a card is clicked (or activated via Enter on keyboard); by default opens the built-in DetailPanel. */
  onCardClick?: (card: TCard) => void;
  /**
   * Override how a single card renders inside a column. The whole card is
   * the drag handle (no fixed handle element) — if you render interactive
   * elements here (buttons, links, form controls), they stay clickable and
   * won't start a drag automatically. For any other interactive element
   * (e.g. a `<div role="button">` icon) that should also be exempt from
   * starting a drag, add `data-no-dnd="true"` to it.
   */
  cardRender?: (card: TCard) => ReactNode;
  /** Override how a column header renders. */
  columnHeaderRender?: (column: Column, cards: TCard[]) => ReactNode;
  /** Override the built-in DetailPanel body. Returning null keeps the panel closed on click. */
  detailPanelRender?: (card: TCard, close: () => void) => ReactNode;
  /** Called after a successful drag-and-drop move, in addition to the adapter call. */
  onCardMove?: (card: TCard, fromColumnId: string, toColumnId: string) => void;
  /** Disables drag-and-drop entirely (read-only board). */
  readOnly?: boolean;
  /** Additional class name applied to the board's root element. */
  className?: string;

  // --- Permissions ---------------------------------------------------------
  /** Current user, passed through to every `can*Card` callback. */
  user?: TUser;
  /** Whether a new card may be created in `columnId`. Defaults to allow. */
  canCreateCard?: (columnId: string, user: TUser | undefined) => boolean;
  /** Whether `card`'s fields may be edited. Defaults to allow. Gates the DetailPanel form and shows a "Read-only" badge when false. */
  canEditCard?: (card: TCard, user: TUser | undefined) => boolean;
  /** Whether `card` may be dragged into `toColumnId`. Defaults to allow. Checked both to enable dragging and again on drop. */
  canMoveCard?: (card: TCard, toColumnId: string, user: TUser | undefined) => boolean;
  /** Whether `card` may be deleted. Defaults to allow. */
  canDeleteCard?: (card: TCard, user: TUser | undefined) => boolean;
}

export type KanbanStatus = 'idle' | 'loading' | 'error' | 'ready';

export interface KanbanState<TCard extends BaseCard = BaseCard> {
  columns: Column[];
  cards: TCard[];
  status: KanbanStatus;
  error: Error | null;
}
