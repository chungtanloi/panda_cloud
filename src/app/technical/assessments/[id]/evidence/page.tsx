import { AssessmentEvidence } from "@/components/technical/AssessmentEvidence";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssessmentEvidence assessmentId={id} />;
}
