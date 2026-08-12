"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AssessmentDraft, LivePreview } from "@/models/assessment";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * State for the Land Owner Assessment.
 *
 * Holds the draft answers and the live preview that every step's output panel
 * reads from. The preview is computed by the backend
 * (`POST /assessments/preview`) from whatever has been filled in so far — the
 * frontend never invents an engineering figure.
 *
 * The wizard is route-driven (one URL per step), so navigation is the router's
 * job; this context only owns data.
 */

const STORAGE_KEY = "cp.assessment.draft";
/** Debounce so dragging a slider or typing does not fire a request per keystroke. */
const PREVIEW_DEBOUNCE_MS = 350;

interface AssessmentContextValue {
  draft: AssessmentDraft;
  update: <K extends keyof AssessmentDraft>(step: K, patch: Partial<AssessmentDraft[K]>) => void;
  reset: () => void;
  /** False until the persisted draft has been restored on the client. */
  hydrated: boolean;

  /** Latest server-computed metrics. Fields are absent until their step is answered. */
  preview: LivePreview;
  previewLoading: boolean;
  previewError: NormalizedError | null;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<AssessmentDraft>({});
  const [hydrated, setHydrated] = useState(false);

  const [preview, setPreview] = useState<LivePreview>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<NormalizedError | null>(null);

  // Restore after mount so server and first client render agree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft(JSON.parse(raw) as AssessmentDraft);
    } catch {
      // Corrupt draft — start clean rather than crash the wizard.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  // Recompute the preview whenever the draft changes.
  useEffect(() => {
    if (!hydrated) return;

    // Nothing answered yet — skip the round trip.
    if (Object.keys(draft).length === 0) {
      setPreview({});
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const result = await api.assessment.preview(draft);
        if (!cancelled) setPreview(result);
      } catch (cause) {
        if (!cancelled) setPreviewError(normalizeError(cause));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, hydrated]);

  const update = useCallback<AssessmentContextValue["update"]>((step, patch) => {
    setDraft((prev) => ({
      ...prev,
      [step]: { ...(prev[step] ?? {}), ...patch },
    }));
  }, []);

  const reset = useCallback(() => {
    setDraft({});
    setPreview({});
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ draft, update, reset, hydrated, preview, previewLoading, previewError }),
    [draft, update, reset, hydrated, preview, previewLoading, previewError],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessment(): AssessmentContextValue {
  const context = useContext(AssessmentContext);
  if (!context) throw new Error("useAssessment must be used inside <AssessmentProvider>.");
  return context;
}
