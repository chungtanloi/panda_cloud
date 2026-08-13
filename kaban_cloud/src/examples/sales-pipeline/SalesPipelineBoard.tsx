import { useMemo, useState } from 'react';
import { Building2, DollarSign } from 'lucide-react';
import { Kanban } from '../../core/components/Kanban';
import type { KanbanUser } from '../../core/types';
import { SALES_COLUMNS, createSalesPipelineAdapter } from './config';
import type { SalesCard } from './types';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface SalesUser extends KanbanUser {
  role: 'admin' | 'rep';
}

const ADMIN: SalesUser = { id: 'user-admin', role: 'admin' };
const REP: SalesUser = { id: 'user-rep', role: 'rep' };

/**
 * Reference implementation showing how a project extends the core library:
 * a domain type (SalesCard), a DataAdapter, and a thin wrapper around
 * <Kanban /> that customizes card + detail rendering. Also demonstrates the
 * v1 permissions system — reps can move/edit deals but only admins can
 * close them out ("Won"/"Lost") or delete a deal.
 */
export function SalesPipelineBoard() {
  const adapter = useMemo(() => createSalesPipelineAdapter(), []);
  const [user, setUser] = useState<SalesUser>(REP);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-kanban-border px-3 py-2 text-xs">
        <span className="text-gray-500">Viewing as:</span>
        <button
          type="button"
          onClick={() => setUser(REP)}
          className={`rounded-md px-2 py-1 font-medium ${user.role === 'rep' ? 'bg-kanban-accent/10 text-kanban-accent' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Sales rep
        </button>
        <button
          type="button"
          onClick={() => setUser(ADMIN)}
          className={`rounded-md px-2 py-1 font-medium ${user.role === 'admin' ? 'bg-kanban-accent/10 text-kanban-accent' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Admin
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <Kanban<SalesCard, SalesUser>
          columns={SALES_COLUMNS}
          adapter={adapter}
          user={user}
          searchFields={['company', 'contactName']}
          // Only admins can move a deal into a closed state (Won/Lost); reps can move freely otherwise.
          canMoveCard={(_card, toColumnId, currentUser) =>
            toColumnId !== 'won' && toColumnId !== 'lost' ? true : currentUser?.role === 'admin'
          }
          canDeleteCard={(_card, currentUser) => currentUser?.role === 'admin'}
          cardRender={(card) => (
            <div className="flex flex-col gap-1.5">
              <p className="truncate text-sm font-medium text-gray-900">{card.title}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Building2 size={12} />
                <span className="truncate">{card.company}</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <DollarSign size={12} />
                <span>{currencyFormatter.format(card.dealValue)}</span>
              </div>
            </div>
          )}
          detailPanelRender={(card, close) => (
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-gray-500">Deal</p>
                <p className="font-semibold text-gray-900">{card.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Company</p>
                <p className="text-gray-800">{card.company}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Contact</p>
                <p className="text-gray-800">{card.contactName}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Value</p>
                <p className="text-gray-800">{currencyFormatter.format(card.dealValue)}</p>
              </div>
              {card.probability != null && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Probability</p>
                  <p className="text-gray-800">{card.probability}%</p>
                </div>
              )}
              <button
                type="button"
                onClick={close}
                className="mt-2 rounded-md border border-kanban-border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}
