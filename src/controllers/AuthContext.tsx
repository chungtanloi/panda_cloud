"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoginRequest, SignUpRequest, User, UserPath } from "@/models/auth";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError, tokenStore } from "@/services/api";

/**
 * Session state for the whole app. Holds the authenticated user and exposes
 * the auth operations; token persistence itself lives in `services/tokenStore`.
 */

interface AuthContextValue {
  user: User | null;
  /** True until the initial session restore finishes. */
  initializing: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  signUp: (payload: SignUpRequest) => Promise<User>;
  choosePath: (path: UserPath) => Promise<User>;
  logout: () => Promise<void>;
  error: NormalizedError | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<NormalizedError | null>(null);

  // Restore the session on first mount when a non-expired token exists.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!tokenStore.isValid()) {
        setInitializing(false);
        return;
      }
      try {
        const me = await api.auth.me();
        if (!cancelled) setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    setError(null);
    try {
      const session = await api.auth.login(payload);
      tokenStore.set(session.tokens);
      setUser(session.user);
      return session.user;
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(normalized);
      throw cause;
    }
  }, []);

  const signUp = useCallback(async (payload: SignUpRequest) => {
    setError(null);
    try {
      const session = await api.auth.signUp(payload);
      tokenStore.set(session.tokens);
      setUser(session.user);
      return session.user;
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(normalized);
      throw cause;
    }
  }, []);

  const choosePath = useCallback(async (path: UserPath) => {
    const updated = await api.auth.choosePath({ path });
    setUser(updated);
    return updated;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      // Clear locally even if the server call fails — the user asked to leave.
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      isAuthenticated: user !== null,
      login,
      signUp,
      choosePath,
      logout,
      error,
    }),
    [user, initializing, login, signUp, choosePath, logout, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
