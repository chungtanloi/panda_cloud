import { AssessmentProvider } from "@/controllers/AssessmentContext";

/**
 * Wraps the whole Land Owner Assessment flow so the draft survives navigation
 * between steps. Chrome is per-step: the design uses a different header on the
 * intro, on step 1 and on step 2.
 */
export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AssessmentProvider>
      <div className="flex min-h-screen flex-col">{children}</div>
    </AssessmentProvider>
  );
}
