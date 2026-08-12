"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Generic multi-step wizard controller, shared by all four flows
 * (Land Owner Assessment, GPU Booking, AI Token Investment, Hyperscale).
 *
 * It owns step navigation and draft persistence only. Each flow supplies its
 * own step definitions and per-step validators, so no flow-specific logic
 * leaks in here.
 */

export interface WizardStep<TDraft> {
  /** URL segment, e.g. "land-profile". */
  id: string;
  /** Small caps eyebrow, e.g. "INFRASTRUCTURE ASSESSMENT". */
  eyebrow: string;
  /** Large serif page title, e.g. "Energy Source". */
  title: string;
  /** Right-hand label under "Step n / N", e.g. "Energy Mix & PPA". */
  subtitle: string;
  /** Returns true when the draft satisfies this step's requirements. */
  isComplete: (draft: TDraft) => boolean;
}

export interface UseWizardOptions<TDraft> {
  steps: ReadonlyArray<WizardStep<TDraft>>;
  initialDraft: TDraft;
  /** localStorage key; omit to disable persistence. */
  storageKey?: string;
}

export function useWizard<TDraft extends object>({
  steps,
  initialDraft,
  storageKey,
}: UseWizardOptions<TDraft>) {
  const [draft, setDraft] = useState<TDraft>(initialDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [hydrated, setHydrated] = useState(!storageKey);

  // Restore a persisted draft after mount so SSR markup and the first client
  // render match (avoids a hydration mismatch).
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setDraft({ ...initialDraft, ...(JSON.parse(raw) as TDraft) });
    } catch {
      // Corrupt draft — discard it and start clean.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, hydrated, storageKey]);

  const patch = useCallback(<K extends keyof TDraft>(key: K, value: TDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const mergeStep = useCallback(<K extends keyof TDraft>(key: K, partial: Partial<TDraft[K]>) => {
    setDraft((prev) => ({
      ...prev,
      [key]: { ...(prev[key] as object), ...(partial as object) } as TDraft[K],
    }));
  }, []);

  const current = steps[stepIndex]!;
  const canGoNext = useMemo(() => current.isComplete(draft), [current, draft]);

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
    },
    [steps.length],
  );

  const clear = useCallback(() => {
    setDraft(initialDraft);
    setStepIndex(0);
    if (storageKey && typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }, [initialDraft, storageKey]);

  return {
    draft,
    setDraft,
    patch,
    mergeStep,
    step: current,
    stepIndex,
    stepNumber: stepIndex + 1,
    totalSteps: steps.length,
    isFirst: stepIndex === 0,
    isLast: stepIndex === steps.length - 1,
    canGoNext,
    next,
    back,
    goTo,
    clear,
    hydrated,
  };
}
