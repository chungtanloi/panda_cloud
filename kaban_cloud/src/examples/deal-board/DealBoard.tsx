import { useMemo, useState } from 'react';
import { Building2 } from 'lucide-react';
import { Kanban } from '../../core/components/Kanban';
import { useKanban } from '../../core/hooks/useKanban';
import { DealDetailPanel } from '../../modules/deal-detail-panel/DealDetailPanel';
import type { DealCard } from '../../modules/deal-detail-panel/types';
import { DEAL_STAGES, createDealBoardAdapter } from './config';

/**
 * Dev-only preview wiring the DealDetailPanel module into a live board —
 * shows the panel exactly as it'll look wired into a real app. Not part of
 * the published package; see src/modules/deal-detail-panel/README.md for
 * the actual integration guide.
 */
export function DealBoard() {
  const adapter = useMemo(() => createDealBoardAdapter(), []);
  const kanban = useKanban<DealCard>(adapter, DEAL_STAGES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = kanban.cards.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col">
      <Kanban<DealCard>
        columns={DEAL_STAGES}
        adapter={adapter}
        onCardClick={(card) => setSelectedId(card.id)}
        searchFields={['subtitle']}
        cardRender={(card) => (
          <div className="flex flex-col gap-1">
            <p className="truncate text-sm font-medium text-gray-900">{card.title}</p>
            {card.subtitle && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Building2 size={12} />
                <span className="truncate">{card.subtitle}</span>
              </div>
            )}
            {card.dealValue && card.dealValue.amount > 0 && (
              <p className="text-xs font-semibold text-emerald-600">
                {card.dealValue.currency ?? '$'}
                {card.dealValue.amount.toLocaleString()}
              </p>
            )}
          </div>
        )}
      />

      {selected && (
        <DealDetailPanel
          card={selected}
          stages={DEAL_STAGES}
          onClose={() => setSelectedId(null)}
          onStageChange={(stageId) => void kanban.moveCard(selected.id, stageId)}
          onChange={(patch) => void kanban.updateCard(selected.id, patch)}
          onToggleDueDiligence={(itemId) => {
            const next = (selected.dueDiligence ?? []).map((item) =>
              item.id === itemId ? { ...item, status: item.status === 'complete' ? ('not_started' as const) : ('complete' as const) } : item,
            );
            void kanban.updateCard(selected.id, { dueDiligence: next });
          }}
          onAddContact={() => window.alert('Wire this to your own "add contact" flow.')}
          onCall={(contact) => contact.phone && window.open(`tel:${contact.phone}`)}
          onEmail={(contact) => contact.email && window.open(`mailto:${contact.email}`)}
          onText={(contact) => contact.phone && window.open(`sms:${contact.phone}`)}
          onSave={() => setSelectedId(null)}
          saving={kanban.pendingCardIds.has(selected.id)}
        />
      )}
    </div>
  );
}
