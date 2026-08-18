"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/states";
import { useAuth } from "@/controllers/AuthContext";
import { isStaff } from "@/models/auth";
import { Forbidden } from "./Forbidden";

/** Authentication plus staff UX gate for cross-workspace Deal Readiness. */
export function StaffGuard({ children }: { children: React.ReactNode }) {
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
  if (!profile || !isStaff(profile)) return <Forbidden profile={profile} />;
  return children;
}
