import type { Column, DataAdapter } from '../../core/types';
import type { SalesCard } from './types';

export const SALES_COLUMNS: Column[] = [
  { id: 'lead', title: 'Lead', order: 0, color: '#94a3b8' },
  { id: 'qualified', title: 'Qualified', order: 1, color: '#60a5fa' },
  { id: 'proposal', title: 'Proposal', order: 2, color: '#facc15' },
  { id: 'negotiation', title: 'Negotiation', order: 3, color: '#fb923c', cardLimit: 8 },
  { id: 'won', title: 'Won', order: 4, color: '#4ade80' },
  { id: 'lost', title: 'Lost', order: 5, color: '#f87171' },
];

const now = new Date().toISOString();

let seedDeals: SalesCard[] = [
  {
    id: 'deal-1',
    title: 'Acme Corp — Platform license',
    columnId: 'lead',
    order: 0,
    createdAt: now,
    updatedAt: now,
    company: 'Acme Corp',
    contactName: 'Jane Doe',
    dealValue: 24000,
    currency: 'USD',
    probability: 20,
  },
  {
    id: 'deal-2',
    title: 'Globex — Annual renewal',
    columnId: 'qualified',
    order: 0,
    createdAt: now,
    updatedAt: now,
    company: 'Globex',
    contactName: 'John Smith',
    dealValue: 58000,
    currency: 'USD',
    probability: 45,
  },
  {
    id: 'deal-3',
    title: 'Initech — Expansion',
    columnId: 'proposal',
    order: 0,
    createdAt: now,
    updatedAt: now,
    company: 'Initech',
    contactName: 'Michael Bolton',
    dealValue: 15000,
    currency: 'USD',
    probability: 60,
  },
];

/**
 * In-memory DataAdapter so this example runs standalone with no backend.
 * Swap this for `createFetchApiAdapter` or `createSupabaseAdapter` (see
 * `src/adapters/`) to persist against a real API.
 */
export function createSalesPipelineAdapter(): DataAdapter<SalesCard> {
  return {
    async fetchColumns() {
      return SALES_COLUMNS;
    },
    async fetchCards() {
      return seedDeals;
    },
    async createCard(data) {
      const card: SalesCard = {
        id: `deal-${Date.now()}`,
        title: data.title ?? 'Untitled deal',
        columnId: data.columnId ?? 'lead',
        order: data.order ?? seedDeals.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        company: data.company ?? '',
        contactName: data.contactName ?? '',
        dealValue: data.dealValue ?? 0,
        ...data,
      };
      seedDeals = [...seedDeals, card];
      return card;
    },
    async updateCard(id, patch) {
      let updated: SalesCard | undefined;
      seedDeals = seedDeals.map((deal) => {
        if (deal.id !== id) return deal;
        updated = { ...deal, ...patch, updatedAt: new Date().toISOString() };
        return updated;
      });
      if (!updated) throw new Error(`Deal ${id} not found`);
      return updated;
    },
    async moveCard(cardId, newColumnId, newOrder) {
      let updated: SalesCard | undefined;
      seedDeals = seedDeals.map((deal) => {
        if (deal.id !== cardId) return deal;
        updated = { ...deal, columnId: newColumnId, order: newOrder ?? deal.order, updatedAt: new Date().toISOString() };
        return updated;
      });
      if (!updated) throw new Error(`Deal ${cardId} not found`);
      return updated;
    },
    async deleteCard(id) {
      seedDeals = seedDeals.filter((deal) => deal.id !== id);
    },
  };
}
