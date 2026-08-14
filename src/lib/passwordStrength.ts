/**
 * Client-side password strength feedback only.
 *
 * This does not change or replace the `minLength(8, "Password")` rule in
 * `lib/validation.ts` — that rule still decides whether the form may submit.
 * This scorer exists purely to give the person a sense of how strong their
 * password is before Clerk (the real authority on the account) accepts it.
 */

export type PasswordStrengthLevel = "empty" | "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthCriterion {
  id: "length" | "number" | "case" | "symbol";
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  /** 0–4, number of criteria met. */
  score: number;
  criteria: PasswordStrengthCriterion[];
}

// Indexed by score (0–4 criteria met); "empty" is handled separately below.
const LEVELS: PasswordStrengthLevel[] = ["weak", "weak", "fair", "good", "strong"];

export function scorePassword(value: string): PasswordStrength {
  const criteria: PasswordStrengthCriterion[] = [
    { id: "length", label: "At least 8 characters", met: value.length >= 8 },
    { id: "number", label: "A number", met: /\d/.test(value) },
    { id: "case", label: "Upper and lower case", met: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { id: "symbol", label: "A symbol", met: /[^A-Za-z0-9]/.test(value) },
  ];

  const score = value.length === 0 ? 0 : criteria.filter((c) => c.met).length;
  const level: PasswordStrengthLevel = value.length === 0 ? "empty" : LEVELS[score] ?? "weak";

  return { level, score, criteria };
}
