import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePermissions } from './usePermissions';
import type { BaseCard, KanbanUser } from '../types';

interface TestCard extends BaseCard {
  ownerId: string;
}

const now = '2026-01-01T00:00:00.000Z';
const card: TestCard = { id: '1', title: 'Card', columnId: 'todo', order: 0, createdAt: now, updatedAt: now, ownerId: 'user-1' };

interface AppUser extends KanbanUser {
  role: 'admin' | 'member';
}

const admin: AppUser = { id: 'admin-1', role: 'admin' };
const member: AppUser = { id: 'user-1', role: 'member' };
const otherMember: AppUser = { id: 'user-2', role: 'member' };

describe('usePermissions', () => {
  it('defaults every check to allowed when no callback is provided', () => {
    const { result } = renderHook(() => usePermissions<TestCard>({}));
    expect(result.current.canEditCard(card)).toBe(true);
    expect(result.current.canMoveCard(card, 'done')).toBe(true);
    expect(result.current.canDeleteCard(card)).toBe(true);
    expect(result.current.canCreateCard('todo')).toBe(true);
  });

  it('admin can edit/move/delete any card; a regular user only their own', () => {
    const canEditCard = (c: TestCard, user: AppUser | undefined) => user?.role === 'admin' || c.ownerId === user?.id;

    const { result: adminResult } = renderHook(() => usePermissions<TestCard, AppUser>({ user: admin, canEditCard }));
    expect(adminResult.current.canEditCard(card)).toBe(true);

    const { result: ownerResult } = renderHook(() => usePermissions<TestCard, AppUser>({ user: member, canEditCard }));
    expect(ownerResult.current.canEditCard(card)).toBe(true);

    const { result: strangerResult } = renderHook(() =>
      usePermissions<TestCard, AppUser>({ user: otherMember, canEditCard }),
    );
    expect(strangerResult.current.canEditCard(card)).toBe(false);
  });

  it('passes the target column into canMoveCard', () => {
    const canMoveCard = (_c: TestCard, toColumnId: string) => toColumnId !== 'archived';
    const { result } = renderHook(() => usePermissions<TestCard>({ canMoveCard }));

    expect(result.current.canMoveCard(card, 'doing')).toBe(true);
    expect(result.current.canMoveCard(card, 'archived')).toBe(false);
  });

  it('canDeleteCard restricted to admins', () => {
    const canDeleteCard = (_c: TestCard, user: AppUser | undefined) => user?.role === 'admin';
    const { result: adminResult } = renderHook(() => usePermissions<TestCard, AppUser>({ user: admin, canDeleteCard }));
    const { result: memberResult } = renderHook(() => usePermissions<TestCard, AppUser>({ user: member, canDeleteCard }));

    expect(adminResult.current.canDeleteCard(card)).toBe(true);
    expect(memberResult.current.canDeleteCard(card)).toBe(false);
  });
});
