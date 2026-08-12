/**
 * Minimal class-name joiner — avoids pulling in clsx for one function.
 *
 * Accepts the full set of falsy values JavaScript's `&&` can produce, because
 * call sites commonly guard on a value that is not a boolean:
 *
 *     cn("base", aside && "lg:col-span-8")   // aside: React.ReactNode -> 0 | "" | ...
 *     cn("base", items.length && "gap-4")    // -> 0
 *
 * Only non-empty strings survive the filter, so a stray number or boolean is
 * dropped rather than stringified into the class list.
 */
export type ClassValue = string | number | bigint | boolean | null | undefined;

export function cn(...parts: ClassValue[]): string {
  return parts.filter((part): part is string => typeof part === "string" && part !== "").join(" ");
}
