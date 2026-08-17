import { AgreementDetail } from "@/components/legal/AgreementDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AgreementDetail agreementId={id} />;
}
