"use client";

import { DealScopedLanding } from "@/components/workspace/DealScopedLanding";

/**
 * `/compliance/cases` — ROLE_PERMISSION_MATRIX § 7.2.
 *
 * ⚠ THIS PAGE NO LONGER RENDERS A LIST. See `DealScopedLanding` for the full
 * reasoning; in short, `GET /deals/{dealId}/kyc` is the only read operation and
 * a Compliance identity cannot enumerate deals, so a cross-deal queue cannot be
 * built from the frontend. With a `?dealId=` it redirects to
 * `/deal-readiness/[dealId]`, which is the canonical place a KYC case is read
 * and worked alongside NCNDA and Due Diligence.
 *
 * The previous implementation of this file had three defects worth recording so
 * they are not reintroduced:
 *
 *   1. It called `useRouter()` without importing it, which broke `typecheck`
 *      and `build` outright.
 *   2. It declared `dealContext` but never called `setDealContext`, so the
 *      create form always received `null`. Both subject buttons and the submit
 *      button were permanently disabled — KYC creation from this workspace was
 *      impossible.
 *   3. It kept a `dealInput` state pair that nothing read.
 *
 * `CreateCaseForm` now lives in its own module. It is re-exported here so any
 * existing `@/components/compliance/CasesPage` import keeps resolving.
 */
export { CreateCaseForm } from "./CreateCaseForm";

export function CasesPage() {
  return (
    <DealScopedLanding
      eyebrow="Compliance / Cases"
      title="KYC cases"
      description="One subject per case — an organization or a contact, never both. Status and risk are materialized onto the deal so the other workspaces can read them."
      workstream="KYC cases"
      backendGap="a cross-deal read such as GET /kyc?assignedTo=&status=, or a deal-enumeration scope for the compliance role"
    />
  );
}
