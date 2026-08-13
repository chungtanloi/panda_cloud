import { useMemo, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type PointerSensorOptions,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { BaseCard } from '../types';

/**
 * Elements a pointer-down should never start a card drag from: native
 * interactive controls, plus anything a consumer opts out explicitly via
 * `data-no-dnd="true"` (the standard dnd-kit escape hatch for custom
 * interactive elements — e.g. a `<div role="button">` action icon inside a
 * `cardRender`). Deliberately does NOT include `[role="button"]`, since the
 * card root itself carries that role — matching it would block dragging
 * everywhere on the card.
 */
const DRAG_IGNORE_SELECTOR = 'button, a, input, textarea, select, [contenteditable="true"], [data-no-dnd="true"]';

/**
 * Identical activation logic to dnd-kit's built-in `PointerSensor`, with one
 * extra check: if the pointer went down on (or inside) an element matching
 * `DRAG_IGNORE_SELECTOR`, the sensor declines to activate and returns
 * `false` — the pointerdown is left alone, so the element's own click
 * handler (a delete/edit button, a link, a form control, ...) fires
 * normally instead of a drag starting underneath it.
 *
 * This is what lets `Card.tsx` make the *entire* card a drag surface (no
 * fixed handle element) while still keeping any buttons/icons a project
 * renders inside `cardRender` fully clickable.
 */
class CardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: ReactPointerEvent, { onActivation }: PointerSensorOptions) => {
        if (!event.isPrimary || event.button !== 0) return false;
        if ((event.target as HTMLElement | null)?.closest(DRAG_IGNORE_SELECTOR)) return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

export interface UseDragDropOptions<TCard extends BaseCard> {
  cards: TCard[];
  onMove: (cardId: string, newColumnId: string, newOrder: number) => void;
  disabled?: boolean;
}

export interface UseDragDropResult<TCard extends BaseCard> {
  sensors: ReturnType<typeof useSensors>;
  activeCard: TCard | null;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

/**
 * Wraps @dnd-kit sensors + the start/over/end lifecycle needed to drag a
 * card between columns and reorder it within a column. Consumed by
 * <Kanban />; exported so custom boards can reuse the same drag logic.
 *
 * Cards (see `Card.tsx`) have no fixed drag-handle element — the whole card
 * is draggable, press and drag from anywhere on it. Click vs. drag is
 * disambiguated two ways:
 *  1. `activationConstraint.distance` below — a pointer down that doesn't
 *     move past a few pixels is treated as a click/tap, not a drag, so a
 *     plain click still opens/selects normally.
 *  2. `CardPointerSensor` above — pointer downs on interactive descendants
 *     (buttons, links, inputs, or anything marked `data-no-dnd`) never
 *     start a drag in the first place, so action buttons/icons inside a
 *     card stay clickable even mid-drag-surface.
 */
export function useDragDrop<TCard extends BaseCard>({
  cards,
  onMove,
  disabled,
}: UseDragDropOptions<TCard>): UseDragDropResult<TCard> {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(CardPointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeCard = useMemo(() => cards.find((c) => c.id === activeId) ?? null, [cards, activeId]);

  const handleDragStart = (event: DragStartEvent) => {
    if (disabled) return;
    setActiveId(String(event.active.id));
  };

  // Dragging over a column (empty or not) previews the drop target; the
  // actual move is committed in handleDragEnd to avoid firing the adapter
  // on every pixel of movement.
  const handleDragOver = (_event: DragOverEvent) => {
    // Intentionally a no-op hook point: consumers rendering a custom
    // "drop preview" can extend useDragDrop and override this.
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    if (disabled) return;
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    const overData = over.data.current as { columnId?: string } | undefined;
    const targetColumnId = overData?.columnId ?? String(over.id);
    if (!targetColumnId) return;

    const destinationCards = cards.filter((c) => c.columnId === targetColumnId && c.id !== cardId);
    const overCardIndex = destinationCards.findIndex((c) => c.id === String(over.id));
    const newOrder = overCardIndex >= 0 ? overCardIndex : destinationCards.length;

    if (targetColumnId === card.columnId && newOrder === card.order) return;

    onMove(cardId, targetColumnId, newOrder);
  };

  return { sensors, activeCard, handleDragStart, handleDragOver, handleDragEnd };
}
