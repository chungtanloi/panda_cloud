"use client";

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo } from "react";
import { AuthProvider, type SessionState } from "@/controllers/AuthContext";
import { sessionBridge } from "@/services/session";

/**
 * Binds the Clerk React SDK to `AuthProvider`.
 *
 * This is the single place in the application that touches Clerk's client
 * hooks. It does three things and nothing else:
 *
 *  1. registers the session-token provider consumed by `services/http.ts`
 *     — `getToken()` with **no** template name, because the PandaCloud API
 *     audience is configured on the Clerk session token itself
 *     (PHASE_1_FRONTEND_AUTH_HANDOFF);
 *  2. publishes the verified primary email as a hint for the mock adapter only
 *     (see `services/session.ts`);
 *  3. hands a provider-agnostic `SessionState` to `AuthProvider`.
 */
export function ClerkSessionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useClerkAuth();
  const { user } = useUser();

  useEffect(() => sessionBridge.registerTokenProvider(() => getToken()), [getToken]);

  useEffect(() => {
    sessionBridge.setIdentityHint(user?.primaryEmailAddress?.emailAddress ?? null);
  }, [user]);

  const session = useMemo<SessionState>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      signOut: async () => {
        await signOut();
      },
    }),
    [isLoaded, isSignedIn, userId, signOut],
  );

  return <AuthProvider session={session}>{children}</AuthProvider>;
}
