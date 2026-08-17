import Link from "next/link";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { GapNotice } from "@/components/workspace/GapNotice";

/**
 * `/compliance/cases/[id]/documents` — ROLE_PERMISSION_MATRIX § 7.2 lists this
 * route and marks it, in the same table, "Chưa được build; đang là gap backend".
 *
 * § 7.4 is more specific and is the reason this page has no data model behind
 * it: `kycCases` has no document relation, the prototype uploads identity and
 * accreditation files with nowhere to put them, the backend schema has not
 * resolved the relation, and inventing something like `kycCaseDocuments` is
 * forbidden in as many words. The document's own instruction is that this page
 * "chỉ nên để placeholder/coming soon" until that decision is made.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <WorkspacePage
      eyebrow="Compliance / Documents"
      title="Case documents"
      description="Identity and accreditation files supporting this KYC case."
    >
      <GapNotice
        tone="blocked"
        title="The document relation does not exist in the schema"
        source="ROLE_PERMISSION_MATRIX § 7.4 — explicit gap"
      >
        <p>
          <code>kycCases</code> has no link to <code>documents</code>. The prototype
          collects identity and accreditation files, but the backend schema has not
          decided how they attach to a case.
        </p>
        <p>
          § 7.4 forbids inventing a model such as <code>kycCaseDocuments</code> to fill
          the hole, so this page stays a placeholder until the BE owner decides. No
          upload control is shown, because there is nothing for it to call.
        </p>
      </GapNotice>

      <div className="mt-6">
        <Link
          href={`/compliance/cases/${id}`}
          className="text-xs font-bold uppercase tracking-wider text-accent hover:underline"
        >
          ← Back to the case
        </Link>
      </div>
    </WorkspacePage>
  );
}
