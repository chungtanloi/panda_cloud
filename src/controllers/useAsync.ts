"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AsyncState, NormalizedError } from "@/models/common";
import { normalizeError } from "@/services/api";

/**
 * Wraps a promise-returning function in the four-state machine every screen
 * needs: idle → loading → success | error.
 *
 * Views never see a thrown error; they branch on `state.status`, which is what
 * makes the loading / error / empty states uniform across the app.
 */
export function useAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: { immediate?: TArgs } = {},
) {
  const [state, setState] = useState<AsyncState<TResult>>({ status: "idle" });

  // Ignore results from a superseded call so fast typing cannot render stale data.
  const callId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      const id = ++callId.current;
      setState({ status: "loading" });
      try {
        const data = await fn(...args);
        if (!mounted.current || id !== callId.current) return undefined;
        setState({ status: "success", data });
        return data;
      } catch (cause) {
        if (!mounted.current || id !== callId.current) return undefined;
        setState({ status: "error", error: normalizeError(cause) });
        return undefined;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    callId.current++;
    setState({ status: "idle" });
  }, []);

  const immediate = options.immediate;
  useEffect(() => {
    if (immediate) void run(...immediate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    state,
    run,
    reset,
    isLoading: state.status === "loading",
    data: state.status === "success" ? state.data : undefined,
    error: state.status === "error" ? state.error : undefined,
  } as {
    state: AsyncState<TResult>;
    run: (...args: TArgs) => Promise<TResult | undefined>;
    reset: () => void;
    isLoading: boolean;
    data: TResult | undefined;
    error: NormalizedError | undefined;
  };
}
