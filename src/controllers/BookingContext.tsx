"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { BookingDraft, BookingQuote, GpuModel } from "@/models/booking";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * State for the GPU Cluster Booking wizard.
 *
 * Owns three things: the draft answers, the GPU catalogue (fetched once), and
 * the live quote. The quote is recomputed by the backend whenever the draft
 * changes — the frontend does not price anything itself.
 */

const STORAGE_KEY = "cp.booking.draft";
const QUOTE_DEBOUNCE_MS = 300;
const GPU_ID_ALIASES: Record<string, string> = {
  "nvidia-h100-80gb": "h100",
  "nvidia-h100": "h100",
  "h100-sxm": "h100",
  "nvidia-h200-141gb": "h200",
  "nvidia-b200-192gb": "b200",
};

interface BookingContextValue {
  draft: BookingDraft;
  update: <K extends keyof BookingDraft>(step: K, patch: Partial<BookingDraft[K]>) => void;
  reset: () => void;
  hydrated: boolean;

  /** GPU catalogue, loaded once on mount. */
  models: GpuModel[];
  modelsLoading: boolean;
  /** Convenience lookup for the currently selected model. */
  selectedModel: GpuModel | null;

  quote: BookingQuote | null;
  quoteLoading: boolean;
  error: NormalizedError | null;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>({});
  const [hydrated, setHydrated] = useState(false);

  const [models, setModels] = useState<GpuModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);

  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setDraft(JSON.parse(raw) as BookingDraft);
    } catch {
      // Corrupt draft — start clean rather than crash the wizard.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  // Catalogue is static per session — one request, reused by steps 2–5.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await api.booking.listGpuModels();
        if (!cancelled) {
          setModels(result);
          setDraft((previous) => {
            const currentId = previous.hardware?.gpuModelId;
            if (!currentId) return previous;
            const normalizedId = GPU_ID_ALIASES[currentId] ?? currentId;
            if (!result.some((model) => model.id === normalizedId) || normalizedId === currentId) return previous;
            return { ...previous, hardware: { ...previous.hardware, gpuModelId: normalizedId } };
          });
        }
      } catch (cause) {
        if (!cancelled) {
          setError(normalizeError(cause));
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Re-quote on every draft change, debounced so dragging the GPU slider does
  // not fire a request per pixel.
  useEffect(() => {
    if (!hydrated) return;

    // Pricing needs a model and a count; before that there is nothing to quote.
    const catalogModel = models.find((model) => model.id === draft.hardware?.gpuModelId);
    if (!catalogModel || !draft.scale?.gpuCount) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const result = await api.booking.quote(draft);
        if (!cancelled) setQuote(result);
      } catch (cause) {
        if (!cancelled) {
          setQuote(null);
          setError(normalizeError(cause));
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draft, hydrated, models]);

  const update = useCallback<BookingContextValue["update"]>((step, patch) => {
    setDraft((prev) => ({ ...prev, [step]: { ...(prev[step] ?? {}), ...patch } }));
  }, []);

  const reset = useCallback(() => {
    setDraft({});
    setQuote(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const selectedModel = useMemo(
    () => models.find((model) => model.id === draft.hardware?.gpuModelId) ?? null,
    [models, draft.hardware?.gpuModelId],
  );

  const value = useMemo(
    () => ({
      draft,
      update,
      reset,
      hydrated,
      models,
      modelsLoading,
      selectedModel,
      quote,
      quoteLoading,
      error,
    }),
    [draft, update, reset, hydrated, models, modelsLoading, selectedModel, quote, quoteLoading, error],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) throw new Error("useBooking must be used inside <BookingProvider>.");
  return context;
}
