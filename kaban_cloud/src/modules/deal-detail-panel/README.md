# DealDetailPanel

Self-contained "deal detail" slide-over module: pipeline stage selector, due
diligence checklist with a progress banner, primary contact card with quick
Call/Email/Text actions, notes, estimated deal value, and an activity
timeline, with a sticky Save/Advance footer.

It's independent of any specific example in this repo — copy the
`src/modules/deal-detail-panel/` folder into your project (or import it from
this package if you keep it as a dependency) and wire it to your own data.

## Why it's not `detailPanelRender`

`<Kanban detailPanelRender={...} />` renders your content *inside* the
library's own generic slide-over (its own header + close button). This panel
supplies its own header, backdrop, and footer, so plug it in via
`onCardClick` instead — that tells `<Kanban />` not to render its built-in
DetailPanel at all, and you own the open/close state:

```tsx
import { useState } from 'react';
import { Kanban, useKanban } from '@kanban/library';
import { DealDetailPanel, DEAL_STAGES, MOCK_DEAL_CARD, type DealCard } from '@kanban/library/modules/deal-detail-panel';

function DealBoard() {
  const kanban = useKanban<DealCard>(adapter, DEAL_STAGES);
  const [selected, setSelected] = useState<DealCard | null>(null);

  return (
    <>
      <Kanban<DealCard>
        columns={DEAL_STAGES}
        adapter={adapter}
        onCardClick={setSelected}
      />

      {selected && (
        <DealDetailPanel
          card={kanban.cards.find((c) => c.id === selected.id) ?? selected}
          stages={DEAL_STAGES}
          onClose={() => setSelected(null)}
          onStageChange={(stageId) => kanban.moveCard(selected.id, stageId)}
          onChange={(patch) => kanban.updateCard(selected.id, patch)}
          onToggleDueDiligence={(itemId) => {
            const next = selected.dueDiligence?.map((item) =>
              item.id === itemId ? { ...item, status: item.status === 'complete' ? 'not_started' : 'complete' } : item,
            );
            kanban.updateCard(selected.id, { dueDiligence: next });
          }}
          onCall={(contact) => window.open(`tel:${contact.phone}`)}
          onEmail={(contact) => window.open(`mailto:${contact.email}`)}
          saving={kanban.pendingCardIds.has(selected.id)}
        />
      )}
    </>
  );
}
```

`(If you keep this module inside the library package rather than copying it
out, add an export path for it in the library's `package.json`/`vite.config.ts`
— it isn't part of the main `@kanban/library` entry point on purpose, to keep
the core generic library free of CRM-specific concepts like "deal value" or
"due diligence".)`

## Data shape

`DealCard` extends the library's `BaseCard` — see `types.ts`. Every field
beyond `BaseCard` is optional; a section just doesn't render if its data is
missing (no due diligence items → the whole "Due diligence progress" section
is skipped, no `primaryContact` → "No contact yet.", etc.), so you can adopt
fields incrementally instead of having to backfill everything at once.

`mockData.ts` has `DEAL_STAGES` (the 5 pipeline stages from the reference
design) and `MOCK_DEAL_CARD` (reproduces the reference screenshot exactly) —
use them to see the panel rendering real-looking data before your adapter is
wired up.

## Behavior notes

- **Pipeline stage buttons ARE your Kanban columns.** Pass the same array to
  both `stages` here and `columns` on `<Kanban />`. Clicking a stage button
  calls `onStageChange(stageId)` — wire it straight to `moveCard`.
- **Advance** moves to the next stage in `stages` order by default (sorted by
  `order`). Pass your own `onAdvance` to override (e.g. skip a stage, run
  validation first).
- **Save changes** just calls `onSave` — this module doesn't assume an
  autosave-per-field vs. batch-save model; wire it to whatever your project's
  save flow is (or omit `onSave` and rely on `onChange` autosaving per field).
- Every editable control (stage buttons, checklist, notes, deal value,
  footer actions) respects `readOnly` and `saving` — pair with the core
  library's `usePermissions()` the same way `<Kanban canEditCard>` does.
