"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { WorkspaceId } from "@/config/access";
import { hasPermission, navigationByWorkspace, workspaceForRole } from "@/config/access";
import { primaryRole } from "@/models/auth";
import { useAuth } from "@/controllers/AuthContext";
import { cn } from "@/lib/cn";
import { RoleGuard } from "./RoleGuard";
import { StaffGuard } from "./StaffGuard";

export function WorkspaceShell({ workspace, children }: { workspace: WorkspaceId; children: React.ReactNode }) {
  return <RoleGuard workspace={workspace}><Shell workspace={workspace}>{children}</Shell></RoleGuard>;
}

export function StaffWorkspaceShell({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const workspace = workspaceForRole(primaryRole(profile) ?? "sales") ?? "sales";
  return <StaffGuard><Shell workspace={workspace}>{children}</Shell></StaffGuard>;
}

function Shell({ workspace, children }: { workspace: WorkspaceId; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const nav = navigationByWorkspace[workspace].filter((item) => !item.permission || hasPermission(profile, item.permission));

  // Clerk owns sign-out; PandaCloud has no token to revoke.
  async function leave() { await signOut(); router.replace("/login"); }

  return (
    <div className="min-h-screen bg-base font-sans text-ink">
      <button type="button" onClick={() => setOpen(!open)} className="fixed left-4 top-4 z-50 rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold uppercase tracking-wider lg:hidden" aria-label="Toggle navigation">Menu</button>
      {open ? <button type="button" aria-label="Close navigation" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/60 lg:hidden" /> : null}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-[268px] flex-col border-r border-line-faint bg-surface-alt backdrop-blur-auth transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="border-b border-line-faint p-6"><Link href="/" className="text-xl font-semibold">Cloud <span className="text-accent">Panda</span></Link><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-ink-dim">{workspace} Workspace</p></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">{nav.map((item) => { const active = pathname === item.href || (item.href !== `/${workspace}` && pathname.startsWith(`${item.href}/`)); return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center rounded-xl border-l-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition", active ? "border-accent bg-accent-soft text-accent" : "border-transparent text-ink-dim hover:bg-white/5 hover:text-ink")}>{item.label}{item.externalFlow ? <span className="ml-auto">↗</span> : null}</Link>; })}</nav>
        <div className="border-t border-line-faint p-5"><p className="truncate text-sm font-medium">{user?.fullName}</p><p className="mt-1 text-xs text-ink-dim">{primaryRole(profile) ?? "no role"}</p><button onClick={() => void leave()} className="mt-4 text-xs font-bold uppercase tracking-wider text-ink-dim hover:text-accent">Log out</button></div>
      </aside>
      <div className="min-w-0 lg:ml-[268px]">{children}</div>
    </div>
  );
}
