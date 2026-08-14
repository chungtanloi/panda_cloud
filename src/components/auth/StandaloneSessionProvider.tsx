"use client";

import { useMemo } from "react";
import { AuthProvider, type SessionState } from "@/controllers/AuthContext";

/**
 * Session stub for standalone development.
 *
 * ⚠ Reachable **only** with the mock adapter. `assertApiConfig()` throws when
 * `NEXT_PUBLIC_API_ADAPTER=http` and no `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is
 * set, so this provider can never front a real backend.
 *
 * It exists to preserve the repository's documented property that it "runs
 * standalone against a mock adapter, so no backend is required to develop"
 * (README; PRODUCT_DATA_BACKEND_REQUIREMENTS § Production safety keeps the mock
 * adapter "only for local UI development and automated frontend tests").
 *
 * This is a development fixture, not an authentication mechanism: there is no
 * credential, no token, no session and no server. Nothing here grants access to
 * anything outside the in-memory mock adapter.
 */
export function StandaloneSessionProvider({ children }: { children: React.ReactNode }) {
  const session = useMemo<SessionState>(
    () => ({
      isLoaded: true,
      isSignedIn: true,
      userId: "standalone-mock-identity",
      signOut: async () => {},
    }),
    [],
  );

  return <AuthProvider session={session}>{children}</AuthProvider>;
}
