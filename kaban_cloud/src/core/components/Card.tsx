import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { BaseCard } from '../types';

export interface CardProps<TCard extends BaseCard> {
  card: TCard;
  onClick?: (card: TCard) => void;
  render?: (card: TCard) => React.ReactNode;
  disabled?: boolean;
}

/**
 * Default draggable card. Projects typically don't render this directly —
 * pass `cardRender` to <Kanban /> to fully customize card content while
 * keeping the drag handle/behavior from this component's sortable wiring.
 *
 * The entire card is the drag handle — grab and drag from anywhere on it,
 * not just a small handle icon. Because dnd-kit's PointerSensor only starts
 * a drag once the pointer moves past a small distance threshold (see
 * useDragDrop's `activationConstraint`), a stationary click still reaches
 * the browser as a normal click and opens the card. If a real drag does
 * happen, dnd-kit itself swallows the click event that would otherwise
 * fire on release, so dropping a card never also opens it.
 */
export function Card<TCard extends BaseCard>({ card, onClick, render, disabled }: CardProps<TCard>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { columnId: card.columnId },
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex select-none items-start gap-2 rounded-lg border border-kanban-border bg-kanban-surface p-3 shadow-sm transition-shadow hover:shadow-md ${
        disabled ? '' : 'cursor-grab active:cursor-grabbing'
      }`}
      {...(disabled ? {} : attributes)}
      {...(disabled ? {} : listeners)}
      role="button"
      tabIndex={0}
      aria-label="Click, or press Enter, to open this card. Click and drag to move it."
      onClick={() => onClick?.(card)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onClick?.(card);
          return;
        }
        if (!disabled) listeners?.onKeyDown?.(e);
      }}
    >
      {!disabled && (
        <GripVertical
          size={14}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"
        />
      )}
      <div className="min-w-0 flex-1">
        {render ? render(card) : <p className="truncate text-sm font-medium text-gray-900">{card.title}</p>}
      </div>
    </div>
  );
}
