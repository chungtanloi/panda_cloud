import { Suspense } from "react";
import { AssessmentsPage } from "@/components/technical/AssessmentsPage";
import { LoadingState } from "@/components/ui/states";

// `useSearchParams` requires a Suspense boundary, or `next build` fails the
// page with a CSR-bailout error at prerender time.
export default function Page() {
  return (
    <Suspense fallback={<LoadingState label="Loading assessments" />}>
      <AssessmentsPage />
    </Suspense>
  );
}
