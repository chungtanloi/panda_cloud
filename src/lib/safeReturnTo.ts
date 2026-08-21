/** Accept only same-origin relative paths for post-auth navigation. */
export function safeReturnTo(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\u007f\u2028\u2029]/.test(raw)) return null;
  return raw;
}
