import Link from "next/link";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { GapNotice } from "@/components/workspace/GapNotice";

/**
 * `/technical` — ROLE_PERMISSION_MATRIX § 5.2 "Overview".
 *
 * The matrix describes this as a dashboard. It cannot be one yet, and the page
 * says so rather than filling the space with placeholder charts: there is no
 * aggregate operation in `DD API.md`, and the only list is scoped to a single
 * deal, so nothing here can be counted. What the page *can* do honestly is
 * explain the workflow and hand the reviewer to the surface that works.
 */
export default function Page() {
  return (
    <WorkspacePage
      eyebrow="Technical / Overview"
      title="Technical Due Diligence"
      description="Initialize an assessment from the published template, record a response against each requirement, and mark items reviewed. 68 requirements per assessment: 56 IDC and 12 DL."
    >
      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        <Step
          n="1"
          title="Initialize"
          body="An assessment is created against a deal and pinned to the template version published at that moment. A later publish never changes it."
        />
        <Step
          n="2"
          title="Respond"
          body="Each requirement gets one of seven statuses. Not-applicable items are excluded from the compliance rate rather than counted as passes."
        />
        <Step
          n="3"
          title="Review"
          body="Marking an item reviewed recomputes the assessment metrics and the deal's DD summary in the same transaction."
        />
      </section>

      <div className="mb-8">
        <Link
          href="/technical/assessments"
          className="inline-flex rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg"
        >
          Open assessments
        </Link>
      </div>

      <GapNotice
        tone="blocked"
        title="This overview cannot show live numbers yet"
        source="DD API.md — five operations, four paths"
      >
        <p>
          A dashboard needs an aggregate across assessments, and no such operation
          exists. The only list is per deal, so there is nothing to sum. Deriving
          counts client-side would mean fetching every deal first, which a Technical
          identity is not permitted to enumerate.
        </p>
        <p>
          Rather than render charts over invented data, the page stays explanatory
          until the backend offers an aggregate read.
        </p>
      </GapNotice>
    </WorkspacePage>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <article className="rounded-[24px] border border-line bg-surface p-6">
      <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-accent">Step {n}</span>
      <h2 className="mt-3 text-sm font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-xs leading-5 text-ink-dim">{body}</p>
    </article>
  );
}
