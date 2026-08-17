import { CaseDocuments } from "@/components/compliance/CaseDocuments";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseDocuments caseId={id} />;
}
