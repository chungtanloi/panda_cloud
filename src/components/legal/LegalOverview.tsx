"use client";

import { DealScopedLanding } from "@/components/workspace/DealScopedLanding";

/** `/legal` has no approved cross-deal NCNDA read. */
export function LegalOverview() {
  return (
    <DealScopedLanding
      eyebrow="Legal / Overview"
      title="NCNDA agreements"
      description="NCNDA work is opened from an authorized deal context; there is no approved global agreement queue."
      workstream="NCNDA agreements"
      backendGap="an approved cross-deal NCNDA list and queue contract; CR-004 remains proposal-only"
    />
  );
}
