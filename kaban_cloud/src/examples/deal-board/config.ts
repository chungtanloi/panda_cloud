import type { DataAdapter } from '../../core/types';
import type { DealCard } from '../../modules/deal-detail-panel/types';
import { DEAL_STAGES, MOCK_DEAL_CARD } from '../../modules/deal-detail-panel/mockData';

export { DEAL_STAGES };

const now = new Date().toISOString();

let seedDeals: DealCard[] = [
  MOCK_DEAL_CARD,
  {
    id: 'deal-lambda',
    title: 'Lambda Labs Expansion',
    subtitle: 'Lambda Labs — Cloud GPU',
    columnId: 'qualified',
    order: 0,
    createdAt: now,
    updatedAt: now,
    tags: ['Mid-market', 'Renewal'],
    dueDiligence: [
      { id: 'nda', label: 'NDA Signed', status: 'complete' },
      { id: 'kyc', label: 'KYC Verification', status: 'complete' },
      { id: 'compliance', label: 'Compliance Review', status: 'pending' },
    ],
    primaryContact: { name: 'Sara Kim', title: 'Procurement Lead', email: 'sara.kim@lambdalabs.example', phone: '+1 (415) 555-0110' },
    lastContactLabel: 'Yesterday',
    projectNotes: 'Renewing existing A100 contract, exploring H100 upgrade for Q2.',
    dealValue: { amount: 82000, currency: '$', term: '2-year contract' },
    activity: [
      { id: 'a1', label: 'Renewal Discussion Started', timestamp: now },
    ],
  },
  {
    id: 'deal-anthropic-like',
    title: 'Model Labs Inc. — New Cluster',
    subtitle: 'Model Labs Inc. — AI Research',
    columnId: 'evaluation',
    order: 0,
    createdAt: now,
    updatedAt: now,
    tags: ['Hyperscale'],
    dueDiligence: [
      { id: 'nda', label: 'NDA Signed', status: 'complete' },
      { id: 'technical', label: 'Technical Evaluation', status: 'pending' },
    ],
    primaryContact: { name: 'Priya Patel', title: 'Infra Director', email: 'priya@modellabs.example' },
    lastContactLabel: '4 days ago',
    dealValue: { amount: 410000, currency: '$', term: '3-year contract' },
    activity: [],
  },
];

/**
 * In-memory DataAdapter so this dev-only preview board runs standalone.
 * Same pattern as `examples/sales-pipeline/config.ts` — swap for
 * `createFetchApiAdapter`/`createSupabaseAdapter` in a real app.
 */
export function createDealBoardAdapter(): DataAdapter<DealCard> {
  return {
    async fetchColumns() {
      return DEAL_STAGES;
    },
    async fetchCards() {
      return seedDeals;
    },
    async updateCard(id, patch) {
      let updated: DealCard | undefined;
      seedDeals = seedDeals.map((deal) => {
        if (deal.id !== id) return deal;
        updated = { ...deal, ...patch, updatedAt: new Date().toISOString() };
        return updated;
      });
      if (!updated) throw new Error(`Deal ${id} not found`);
      return updated;
    },
    async moveCard(cardId, newColumnId, newOrder) {
      let updated: DealCard | undefined;
      seedDeals = seedDeals.map((deal) => {
        if (deal.id !== cardId) return deal;
        updated = { ...deal, columnId: newColumnId, order: newOrder ?? deal.order, updatedAt: new Date().toISOString() };
        return updated;
      });
      if (!updated) throw new Error(`Deal ${cardId} not found`);
      return updated;
    },
  };
}
