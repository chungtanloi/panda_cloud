import { AdminIntegrationEventDetailView } from "@/components/workspace/AdminApiView";

export default async function Page({ params }: { params: Promise<{ eventId: string }> }) {
  return <AdminIntegrationEventDetailView eventId={(await params).eventId} />;
}
