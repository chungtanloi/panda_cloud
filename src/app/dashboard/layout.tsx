import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell workspace="customer">{children}</WorkspaceShell>;
}
