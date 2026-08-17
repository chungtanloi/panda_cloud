import Link from "next/link";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { GapNotice } from "@/components/workspace/GapNotice";

/**
 * `/technical/assessments/[id]/evidence` — ROLE_PERMISSION_MATRIX § 5.2.
 *
 * The route exists because the matrix specifies it. The feature does not,
 * and this page does not pretend otherwise: `DD API.md` puts evidence upload
 * out of scope in its second line, and the canonical upload flow (authorize →
 * signed URL → direct PUT → finalize → scan → attach) has no operation behind
 * any of its six steps.
 *
 * A file input that cannot upload would be worse than this page.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <WorkspacePage
      eyebrow="Technical / Evidence"
      title="Evidence"
      description="Documents attached to this assessment's responses."
    >
      <GapNotice
        tone="blocked"
        title="Evidence upload is out of scope in the current contract"
        source="DD API.md line 2 · UC-012 · collaboration workflow § 7.4"
      >
        <p>
          <code>DD API.md</code> lists &quot;Evidence upload/Supabase&quot; among the
          things explicitly excluded from this phase. None of the six steps in the
          canonical upload flow has an operation, so there is nothing to call.
        </p>
        <p>
          The shapes are already modelled in <code>models/dueDiligence.ts</code> under
          its &quot;NOT ON THE WIRE&quot; section, so this page becomes real work rather
          than new design once the backend decides.
        </p>
      </GapNotice>

      <div className="mt-6">
        <Link
          href={`/technical/assessments/${id}`}
          className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
        >
          ← Back to the assessment
        </Link>
      </div>
    </WorkspacePage>
  );
}
