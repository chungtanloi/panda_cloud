import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { SalesPipelineBoard } from '../examples/sales-pipeline/SalesPipelineBoard';
import { DealBoard } from '../examples/deal-board/DealBoard';
import '../styles.css';

// Dev-only entry point (`npm run dev`). Not part of the published package.
// Toggle between the two bundled examples: the original Sales Pipeline
// (simple built-in form panel) and the newer Deal Board, which wires the
// DealDetailPanel module (src/modules/deal-detail-panel/) into a live board.
function DevPreview() {
  const [view, setView] = useState<'deal' | 'sales'>('deal');

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center gap-2 border-b border-kanban-border px-3 py-2 text-xs">
        <span className="text-gray-500">Preview:</span>
        <button
          type="button"
          onClick={() => setView('deal')}
          className={`rounded-md px-2 py-1 font-medium ${view === 'deal' ? 'bg-kanban-accent/10 text-kanban-accent' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Deal Board (DealDetailPanel)
        </button>
        <button
          type="button"
          onClick={() => setView('sales')}
          className={`rounded-md px-2 py-1 font-medium ${view === 'sales' ? 'bg-kanban-accent/10 text-kanban-accent' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Sales Pipeline (form panel)
        </button>
      </div>
      <div className="min-h-0 flex-1">{view === 'deal' ? <DealBoard /> : <SalesPipelineBoard />}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DevPreview />
  </React.StrictMode>,
);
