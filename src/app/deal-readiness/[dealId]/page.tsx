import { DealReadinessView } from "@/components/readiness/DealReadinessView";
export default async function Page({ params }: { params: Promise<{ dealId: string }> }) { const { dealId } = await params; return <DealReadinessView dealId={dealId} />; }
