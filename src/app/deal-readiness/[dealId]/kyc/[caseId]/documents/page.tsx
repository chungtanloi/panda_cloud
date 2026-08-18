import { CaseDocuments } from "@/components/compliance/CaseDocuments";
export default async function Page({ params }: { params: Promise<{ dealId: string; caseId: string }> }) { const { dealId, caseId } = await params; return <CaseDocuments caseId={caseId} backHref={`/deal-readiness/${encodeURIComponent(dealId)}/kyc/${caseId}`} />; }
