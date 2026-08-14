"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuthenticatedUser, AuthProfile } from "@/models/auth";
import type { NormalizedError } from "@/models/common";
import { api, normalizeError } from "@/services/api";

/**
 * Business identity for the whole app.
 *
 * Division of responsibility (ADR-001, PHASE_1_FRONTEND_AUTH_HANDOFF):
 *
 *   Clerk        -> credentials, session, refresh, MFA, sign-out
 *   this context -> PandaCloud profile + authorization, from GET /api/v1/auth/me
 *
 * Authentication is not authorization. `isAuthenticated` only means Clerk has a
 * session; what the identity may *do* comes from `profile.authorization`, which
 * the gateway derives from the verified JWT subject and the active Convex
 * organization memberships. The frontend never sends or chooses a role.
 *
 * The Clerk session itself is injected as `session` rather than read here, so
 * this controller has no direct dependency on the Clerk SDK and the mock-only
 * standalone mode needs no conditional hooks.
 */

/** Minimal session shape this controller needs from the identity provider. */
export interface SessionState {
  isLoaded: boolean;
  isSignedIn: boolean;
  /** Opaque provider subject. Used only to re-fetch when the identity changes. */
  userId: string | null;
  signOut: () => Promise<void>;
}

interface AuthContextValue {
  /** Full `/auth/me` payload, or null when signed out / unavailable. */
  profile: AuthProfile | null;
  /** Convenience accessor for display code. Authorization lives on `profile`. */
  user: AuthenticatedUser | null;
  /** True until the session and the first `/auth/me` have both settled. */
  initializing: boolean;
  /** The provider reports an active session. Says nothing about permissions. */
  isAuthenticated: boolean;
  /** Re-fetches `/auth/me` and returns the fresh profile. */
  reload: () => Promise<AuthProfile | null>;
  /** Provider sign-out. PandaCloud holds no session state of its own to clear. */
  signOut: () => Promise<void>;
  error: NormalizedError | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  session,
  children,
}: {
  session: SessionState;
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState<NormalizedError | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<AuthProfile | null> => {
    setLoadingProfile(true);
    setError(null);
    try {
      const next = await api.auth.me();
      if (mounted.current) setProfile(next);
      return next;
    } catch (cause) {
      // 401 -> no valid session; 403 -> suspended/disabled; 409 -> the identity
      // cannot be mapped. All three mean "no usable profile", and every guard
      // fails closed. The normalized error carries the correlation id required
      // on an integration defect ticket (collaboration workflow § 18).
      if (mounted.current) {
        setProfile(null);
        setError(normalizeError(cause));
      }
      return null;
    } finally {
      if (mounted.current) setLoadingProfile(false);
    }
  }, []);

  const { isLoaded, isSignedIn, userId } = session;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setProfile(null);
      setError(null);
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, userId, load]);

  const signOutFn = session.signOut;
  const signOut = useCallback(async () => {
    setProfile(null);
    setError(null);
    await signOutFn();
  }, [signOutFn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      user: profile?.user ?? null,
      initializing: !isLoaded || (isSignedIn && profile === null && loadingProfile),
      isAuthenticated: isSignedIn,
      reload: load,
      signOut,
      error,
    }),
    [profile, isLoaded, isSignedIn, loadingProfile, load, signOut, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}
