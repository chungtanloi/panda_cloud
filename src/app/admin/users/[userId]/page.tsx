import { AdminUserDetailView } from "@/components/workspace/AdminApiView";
export default async function Page({ params }: { params: Promise<{ userId: string }> }) { return <AdminUserDetailView userId={(await params).userId} />; }
