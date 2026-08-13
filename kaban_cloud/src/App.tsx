import { useState } from 'react';
import { DealBoard } from './examples/deal-board/DealBoard';
import { SalesPipelineBoard } from './examples/sales-pipeline/SalesPipelineBoard';

type BoardView = 'deal' | 'sales';

/**
 * Web app entry component (used by `src/main.tsx`).
 *
 * Lets the user switch between the two board implementations already built
 * on top of the core Kanban library — `DealBoard` (wires the
 * `DealDetailPanel` module into a live board) and `SalesPipelineBoard`
 * (permissions + custom card/detail rendering demo). Both boards use the
 * existing `<Kanban />` component, `useKanban` hook, drag-and-drop, and
 * in-memory `DataAdapter`s from `src/examples/*`, unmodified.
 */
export default function App() {
  const [view, setView] = useState<BoardView>('deal');

  return (
    <div className="flex h-screen flex-col bg-kanban-bg">
      <header className="flex items-center gap-2 border-b border-kanban-border bg-kanban-surface px-3 py-2 text-xs">
        <span className="font-semibold text-gray-700">Kanban Cloud</span>
        <span className="text-gray-300">|</span>
        <span className="text-gray-500">Board:</span>
        <button
          type="button"
          onClick={() => setView('deal')}
          className={`rounded-md px-2 py-1 font-medium ${
            view === 'deal' ? 'bg-kanban-accent/10 text-kanban-accent' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Deal Board
        </button>
        <button
          type="button"
          onClick={() => setView('sales')}
          className={`rounded-md px-2 py-1 font-medium ${
            view === 'sales' ? 'bg-kanban-accent/10 text-kanban-accent' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          Sales Pipeline
        </button>
      </header>
      <div className="min-h-0 flex-1">{view === 'deal' ? <DealBoard /> : <SalesPipelineBoard />}</div>
    </div>
  );
}
