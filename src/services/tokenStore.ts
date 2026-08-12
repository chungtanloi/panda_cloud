import type { AuthTokens } from "@/models/auth";

/**
 * Token persistence, isolated behind a tiny interface so the storage strategy
 * (localStorage today, httpOnly cookies later) can change without touching the
 * HTTP client or any controller.
 *
 * All access is SSR-safe: on the server `window` is undefined and every read
 * returns null rather than throwing.
 */

const ACCESS_KEY = "cp.accessToken";
const REFRESH_KEY = "cp.refreshToken";
const EXPIRY_KEY = "cp.expiresAt";

type Listener = (tokens: AuthTokens | null) => void;

const listeners = new Set<Listener>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emit(tokens: AuthTokens | null): void {
  listeners.forEach((fn) => fn(tokens));
}

export const tokenStore = {
  get(): AuthTokens | null {
    if (!isBrowser()) return null;
    const accessToken = window.localStorage.getItem(ACCESS_KEY);
    const refreshToken = window.localStorage.getItem(REFRESH_KEY);
    if (!accessToken || !refreshToken) return null;

    const expiresAt = Number.parseInt(window.localStorage.getItem(EXPIRY_KEY) ?? "", 10);
    const expiresIn = Number.isFinite(expiresAt)
      ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      : 0;

    return { accessToken, refreshToken, expiresIn, tokenType: "Bearer" };
  },

  set(tokens: AuthTokens): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(ACCESS_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
    window.localStorage.setItem(EXPIRY_KEY, String(Date.now() + tokens.expiresIn * 1000));
    emit(tokens);
  },

  clear(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(EXPIRY_KEY);
    emit(null);
  },

  /** True when a token exists and has not yet expired. */
  isValid(): boolean {
    const tokens = this.get();
    return tokens !== null && tokens.expiresIn > 0;
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
