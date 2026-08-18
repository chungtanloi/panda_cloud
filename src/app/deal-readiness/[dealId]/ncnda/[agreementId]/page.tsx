import { AgreementDetail } from "@/components/legal/AgreementDetail";
export default async function Page({ params }: { params: Promise<{ dealId: string; agreementId: string }> }) { const { dealId, agreementId } = await params; return <AgreementDetail agreementId={agreementId} backHref={`/deal-readiness/${encodeURIComponent(dealId)}`} />; }
