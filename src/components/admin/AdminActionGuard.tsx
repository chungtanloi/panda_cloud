"use client";
import { useAuth } from "@/controllers/AuthContext";
import { isAdmin, isSuperAdmin } from "@/models/auth";
import type { ReactNode } from "react";

export function AdminActionGuard({ children, requireSuperAdmin = false }: { children: ReactNode; requireSuperAdmin?: boolean }) {
  const { profile } = useAuth();
  if (requireSuperAdmin ? !isSuperAdmin(profile) : !isAdmin(profile)) return null;
  return <>{children}</>;
}
