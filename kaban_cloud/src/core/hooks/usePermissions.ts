import { useMemo } from 'react';
import type { BaseCard, KanbanUser } from '../types';

export interface PermissionCallbacks<TCard extends BaseCard, TUser extends KanbanUser = KanbanUser> {
  user?: TUser;
  canCreateCard?: (columnId: string, user: TUser | undefined) => boolean;
  canEditCard?: (card: TCard, user: TUser | undefined) => boolean;
  canMoveCard?: (card: TCard, toColumnId: string, user: TUser | undefined) => boolean;
  canDeleteCard?: (card: TCard, user: TUser | undefined) => boolean;
}

export interface UsePermissionsResult<TCard extends BaseCard> {
  canCreateCard: (columnId: string) => boolean;
  canEditCard: (card: TCard) => boolean;
  canMoveCard: (card: TCard, toColumnId: string) => boolean;
  canDeleteCard: (card: TCard) => boolean;
}

/**
 * Wraps the four `can*Card` callbacks on <Kanban /> into a single object
 * bound to the current `user`, with a permissive default (allow) for any
 * callback that isn't provided — so boards that don't care about
 * permissions behave exactly as before.
 *
 *   const permissions = usePermissions({ user, canEditCard, canMoveCard });
 *   permissions.canEditCard(card) // -> boolean
 */
export function usePermissions<TCard extends BaseCard, TUser extends KanbanUser = KanbanUser>({
  user,
  canCreateCard,
  canEditCard,
  canMoveCard,
  canDeleteCard,
}: PermissionCallbacks<TCard, TUser>): UsePermissionsResult<TCard> {
  return useMemo(
    () => ({
      canCreateCard: (columnId: string) => canCreateCard?.(columnId, user) ?? true,
      canEditCard: (card: TCard) => canEditCard?.(card, user) ?? true,
      canMoveCard: (card: TCard, toColumnId: string) => canMoveCard?.(card, toColumnId, user) ?? true,
      canDeleteCard: (card: TCard) => canDeleteCard?.(card, user) ?? true,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, canCreateCard, canEditCard, canMoveCard, canDeleteCard],
  );
}
