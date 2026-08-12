"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Factory for the wizard draft contexts.
 *
 * The Investment and Hyperscale flows need the same three behaviours the
 * Assessment flow already has — hold a partial draft, persist it, merge patches
 * per step — so they share one implementation rather than three near-identical
 * providers.
 *
 * Flows with extra behaviour (the Assessment's server-computed preview, the
 * Booking flow's catalogue + quote) keep their own bespoke context.
 */
export function createFlowContext<TDraft extends object>(name: string, storageKey: string) {
  interface FlowContextValue {
    draft: TDraft;
    update: <K extends keyof TDraft>(step: K, patch: Partial<TDraft[K]>) => void;
    /** Replace a whole step rather than merging into it. */
    set: <K extends keyof TDraft>(step: K, value: TDraft[K]) => void;
    reset: () => void;
    /** False until the persisted draft has been restored on the client. */
    hydrated: boolean;
  }

  const Context = createContext<FlowContextValue | null>(null);

  function Provider({ children }: { children: React.ReactNode }) {
    const [draft, setDraft] = useState<TDraft>({} as TDraft);
    const [hydrated, setHydrated] = useState(false);

    // Restore after mount so server and first client render agree.
    useEffect(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) setDraft(JSON.parse(raw) as TDraft);
      } catch {
        // Corrupt draft — start clean rather than crash the wizard.
      }
      setHydrated(true);
    }, []);

    useEffect(() => {
      if (!hydrated) return;
      window.localStorage.setItem(storageKey, JSON.stringify(draft));
    }, [draft, hydrated]);

    const update = useCallback<FlowContextValue["update"]>((step, patch) => {
      setDraft((prev) => ({
        ...prev,
        [step]: { ...((prev[step] ?? {}) as object), ...(patch as object) },
      }));
    }, []);

    const set = useCallback<FlowContextValue["set"]>((step, value) => {
      setDraft((prev) => ({ ...prev, [step]: value }));
    }, []);

    const reset = useCallback(() => {
      setDraft({} as TDraft);
      window.localStorage.removeItem(storageKey);
    }, []);

    const value = useMemo(
      () => ({ draft, update, set, reset, hydrated }),
      [draft, update, set, reset, hydrated],
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
  }

  function useFlow(): FlowContextValue {
    const context = useContext(Context);
    if (!context) throw new Error(`use${name} must be used inside <${name}Provider>.`);
    return context;
  }

  return { Provider, useFlow };
}
