import type { BaseCard } from '../../core/types';

/** Extends the generic BaseCard with sales-specific fields. */
export interface SalesCard extends BaseCard {
  company: string;
  contactName: string;
  dealValue: number;
  currency?: string;
  probability?: number; // 0-100
  closeDate?: string;
}
