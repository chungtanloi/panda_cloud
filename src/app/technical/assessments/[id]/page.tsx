import { AssessmentDetail } from "@/components/technical/AssessmentDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssessmentDetail assessmentId={id} />;
}
