import { useMemo, useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { WifiOff } from 'lucide-react';
import type { BaseCard, KanbanConfig, KanbanUser } from '../types';
import { useKanban } from '../hooks/useKanban';
import { useDragDrop } from '../hooks/useDragDrop';
import { usePermissions } from '../hooks/usePermissions';
import { useSearch } from '../hooks/useSearch';
import { useOnline } from '../hooks/useOnline';
import { notifyError } from '../hooks/useErrorNotification';
import { Column } from './Column';
import { Card } from './Card';
import { DetailPanel } from './DetailPanel';
import { SkeletonColumn } from './SkeletonColumn';
import { SearchBar } from './SearchBar';
import { ErrorToastContainer } from './ErrorToastContainer';
import { ErrorBoundary } from './ErrorBoundary';

export interface KanbanProps<TCard extends BaseCard, TUser extends KanbanUser = KanbanUser>
  extends KanbanConfig<TCard, TUser> {
  /** Extra fields (beyond `title`) the built-in search bar text-matches against. */
  searchFields?: (keyof TCard)[];
  /** Hides the built-in search bar. It's shown by default whenever the board has cards. */
  hideSearch?: boolean;
}

function KanbanBoard<TCard extends BaseCard, TUser extends KanbanUser = KanbanUser>({
  columns: initialColumns,
  adapter,
  onCardClick,
  cardRender,
  columnHeaderRender,
  detailPanelRender,
  onCardMove,
  readOnly,
  className,
  user,
  canCreateCard,
  canEditCard,
  canMoveCard,
  canDeleteCard,
  searchFields,
  hideSearch,
}: KanbanProps<TCard, TUser>) {
  const {
    columns,
    cardsByColumn,
    cards,
    status,
    error,
    pendingCardIds,
    moveCard,
    updateCard,
    deleteCard,
  } = useKanban<TCard>(adapter, initialColumns);
  const [selectedCard, setSelectedCard] = useState<TCard | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const online = useOnline();

  const permissions = usePermissions<TCard, TUser>({ user, canCreateCard, canEditCard, canMoveCard, canDeleteCard });
  const search = useSearch<TCard>(cards, { searchFields });

  const allCards = Array.from(cardsByColumn.values()).flat();
  const visibleCardsByColumn = useMemo(() => {
    if (!search.isFiltering) return cardsByColumn;
    const visibleIds = new Set(search.results.map((c) => c.id));
    const filtered = new Map<string, TCard[]>();
    for (const [columnId, columnCards] of cardsByColumn) {
      filtered.set(
        columnId,
        columnCards.filter((c) => visibleIds.has(c.id)),
      );
    }
    return filtered;
  }, [cardsByColumn, search.isFiltering, search.results]);

  const { sensors, activeCard, handleDragStart, handleDragEnd } = useDragDrop<TCard>({
    cards: allCards,
    disabled: readOnly,
    onMove: (cardId, newColumnId, newOrder) => {
      const card = allCards.find((c) => c.id === cardId);
      if (!card) return;
      if (!permissions.canMoveCard(card, newColumnId)) {
        notifyError("You don't have permission to move this card there.");
        return;
      }
      const fromColumnId = card.columnId;
      void moveCard(cardId, newColumnId, newOrder);
      onCardMove?.(card, fromColumnId, newColumnId);
    },
  });

  const handleCardClick = (card: TCard) => {
    if (onCardClick) {
      onCardClick(card);
      return;
    }
    setSelectedCard(card);
    if (adapter.fetchCardDetail) {
      setDetailLoading(true);
      adapter
        .fetchCardDetail(card.id)
        .then((full) => setSelectedCard(full))
        .catch((err) => {
          const normalized = err instanceof Error ? err : new Error(String(err));
          notifyError(`Failed to load card details: ${normalized.message}`, {
            error: normalized,
            retry: () => handleCardClick(card),
          });
        })
        .finally(() => setDetailLoading(false));
    }
  };

  if (status === 'loading' && allCards.length === 0) {
    const skeletonCount = columns.length || 3;
    return (
      <div className={`flex h-full flex-col ${className ?? ''}`}>
        <div className="flex h-full gap-3 overflow-x-auto p-3">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonColumn key={columns[i]?.id ?? i} />
          ))}
        </div>
      </div>
    );
  }

  if (status === 'error' && allCards.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-red-500">
        Failed to load board{error ? `: ${error.message}` : ''}
      </div>
    );
  }

  const selectedCanEdit = selectedCard ? permissions.canEditCard(selectedCard) : true;
  const selectedCanDelete = selectedCard ? permissions.canDeleteCard(selectedCard) : false;

  return (
    <div className={`flex h-full flex-col ${className ?? ''}`}>
      {!online && (
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <WifiOff size={12} />
          Offline mode — changes will sync when you're back online
        </div>
      )}

      {!hideSearch && cards.length > 0 && (
        <SearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          resultCount={search.resultCount}
          totalCount={search.totalCount}
          isFiltering={search.isFiltering}
          onClear={search.clear}
          columns={columns}
          columnId={search.columnId}
          onColumnChange={search.setColumnId}
        />
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex h-full gap-3 overflow-x-auto p-3">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              cards={visibleCardsByColumn.get(column.id) ?? []}
              onCardClick={handleCardClick}
              cardRender={cardRender}
              headerRender={columnHeaderRender}
              readOnly={readOnly}
              isCardDisabled={(card) => pendingCardIds.has(card.id) || !permissions.canMoveCard(card, card.columnId)}
            />
          ))}
        </div>

        <DragOverlay>{activeCard ? <Card card={activeCard} render={cardRender} /> : null}</DragOverlay>
      </DndContext>

      <ErrorToastContainer />

      {!onCardClick && (
        <DetailPanel
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          loading={detailLoading}
          saving={selectedCard ? pendingCardIds.has(selectedCard.id) : false}
          readOnly={!selectedCanEdit}
          onChange={(patch) => {
            if (!selectedCard || !selectedCanEdit) return;
            void updateCard(selectedCard.id, patch);
            setSelectedCard({ ...selectedCard, ...patch });
          }}
          onDelete={
            selectedCanDelete && adapter.deleteCard
              ? () => {
                  if (!selectedCard) return;
                  void deleteCard(selectedCard.id);
                  setSelectedCard(null);
                }
              : undefined
          }
          render={detailPanelRender}
        />
      )}
    </div>
  );
}

/**
 * Generic, drag-and-drop Kanban board. Give it a list of columns and a
 * DataAdapter and it handles fetching, optimistic drag/drop, search,
 * permissions, offline caching, and card editing. Every visual piece
 * (card, column header, detail panel) is overridable via config so it can
 * be reskinned per project without forking the component. Wrapped in an
 * ErrorBoundary so a crashing custom render doesn't take down the whole
 * board — just this component's subtree.
 */
export function Kanban<TCard extends BaseCard, TUser extends KanbanUser = KanbanUser>(
  props: KanbanProps<TCard, TUser>,
) {
  return (
    <ErrorBoundary>
      <KanbanBoard<TCard, TUser> {...props} />
    </ErrorBoundary>
  );
}
