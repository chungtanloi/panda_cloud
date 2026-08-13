import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BaseCard, Column as ColumnType } from '../types';
import { Card } from './Card';

export interface ColumnProps<TCard extends BaseCard> {
  column: ColumnType;
  cards: TCard[];
  onCardClick?: (card: TCard) => void;
  cardRender?: (card: TCard) => React.ReactNode;
  headerRender?: (column: ColumnType, cards: TCard[]) => React.ReactNode;
  readOnly?: boolean;
  /** Per-card override on top of `readOnly` — e.g. permission checks that vary by card. Returning true disables dragging that card. */
  isCardDisabled?: (card: TCard) => boolean;
}

export function Column<TCard extends BaseCard>({
  column,
  cards,
  onCardClick,
  cardRender,
  headerRender,
  readOnly,
  isCardDisabled,
}: ColumnProps<TCard>) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { columnId: column.id },
  });

  const overLimit = column.cardLimit != null && cards.length > column.cardLimit;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-xl bg-kanban-bg">
      {headerRender ? (
        headerRender(column, cards)
      ) : (
        <div
          className="flex items-center justify-between rounded-t-xl px-3 py-2"
          style={column.color ? { borderTop: `3px solid ${column.color}` } : undefined}
        >
          <h3 className="text-sm font-semibold text-gray-700">{column.title}</h3>
          <span className={`text-xs font-medium ${overLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {cards.length}
            {column.cardLimit != null ? ` / ${column.cardLimit}` : ''}
          </span>
        </div>
      )}

      <div
        ref={setNodeRef}
        className={`flex min-h-[4rem] flex-1 flex-col gap-2 rounded-b-xl p-2 transition-colors ${
          isOver ? 'bg-kanban-accent/10' : ''
        }`}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={onCardClick}
              render={cardRender}
              disabled={readOnly || isCardDisabled?.(card)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-kanban-border py-6 text-xs text-gray-400">
            No cards
          </div>
        )}
      </div>
    </div>
  );
}
