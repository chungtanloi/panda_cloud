import { ClerkProvider } from "@clerk/nextjs";
import { clerkEnabled } from "@/services/config";
import { ClerkSessionProvider } from "./ClerkSessionProvider";
import { StandaloneSessionProvider } from "./StandaloneSessionProvider";

/**
 * Chooses the identity provider for the whole application.
 *
 * `clerkEnabled` is derived from a build-time public variable, so the branch is
 * resolved once at build time — it is not a runtime auth switch. When Clerk is
 * configured (always, for anything that talks to the gateway) the tree is
 * wrapped in `ClerkProvider`; otherwise the standalone mock stub is used.
 */
export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) {
    return <StandaloneSessionProvider>{children}</StandaloneSessionProvider>;
  }

  return (
    <ClerkProvider
      // The existing PandaCloud screens stay; only the submit handlers become
      // Clerk custom flows (PHASE_1_FRONTEND_AUTH_HANDOFF).
      signInUrl="/login"
      signUpUrl="/signup"
      afterSignOutUrl="/login"
    >
      <ClerkSessionProvider>{children}</ClerkSessionProvider>
    </ClerkProvider>
  );
}
