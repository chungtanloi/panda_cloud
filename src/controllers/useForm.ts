"use client";

import { useCallback, useState } from "react";
import type { NormalizedError } from "@/models/common";
import { type FieldErrors, type Rules, isEmpty, validate } from "@/lib/validation";

/**
 * Small controlled-form controller: values, touched-state, client rules, and
 * server-side 422 field errors merged into one `errors` map the view renders.
 */
export function useForm<T extends object>(initial: T, rules: Rules<T> = {}) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      // Clear the field's error as soon as the user edits it.
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const blurField = useCallback(
    <K extends keyof T>(key: K) => {
      setTouched((prev) => ({ ...prev, [key]: true }));
      const rule = rules[key];
      if (!rule) return;
      const message = rule(values[key]);
      setErrors((prev) => (message ? { ...prev, [key]: message } : prev));
    },
    [rules, values],
  );

  /** Validate everything; returns true when the form may be submitted. */
  const validateAll = useCallback((): boolean => {
    const found = validate(values, rules);
    setErrors(found);
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>,
      ),
    );
    return isEmpty(found);
  }, [rules, values]);

  /**
   * Bind a validation error's `details[]` onto the form.
   *
   * Entries carrying a `field` land on that input; entries without one are
   * cross-field rules and are returned to the caller so it can show them above
   * the form. Returns true when at least one message was placed, so the caller
   * knows whether it still needs a generic banner.
   */
  const applyServerError = useCallback((error: NormalizedError): boolean => {
    let placed = false;

    if (error.fieldErrors) {
      const mapped: FieldErrors<T> = {};
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        if (messages.length > 0) {
          mapped[field as keyof T] = messages[0];
          placed = true;
        }
      }
      setErrors((prev) => ({ ...prev, ...mapped }));
    }

    return placed;
  }, []);

  const reset = useCallback(() => {
    setValues(initial);
    setErrors({});
    setTouched({});
  }, [initial]);

  return {
    values,
    errors,
    touched,
    setField,
    blurField,
    validateAll,
    applyServerError,
    reset,
    setValues,
  };
}
