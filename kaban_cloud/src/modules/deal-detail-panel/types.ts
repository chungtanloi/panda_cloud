import type { BaseCard } from '../../core/types';

export type DueDiligenceStatus = 'complete' | 'pending' | 'not_started';

export interface DueDiligenceItem {
  id: string;
  label: string;
  status: DueDiligenceStatus;
}

export interface DealContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

export interface ActivityEvent {
  id: string;
  /** e.g. "Lead Created", "Contact Response" */
  label: string;
  /** ISO timestamp; formatted for display by the panel. */
  timestamp: string;
  /** Extra line under the timestamp, e.g. "John McCarthy replied". */
  detail?: string;
}

export interface DealValue {
  amount: number;
  /** Currency symbol shown before the input, e.g. '$'. Defaults to '$'. */
  currency?: string;
  /** Free-text term shown in the dropdown, e.g. "1-year contract". */
  term?: string;
}

/**
 * Extends the generic BaseCard with everything the DealDetailPanel design
 * needs. Every field is optional except what BaseCard already requires —
 * sections the panel can't find data for just render empty/collapsed
 * rather than crashing, so you can adopt fields incrementally.
 */
export interface DealCard extends BaseCard {
  /** Shown under the title in the header, e.g. "CoreWeave Inc. — Hyperscaler". */
  subtitle?: string;
  /** Pill badges under the header, e.g. ["Hyperscale", "Inbound"]. */
  tags?: string[];
  dueDiligence?: DueDiligenceItem[];
  primaryContact?: DealContact;
  /** Human-readable label for the "Last contact" dropdown, e.g. "2 days ago". */
  lastContactLabel?: string;
  projectNotes?: string;
  dealValue?: DealValue;
  activity?: ActivityEvent[];
}
