import { AgreementsPage } from "@/components/legal/AgreementsPage";
import { LegalQueuePage } from "@/components/legal/LegalQueuePage";

export default function Page() {
  return <LegalQueuePage fallback={<AgreementsPage />} />;
}
