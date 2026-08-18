import { GapNotice } from "@/components/workspace/GapNotice";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";

export default function Page() {
  return <WorkspacePage eyebrow="Sales / Quotes" title="Quotes" description="Quote creation, approvals, and lifecycle data are not part of Backend Integration Candidate v1."><GapNotice tone="blocked" title="Quotes are not available yet" source="Backend Integration Candidate v1"><p>No canonical quote domain or <code>/api/v1</code> quote operation exists. This page intentionally does not use fixture data or a generic resource endpoint.</p></GapNotice></WorkspacePage>;
}
