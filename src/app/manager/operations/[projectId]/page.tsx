import { ManagerProjectDetailView } from "@/components/workspace/ManagerViews";
export default async function Page({ params }: { params: Promise<{ projectId: string }> }) { return <ManagerProjectDetailView projectId={(await params).projectId} />; }
