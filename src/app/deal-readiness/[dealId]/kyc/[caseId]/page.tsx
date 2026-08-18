import { CaseDetail } from "@/components/compliance/CaseDetail";
export default async function Page({ params }: { params: Promise<{ dealId: string; caseId: string }> }) { const { dealId, caseId } = await params; return <CaseDetail caseId={caseId} backHref={`/deal-readiness/${encodeURIComponent(dealId)}`} documentsHref={`/deal-readiness/${encodeURIComponent(dealId)}/kyc/${caseId}/documents`} />; }

