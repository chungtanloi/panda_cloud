"use client";

import { DealScopedLanding } from "@/components/workspace/DealScopedLanding";
import { LegalQueuePage } from "./LegalQueuePage";

/**
 * `/legal/agreements` — ROLE_PERMISSION_MATRIX § 6.2.
 *
 * Renders the NCNDA queue, and falls back to the deal-scoped landing when the
 * backend has not shipped it.
 *
 * ⚠ WHY BOTH.
 *
 * The queue depends on `GET /ncnda`, proposed in CR-004
 * (`PandaCloudBackend/api-contracts/proposals/CR-004/`) and not yet part of the
 * contract. Rather than hide the whole workspace behind a feature flag, the
 * queue calls the endpoint and treats a 404 as "not deployed": the landing page
 * renders instead, saying plainly that Legal has no cross-deal queue and why.
 *
 * The consequence is that this file needs no second release. The day the
 * backend deploys CR-004, the same build starts showing the queue.
 *
 * Earlier defects in this file, recorded so they are not reintroduced:
 * `dealContext` was declared but never populated, so `CreateAgreementForm`
 * always received `null` and could not pass step 1; and a `dealInput` state
 * pair was left behind that nothing read.
 */
export function AgreementsPage() {
  return (
    <LegalQueuePage
      fallback={
        <DealScopedLanding
          eyebrow="Legal / Agreements"
          title="NCNDA agreements"
          description="One agreement per deal and counterparty. At most one may be active at a time, and each carries a single current document version — every earlier version is immutable."
          workstream="NCNDA agreements"
          backendGap="the cross-deal read proposed in CR-004 (GET /ncnda), or a deal-enumeration scope for the legal role"
        />
      }
    />
  );
}
