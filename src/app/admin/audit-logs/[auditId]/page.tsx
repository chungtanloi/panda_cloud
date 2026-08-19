import { AdminAuditDetailView } from "@/components/workspace/AdminApiView";

export default async function Page({ params }: { params: Promise<{ auditId: string }> }) {
  return <AdminAuditDetailView auditId={(await params).auditId} />;
}
