import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
export default function Layout({ children }: { children: React.ReactNode }) { return <WorkspaceShell workspace="manager">{children}</WorkspaceShell>; }
