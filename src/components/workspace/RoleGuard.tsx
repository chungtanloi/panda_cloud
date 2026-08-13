"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/models/auth";
import { canAccessWorkspace } from "@/config/access";
import { useAuth } from "@/controllers/AuthContext";
import { LoadingState } from "@/components/ui/states";
import { Forbidden } from "./Forbidden";

export function RoleGuard({ workspace, children }: { workspace: UserRole; children: React.ReactNode }) {
  const router = useRouter(); const { user, initializing, isAuthenticated } = useAuth();
  useEffect(() => { if (!initializing && !isAuthenticated) router.replace(`/login?returnTo=${encodeURIComponent(location.pathname)}`); }, [initializing, isAuthenticated, router]);
  if (initializing) return <div className="grid min-h-screen place-items-center bg-base"><LoadingState label="Restoring session" /></div>;
  if (!user) return null;
  if (!canAccessWorkspace(user, workspace)) return <Forbidden user={user} />;
  return children;
}
