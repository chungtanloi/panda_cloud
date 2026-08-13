import type { Column } from '../../core/types';
import type { DealCard } from './types';

/** Pipeline stages matching the reference design — pass the same array as `stages` and as your `<Kanban columns={...} />`. */
export const DEAL_STAGES: Column[] = [
  { id: 'new_lead', title: 'New Lead', order: 0 },
  { id: 'qualified', title: 'Qualified', order: 1 },
  { id: 'evaluation', title: 'Evaluation', order: 2 },
  { id: 'negotiation', title: 'Negotiation', order: 3 },
  { id: 'closed', title: 'Closed', order: 4 },
];

/** Sample data reproducing the reference screenshot, for wiring/testing the panel before real data is connected. */
export const MOCK_DEAL_CARD: DealCard = {
  id: 'deal-coreweave',
  title: 'CoreWeave Partnership',
  subtitle: 'CoreWeave Inc. — Hyperscaler',
  columnId: 'new_lead',
  order: 0,
  createdAt: '2024-12-18T14:45:00.000Z',
  updatedAt: '2025-01-06T10:00:00.000Z',
  tags: ['Hyperscale', 'Inbound'],
  dueDiligence: [
    { id: 'nda', label: 'NDA Signed', status: 'pending' },
    { id: 'kyc', label: 'KYC Verification', status: 'not_started' },
    { id: 'compliance', label: 'Compliance Review', status: 'not_started' },
    { id: 'technical', label: 'Technical Evaluation', status: 'not_started' },
  ],
  primaryContact: {
    name: 'John McCarthy',
    title: 'VP Sales, CoreWeave',
    email: 'john.mccarthy@coreweave.io',
    phone: '+1 (410) 555-0192',
  },
  lastContactLabel: '2 days ago',
  projectNotes:
    'Inbound inquiry for 50k GPU slots. Interested in H100 capacity. Company expanding AI training division. Budget allocated for Q1 2025 deployment. Initial contact via website form.',
  dealValue: { amount: 0, currency: '$', term: '1-year contract' },
  activity: [
    { id: 'a1', label: 'Lead Created', timestamp: '2024-12-18T14:45:00.000Z' },
    { id: 'a2', label: 'Initial Email Sent', timestamp: '2024-12-19T10:30:00.000Z' },
    { id: 'a3', label: 'Contact Response', timestamp: '2024-12-20T14:15:00.000Z', detail: 'John McCarthy replied' },
    { id: 'a4', label: 'Meeting Scheduled', timestamp: '2025-01-06T10:00:00.000Z' },
  ],
};
