"use client";
import type { Permission } from "@/config/access";
import { hasPermission } from "@/config/access";
import { useAuth } from "@/controllers/AuthContext";

/** Hides an affordance the identity has no permission for. Not access control. */
export function PermissionGate({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { profile } = useAuth();
  return hasPermission(profile, permission) ? children : null;
}
