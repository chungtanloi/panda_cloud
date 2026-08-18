"use client";

import { DealScopedLanding } from "@/components/workspace/DealScopedLanding";

/**
 * The approved NCNDA contract is deal-scoped. CR-004's proposed cross-deal
 * queue is deliberately not mounted from this production route.
 */
export function AgreementsPage() {
  return (
    <DealScopedLanding
      eyebrow="Legal / Agreements"
      title="NCNDA agreements"
      description="One agreement per deal and counterparty. At most one may be active at a time, and each carries a single current document version — every earlier version is immutable."
      workstream="NCNDA agreements"
      backendGap="an approved cross-deal NCNDA list and queue contract; CR-004 remains proposal-only"
    />
  );
}
