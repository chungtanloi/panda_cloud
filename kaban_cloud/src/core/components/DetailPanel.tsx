import { Loader2, Trash2, X } from 'lucide-react';
import type { BaseCard } from '../types';
import { useDelayedFlag } from '../hooks/useDelayedFlag';

export interface DetailPanelProps<TCard extends BaseCard> {
  card: TCard | null;
  onClose: () => void;
  onChange?: (patch: Partial<TCard>) => void;
  render?: (card: TCard, close: () => void) => React.ReactNode;
  /** True while the full card record is still being fetched (e.g. a lazy `fetchCardDetail`). */
  loading?: boolean;
  /** True while a patch to this card is being persisted — disables inputs/buttons so edits don't race. */
  saving?: boolean;
  /** True when the current user can't edit this card; disables the built-in form. */
  readOnly?: boolean;
  /** Present (and permitted) only when the current user can delete this card; renders a Delete button. */
  onDelete?: () => void;
}

const HIDDEN_FIELDS = new Set(['id', 'title', 'columnId', 'order', 'createdAt', 'updatedAt']);

/**
 * Default slide-over shown when a card is clicked. Renders the title as an
 * editable field plus every extra field the extended card type carries.
 * Pass `detailPanelRender` on <Kanban /> to replace this entirely with a
 * project-specific layout (e.g. a Sales deal form with stage/value/contact).
 */
export function DetailPanel<TCard extends BaseCard>({
  card,
  onClose,
  onChange,
  render,
  loading,
  saving,
  readOnly,
  onDelete,
}: DetailPanelProps<TCard>) {
  // Only show a spinner once loading/saving has actually taken a noticeable
  // amount of time (>2s) — most patches resolve instantly and a flashing
  // spinner would just be noise.
  const showLoadingSpinner = useDelayedFlag(Boolean(loading));
  const showSavingSpinner = useDelayedFlag(Boolean(saving));
  const disabled = Boolean(saving) || Boolean(readOnly);

  if (!card) return null;

  const extraEntries = Object.entries(card).filter(([key]) => !HIDDEN_FIELDS.has(key));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-sm flex-col overflow-y-auto bg-kanban-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">Card details</h2>
            {readOnly && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                Read-only
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12 text-sm text-gray-400">
            {showLoadingSpinner ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading…
              </span>
            ) : (
              'Loading…'
            )}
          </div>
        ) : render ? (
          render(card, onClose)
        ) : (
          <fieldset disabled={disabled} className="flex flex-col gap-3 disabled:opacity-60">
            <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
              Title
              <input
                className="rounded-md border border-kanban-border px-2 py-1 text-sm text-gray-900"
                value={card.title}
                onChange={(e) => onChange?.({ title: e.target.value } as Partial<TCard>)}
              />
            </label>

            {extraEntries.map(([key, value]) => (
              <div key={key} className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                {key}
                <span className="text-sm font-normal text-gray-800">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}

            {saving && (
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                {showSavingSpinner && <Loader2 size={12} className="animate-spin" />}
                Saving…
              </p>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="mt-2 flex items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={12} />
                Delete card
              </button>
            )}
          </fieldset>
        )}
      </div>
    </div>
  );
}
