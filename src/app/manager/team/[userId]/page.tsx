import { ManagerTeamMemberView } from "@/components/workspace/ManagerViews";
export default async function Page({ params }: { params: Promise<{ userId: string }> }) { return <ManagerTeamMemberView userId={(await params).userId} />; }
