"use client";
import type { Permission } from "@/config/access";
import { hasPermission } from "@/config/access";
import { useAuth } from "@/controllers/AuthContext";
export function PermissionGate({ permission, children }: { permission: Permission; children: React.ReactNode }) { const { user } = useAuth(); return hasPermission(user, permission) ? children : null; }
