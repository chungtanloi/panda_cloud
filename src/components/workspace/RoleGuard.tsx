"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { WorkspaceId } from "@/config/access";
import { canAccessWorkspace } from "@/config/access";
import { useAuth } from "@/controllers/AuthContext";
import { LoadingState } from "@/components/ui/states";
import { Forbidden } from "./Forbidden";

/**
 * Client-side authorization gate.
 *
 * Three distinct outcomes, kept apart on purpose:
 *   - no session          -> redirect to /login with a returnTo
 *   - session, no profile -> 403 surface (suspended, disabled, or unmapped
 *                            identity: /auth/me answered 403 or 409)
 *   - session + profile   -> workspace check against active memberships
 *
 * ⚠ This is UX protection. Every protected operation is authorized again by the
 * backend (ROLE_PERMISSION_MATRIX § 14).
 */
export function RoleGuard({ workspace, children }: { workspace: WorkspaceId; children: React.ReactNode }) {
  const router = useRouter();
  const { profile, initializing, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      router.replace(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
    }
  }, [initializing, isAuthenticated, router]);

  if (initializing) {
    return <div className="grid min-h-screen place-items-center bg-base"><LoadingState label="Restoring session" /></div>;
  }
  if (!isAuthenticated) return null;
  // Signed in, but the gateway would not resolve a usable profile.
  if (!profile) return <Forbidden profile={null} />;
  if (!canAccessWorkspace(profile, workspace)) return <Forbidden profile={profile} />;
  return children;
}
