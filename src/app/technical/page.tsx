import Link from "next/link";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { apiConfig } from "@/services/config";

/**
 * Technical / Overview — ROLE_PERMISSION_MATRIX § 5.2:
 * "Xem assessments đang thực hiện, items pending review, critical-failure
 * count và completion %".
 *
 * ⚠ The matrix names these four metrics but does not define a stats endpoint
 * or response shape for them (no `GET /technical/overview`-equivalent in
 * api-contracts). Rather than inventing one, this mirrors the same
 * placeholder convention `ResourcePage` uses for the mock adapter: the values
 * below are static sample numbers, clearly labelled, and this component does
 * not call `api.*` for them. Wire a real call here once the endpoint exists —
 * do not silently swap in computed/derived numbers from another endpoint.
 */
const SAMPLE_STATS = [
  { label: "Assessments Running", value: "7", detail: "Won-track deals" },
  { label: "Items Pending Review", value: "23" },
  { label: "Critical Failures", value: "2", detail: "Needs immediate attention" },
  { label: "Completion", value: "61%" },
] as const;

export default function Page() {
  return (
    <WorkspacePage
      eyebrow="Technical / Overview"
      title="Technical Due Diligence"
      description="Assessments in progress, items waiting on review, and how close each is to complete."
      stats={[...SAMPLE_STATS]}
    >
      {apiConfig.adapter === "mock" ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
            Sample data
          </span>
          <span className="text-xs text-ink-dim">
            Static placeholder — no DD overview endpoint exists in the backend contract yet.
          </span>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[24px] border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Running Assessments</h2>
          <p className="mt-2 text-xs leading-5 text-ink-dim">
            Assessments currently open across Won-track deals. Binds to the DD list API contract
            when available — see the Assessments page for the working list.
          </p>
          <Link
            href="/technical/assessments"
            className="mt-5 inline-flex text-xs font-bold uppercase tracking-wider text-accent hover:underline"
          >
            View all assessments →
          </Link>
        </article>
        <article className="rounded-[24px] border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Critical Failures</h2>
          <p className="mt-2 text-xs leading-5 text-ink-dim">
            DD items marked critical and currently failing. This list will populate once an item
            with a critical-failure status exists in the backend response.
          </p>
        </article>
      </section>
    </WorkspacePage>
  );
}
