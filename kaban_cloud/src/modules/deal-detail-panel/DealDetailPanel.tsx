import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Loader2,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  X,
} from 'lucide-react';
import type { Column } from '../../core/types';
import type { DealCard, DealContact, DueDiligenceStatus } from './types';

export interface DealDetailPanelProps<TCard extends DealCard> {
  card: TCard;
  /** Pipeline stages rendered as buttons; `card.columnId` marks the active one. Pass the same `columns` you give `<Kanban />`. */
  stages: Column[];
  onClose: () => void;
  /** Fires when a stage button is clicked. Wire to `useKanban().moveCard(card.id, stageId)`. */
  onStageChange: (stageId: string) => void;
  /** Patches any field (notes, deal value, ...). Wire to `useKanban().updateCard(card.id, patch)`. */
  onChange?: (patch: Partial<TCard>) => void;
  /** Toggles one due-diligence checklist item between 'complete' and its previous state. */
  onToggleDueDiligence?: (itemId: string) => void;
  onAddContact?: () => void;
  onCall?: (contact: DealContact) => void;
  onEmail?: (contact: DealContact) => void;
  onText?: (contact: DealContact) => void;
  /** "Advance" button. Defaults to moving to the next stage in `stages` order when omitted. */
  onAdvance?: () => void;
  onSave?: () => void;
  onMoreOptions?: () => void;
  /** True while a save/move is in flight — disables the footer actions and shows a spinner on Save. */
  saving?: boolean;
  /** Disables every editable control (stage buttons, checklist, notes, deal value, footer actions). */
  readOnly?: boolean;
  className?: string;
}

const STATUS_LABEL: Record<DueDiligenceStatus, string> = {
  complete: 'Complete',
  pending: 'Pending',
  not_started: 'Not started',
};

const STATUS_COLOR: Record<DueDiligenceStatus, string> = {
  complete: 'text-emerald-600',
  pending: 'text-amber-600',
  not_started: 'text-gray-400',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * Full slide-over "deal detail" panel: pipeline stage selector, due
 * diligence checklist with a progress banner, primary contact card with
 * quick Call/Email/Text actions, notes, estimated deal value, and an
 * activity timeline — with a sticky Save/Advance footer.
 *
 * Self-contained (own backdrop + close button), so use it via `onCardClick`
 * rather than `detailPanelRender` — the latter nests inside the library's
 * own generic header/wrapper, which would double up the chrome this panel
 * already provides:
 *
 *   const [selected, setSelected] = useState<DealCard | null>(null);
 *   <Kanban columns={stages} adapter={adapter} onCardClick={setSelected} />
 *   {selected && (
 *     <DealDetailPanel
 *       card={selected}
 *       stages={stages}
 *       onClose={() => setSelected(null)}
 *       onStageChange={(stageId) => kanban.moveCard(selected.id, stageId)}
 *       onChange={(patch) => kanban.updateCard(selected.id, patch)}
 *     />
 *   )}
 */
export function DealDetailPanel<TCard extends DealCard>({
  card,
  stages,
  onClose,
  onStageChange,
  onChange,
  onToggleDueDiligence,
  onAddContact,
  onCall,
  onEmail,
  onText,
  onAdvance,
  onSave,
  onMoreOptions,
  saving,
  readOnly,
  className,
}: DealDetailPanelProps<TCard>) {
  const [moreOpen, setMoreOpen] = useState(false);
  const sortedStages = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);
  const dueDiligence = card.dueDiligence ?? [];
  const completeCount = dueDiligence.filter((item) => item.status === 'complete').length;
  const contact = card.primaryContact;
  const disabled = Boolean(readOnly) || Boolean(saving);

  const handleAdvance = () => {
    if (onAdvance) {
      onAdvance();
      return;
    }
    const currentIndex = sortedStages.findIndex((s) => s.id === card.columnId);
    const next = sortedStages[currentIndex + 1];
    if (next) onStageChange(next.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className={`flex h-full w-full max-w-md flex-col bg-kanban-surface shadow-xl ${className ?? ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-kanban-border p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-gray-900">{card.title}</h2>
              {card.subtitle && <p className="mt-0.5 truncate text-xs text-gray-500">{card.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          </div>

          {card.tags && card.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {card.tags.map((tag, i) => (
                <span
                  key={tag}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                    i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Pipeline stage */}
          <Section label="Pipeline stage">
            <div className="flex flex-wrap gap-1.5">
              {sortedStages.map((stage) => {
                const active = stage.id === card.columnId;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onStageChange(stage.id)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? 'bg-gray-900 text-white'
                        : 'border border-kanban-border text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {stage.title}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Due diligence */}
          {dueDiligence.length > 0 && (
            <Section label="Due diligence progress">
              <div className="rounded-lg border border-kanban-border">
                {dueDiligence.map((item, i) => {
                  const complete = item.status === 'complete';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={disabled || !onToggleDueDiligence}
                      onClick={() => onToggleDueDiligence?.(item.id)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm disabled:cursor-not-allowed ${
                        i > 0 ? 'border-t border-kanban-border' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2 text-gray-800">
                        {complete ? (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                        ) : (
                          <Circle size={16} className="shrink-0 text-gray-300" />
                        )}
                        {item.label}
                      </span>
                      <span className={`shrink-0 text-xs font-medium ${STATUS_COLOR[item.status]}`}>
                        {STATUS_LABEL[item.status]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <AlertTriangle size={13} className="shrink-0" />
                {completeCount} of {dueDiligence.length} items complete
              </div>
            </Section>
          )}

          {/* Primary contact */}
          <Section
            label="Primary contact"
            action={
              onAddContact && (
                <button type="button" onClick={onAddContact} disabled={disabled} className="flex items-center gap-1 text-xs font-medium text-kanban-accent disabled:opacity-50">
                  <Plus size={12} />
                  Add contact
                </button>
              )
            }
          >
            {contact ? (
              <div className="flex items-start gap-3 rounded-lg border border-kanban-border p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kanban-accent/10 text-xs font-semibold text-kanban-accent">
                  {initials(contact.name)}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  {contact.email && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                      <Mail size={11} className="shrink-0" />
                      {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <Phone size={11} className="shrink-0" />
                      {contact.phone}
                    </p>
                  )}
                  {contact.title && <p className="mt-0.5 text-xs text-gray-400">{contact.title}</p>}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No contact yet.</p>
            )}
          </Section>

          {/* Last contact */}
          {card.lastContactLabel && (
            <Section label="Last contact">
              <div className="flex items-center justify-between rounded-md border border-kanban-border px-3 py-2 text-sm text-gray-700">
                {card.lastContactLabel}
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </Section>
          )}

          {/* Contact method */}
          {contact && (onCall || onEmail || onText) && (
            <Section label="Contact method">
              <div className="grid grid-cols-3 gap-2">
                {onCall && (
                  <ActionButton icon={Phone} label="Call" disabled={disabled} onClick={() => onCall(contact)} />
                )}
                {onEmail && (
                  <ActionButton icon={Mail} label="Email" disabled={disabled} onClick={() => onEmail(contact)} />
                )}
                {onText && (
                  <ActionButton icon={MessageSquare} label="Text" disabled={disabled} onClick={() => onText(contact)} />
                )}
              </div>
            </Section>
          )}

          {/* Project notes */}
          <Section label="Project notes">
            <textarea
              value={card.projectNotes ?? ''}
              disabled={disabled}
              onChange={(e) => onChange?.({ projectNotes: e.target.value } as Partial<TCard>)}
              rows={4}
              className="w-full resize-none rounded-md border border-kanban-border px-3 py-2 text-sm text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Add notes about this deal…"
            />
          </Section>

          {/* Estimated deal value */}
          <Section label="Estimated deal value">
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-md border border-kanban-border px-3 py-2 text-sm text-gray-800">
                <span className="mr-1 text-gray-400">{card.dealValue?.currency ?? '$'}</span>
                <input
                  type="number"
                  value={card.dealValue?.amount ?? ''}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange?.({
                      dealValue: { ...card.dealValue, amount: Number(e.target.value) },
                    } as Partial<TCard>)
                  }
                  className="w-full bg-transparent outline-none disabled:cursor-not-allowed"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-1 items-center justify-between rounded-md border border-kanban-border px-3 py-2 text-sm text-gray-700">
                {card.dealValue?.term ?? 'Select term'}
                <ChevronDown size={14} className="text-gray-400" />
              </div>
            </div>
          </Section>

          {/* Activity timeline */}
          {card.activity && card.activity.length > 0 && (
            <Section label="Activity timeline">
              <ol className="flex flex-col gap-3">
                {card.activity.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-kanban-accent" />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-gray-800">{event.label}</p>
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(event.timestamp)}
                        {event.detail ? ` · ${event.detail}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-2 bg-gray-900 p-3">
          <button
            type="button"
            onClick={onSave}
            disabled={disabled}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            Save changes
          </button>
          <button
            type="button"
            onClick={handleAdvance}
            disabled={disabled}
            className="flex-1 rounded-md border border-white/20 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Advance
          </button>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => (onMoreOptions ? onMoreOptions() : setMoreOpen((v) => !v))}
              aria-label="More options"
              className="rounded-md p-2 text-white hover:bg-white/10"
            >
              <MoreHorizontal size={16} />
            </button>
            {moreOpen && !onMoreOptions && (
              <div className="absolute bottom-full right-0 mb-1 w-32 rounded-md border border-kanban-border bg-kanban-surface py-1 text-xs shadow-lg">
                <p className="px-3 py-1.5 text-gray-400">No actions wired</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Phone;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-md border border-kanban-border py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
