"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { LoadingState } from "@/components/ui/states";
import { useAuth } from "@/controllers/AuthContext";

/**
 * Figma node 2:1434 — sidebar on the left, content canvas on the right.
 * Also acts as the route guard for everything under /dashboard.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, initializing, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!initializing && !isAuthenticated) router.replace("/login");
  }, [initializing, isAuthenticated, router]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base">
        <LoadingState label="Restoring session" />
      </div>
    );
  }

  // The redirect above is in flight — render nothing rather than a flash of UI.
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
