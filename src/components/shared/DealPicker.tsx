"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/Field";
import {
  LOOKUP_MIN_QUERY_LENGTH,
  isLookupForbidden,
  isLookupQueryReady,
  type DealLookupItem,
} from "@/models/lookup";
import { normalizeError } from "@/services/api";
import { lookup } from "@/services/lookup";

/**
 * Search-and-select for a deal.
 *
 * ⚠ WHY THIS EXISTS.
 *
 * Until 2026-08-18 several screens asked a human to paste an opaque Convex key
 * such as `ms767yfjnrhn1xfkt3c1stzrgs8ch435`, because no lookup operation
 * existed. `GET /api/v1/lookups/deals` now does, so those fields become a
 * typeahead and nobody has to carry an identifier between screens.
 *
 * ⚠ WHY IT STILL HAS A PASTE-AN-ID FALLBACK.
 *
 * The lookup calls `resolveKanbanScope`, which **fails closed** for the legal,
 * compliance and technical roles — the exact three whose workspaces most need a
 * deal picker. They receive `REQUIRES_RESOURCE_SCOPE` → 403. Rather than show
 * those users a search box that can only ever fail, the component detects the
 * 403 once, says why in one line, and falls back to the identifier field they
 * had before. When the backend widens the scope, the fallback stops appearing
 * on its own and no frontend file changes.
 *
 * Requests start only at `LOOKUP_MIN_QUERY_LENGTH`, because a shorter `q` is a
 * 400 on the wire; firing it anyway would trade a silent failure for a visible
 * one and teach the user nothing.
 */
export function DealPicker({
  label = "Deal",
  hint,
  onSelect,
  autoFocus,
}: {
  label?: string;
  hint?: string;
  onSelect: (deal: { dealId: string; title?: string }) => void;
  autoFocus?: boolean;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<readonly DealLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");

  // Guards against an out-of-order response overwriting a newer one: only the
  // most recent request may write state.
  const latest = useRef(0);

  const search = useCallback(async (value: string) => {
    const ticket = ++latest.current;
    if (!isLookupQueryReady(value)) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const page = await lookup.deals({ q: value });
      if (ticket !== latest.current) return;
      setItems(page.items);
    } catch (cause) {
      if (ticket !== latest.current) return;
      const normalized = normalizeError(cause);
      if (isLookupForbidden(normalized.status, normalized.code)) {
        setForbidden(true);
        setItems([]);
        return;
      }
      setError(normalized.message);
      setItems([]);
    } finally {
      if (ticket === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (forbidden) return;
    const timer = setTimeout(() => void search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search, forbidden]);

  if (forbidden) {
    return (
      <div className="grid gap-2">
        <Input
          label={`${label} ID`}
          value={manualId}
          onChange={(event) => setManualId(event.target.value)}
          onBlur={() => {
            const value = manualId.trim();
            if (value) onSelect({ dealId: value });
          }}
          placeholder="deal_xxx"
          hint="Paste the identifier from a deal link or handoff message."
        />
        <p className="text-xs leading-5 text-amber-300">
          Deal search is not available to your role: the backend&apos;s deal scope is undefined for
          legal, compliance and technical, so the lookup answers 403. Paste an identifier until that
          is resolved.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Input
        label={label}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by deal or company name"
        hint={hint ?? `Type at least ${LOOKUP_MIN_QUERY_LENGTH} characters.`}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
      />

      {loading ? <p className="text-xs text-ink-faint">Searching…</p> : null}
      {error ? (
        <p role="alert" className="text-xs leading-5 text-red-400">
          {error}
        </p>
      ) : null}
      {!loading && !error && isLookupQueryReady(query) && items.length === 0 ? (
        <p className="text-xs text-ink-faint">No deal matches that search.</p>
      ) : null}

      {items.length > 0 ? (
        <ul id={listId} role="listbox" className="grid gap-1 rounded-[16px] border border-line bg-surface p-1">
          {items.map((item) => (
            <li key={item.dealId}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onSelect({ dealId: item.dealId, title: item.title })}
                className="w-full rounded-[12px] px-3 py-2 text-left transition-colors hover:bg-accent-soft"
              >
                <span className="block truncate text-sm text-ink">{item.title}</span>
                <span className="block truncate text-xs text-ink-dim">
                  {item.organizationName} · {item.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
