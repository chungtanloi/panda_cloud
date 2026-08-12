/**
 * Framework-free validation primitives.
 *
 * These express *client-side* rules only — they exist to give immediate
 * feedback, not to enforce anything. The backend re-validates everything and
 * its 422 `details` map is merged over these results by `useForm`.
 */

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type Validator<V> = (value: V) => string | undefined;

export type Rules<T> = { [K in keyof T]?: Validator<T[K]> };

/** Run a rule set over a value object, returning only the failing fields. */
export function validate<T extends object>(values: T, rules: Rules<T>): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const key of Object.keys(rules) as Array<keyof T>) {
    const rule = rules[key];
    if (!rule) continue;
    const message = rule(values[key]);
    if (message) errors[key] = message;
  }
  return errors;
}

export function isEmpty<T extends object>(errors: FieldErrors<T>): boolean {
  return Object.keys(errors).length === 0;
}

/* --------------------------- Common validators -------------------------- */

export const required =
  (label = "This field"): Validator<unknown> =>
  (value) => {
    if (value === undefined || value === null) return `${label} is required.`;
    if (typeof value === "string" && value.trim() === "") return `${label} is required.`;
    if (Array.isArray(value) && value.length === 0) return `${label} is required.`;
    return undefined;
  };

// Deliberately permissive: the server is the authority on deliverability.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const email = (): Validator<string> => (value) => {
  if (!value?.trim()) return "Email is required.";
  if (!EMAIL_RE.test(value.trim())) return "Enter a valid email address.";
  return undefined;
};

export const minLength =
  (n: number, label = "This field"): Validator<string> =>
  (value) => {
    if (!value || value.length < n) return `${label} must be at least ${n} characters.`;
    return undefined;
  };

export const positiveNumber =
  (label = "This field"): Validator<number | undefined> =>
  (value) => {
    if (value === undefined || Number.isNaN(value)) return `${label} is required.`;
    if (value <= 0) return `${label} must be greater than zero.`;
    return undefined;
  };

export const numberInRange =
  (min: number, max: number, label = "This field"): Validator<number | undefined> =>
  (value) => {
    if (value === undefined || Number.isNaN(value)) return `${label} is required.`;
    if (value < min || value > max) return `${label} must be between ${min} and ${max}.`;
    return undefined;
  };

export const oneOf =
  <V extends string>(allowed: readonly V[], label = "A selection"): Validator<V | undefined> =>
  (value) => {
    if (!value || !allowed.includes(value)) return `${label} is required.`;
    return undefined;
  };
