import type { BaseCard, Column, DataAdapter } from '../core/types';

// Re-exported so adapter authors only need to import from `adapters/types`.
export type { BaseCard, Column, DataAdapter };

/**
 * Shared shape for adapters that map a generic BaseCard onto a differently
 * named backend column (e.g. a DB column literally called "status" instead
 * of "columnId"). Implement `toCard`/`fromCard` to bridge the two shapes.
 */
export interface FieldMapping<TCard extends BaseCard, TRemote> {
  toCard: (remote: TRemote) => TCard;
  fromCard: (patch: Partial<TCard>) => Partial<TRemote>;
}
