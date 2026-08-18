"use client";

import { DealScopedLanding } from "@/components/workspace/DealScopedLanding";

/** `/compliance` has no approved cross-deal KYC read. */
export function ComplianceOverview() {
  return (
    <DealScopedLanding
      eyebrow="Compliance / Overview"
      title="KYC cases"
      description="KYC work is opened from an authorized deal context; there is no approved global compliance queue."
      workstream="KYC cases"
      backendGap="an approved cross-deal KYC list and queue contract, or a deal-enumeration scope for compliance"
    />
  );
}
