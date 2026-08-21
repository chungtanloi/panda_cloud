"use client";

import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { AuthProvider, type SessionState } from "@/controllers/AuthContext";
import { sessionBridge } from "@/services/session";

export function ClerkSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useClerkAuth();
  const { user } = useUser();
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    const unregister = sessionBridge.registerTokenProvider(() =>
      getToken(),
    );
    setTokenReady(true);
    return unregister;
  }, [getToken]);

  useEffect(() => {
    const unregister = sessionBridge.registerUnauthorizedHandler(async () => {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      await signOut();
      window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    });
    return unregister;
  }, [signOut]);

  useEffect(() => {
    sessionBridge.setIdentityHint(
      user?.primaryEmailAddress?.emailAddress ?? null,
    );
  }, [user]);

  const session = useMemo<SessionState>(
    () => ({
      isLoaded: isLoaded && tokenReady,
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      signOut: async () => {
        await signOut();
      },
    }),
    [isLoaded, tokenReady, isSignedIn, userId, signOut],
  );

  return <AuthProvider session={session}>{children}</AuthProvider>;
}
