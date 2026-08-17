import type {
  KycCase,
  NcndaAgreement,
  NcndaAgreementDetail,
  NcndaDocumentVersion,
} from "@/models";

/**
 * Seed data for the Legal and Compliance workspaces.
 *
 * Shapes mirror `ncndaAgreements`, `ncndaDocumentVersions` and `kycCases` in
 * `PandaCloudBackend/convex/schema.ts`. The deals referenced here are the same
 * ones `salesFixtures.ts` seeds, so a reviewer can follow one company across
 * three workspaces instead of meeting a different cast in each.
 *
 * The set is chosen to exercise the states that behave differently rather than
 * to look busy: an active agreement (the one status that requires an effective
 * date), a rejected one, a draft with no document yet, and on the KYC side an
 * approved case, a rejected case with a reason, a prohibited-risk case and one
 * still waiting on documents.
 */

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

function version(
  agreementId: string,
  versionNumber: number,
  documentRole: NcndaDocumentVersion["documentRole"],
  isCurrent: boolean,
  filename: string,
  uploadedDaysAgo: number,
): NcndaDocumentVersion {
  return {
    versionId: `${agreementId}_v${versionNumber}`,
    agreementId,
    documentId: `doc_${agreementId}_${versionNumber}`,
    versionNumber,
    documentRole,
    isCurrent,
    uploadedById: "user_legal_01",
    uploadedByName: "Nadia Farouk",
    uploadedAt: daysAgo(uploadedDaysAgo),
    originalFilename: filename,
  };
}

export const mockNcndaAgreements: readonly NcndaAgreementDetail[] = [
  {
    agreementId: "ncnda_01",
    dealId: "deal_01",
    dealTitle: "Northwind Energy — 120ha greenfield",
    counterpartyOrganizationId: "org_northwind",
    counterpartyName: "Northwind Energy",
    status: "active",
    // The one status the backend requires a date for.
    effectiveDate: "2026-07-01",
    expiresAt: daysAhead(320),
    sentAt: daysAgo(46),
    signedAt: daysAgo(40),
    countersignedAt: daysAgo(38),
    ownerId: "user_legal_01",
    ownerName: "Nadia Farouk",
    notes: "Mutual NCNDA, 24-month term. Counterparty counsel requested a carve-out for publicly disclosed grid data.",
    updatedAt: daysAgo(38),
    revision: 4,
    versions: [
      version("ncnda_01", 3, "countersigned", true, "northwind-ncnda-countersigned.pdf", 38),
      version("ncnda_01", 2, "signed", false, "northwind-ncnda-signed.pdf", 40),
      version("ncnda_01", 1, "draft", false, "northwind-ncnda-draft.pdf", 48),
    ],
  },
  {
    agreementId: "ncnda_02",
    dealId: "deal_02",
    dealTitle: "Helio Labs — 64× H100 training cluster",
    counterpartyOrganizationId: "org_helio",
    counterpartyName: "Helio Labs",
    status: "under_review",
    effectiveDate: null,
    expiresAt: null,
    sentAt: daysAgo(9),
    signedAt: null,
    countersignedAt: null,
    ownerId: "user_legal_01",
    ownerName: "Nadia Farouk",
    notes: "Redline returned; liability cap under discussion.",
    updatedAt: daysAgo(3),
    revision: 3,
    versions: [
      version("ncnda_02", 2, "redline", true, "helio-ncnda-redline.pdf", 3),
      version("ncnda_02", 1, "draft", false, "helio-ncnda-draft.pdf", 9),
    ],
  },
  {
    agreementId: "ncnda_03",
    dealId: "deal_04",
    dealTitle: "Meridian Build — 80MW campus",
    counterpartyOrganizationId: "org_meridian",
    counterpartyName: "Meridian Build",
    status: "drafting",
    effectiveDate: null,
    expiresAt: null,
    sentAt: null,
    signedAt: null,
    countersignedAt: null,
    ownerId: "user_legal_01",
    ownerName: "Nadia Farouk",
    notes: null,
    updatedAt: daysAgo(1),
    revision: 1,
    // No document uploaded yet — the detail page must handle an empty history.
    versions: [],
  },
  {
    agreementId: "ncnda_04",
    dealId: "deal_03",
    dealTitle: "Tessellate Capital — token allocation",
    counterpartyOrganizationId: "org_tessellate",
    counterpartyName: "Tessellate Capital",
    status: "rejected",
    effectiveDate: null,
    expiresAt: null,
    sentAt: daysAgo(30),
    signedAt: null,
    countersignedAt: null,
    ownerId: "user_legal_01",
    ownerName: "Nadia Farouk",
    notes: "Counterparty declined the non-circumvention clause.",
    updatedAt: daysAgo(22),
    revision: 2,
    versions: [version("ncnda_04", 1, "draft", true, "tessellate-ncnda-draft.pdf", 30)],
  },
];

/** List projection — the detail page adds `versions`. */
export function toAgreementSummary(detail: NcndaAgreementDetail): NcndaAgreement {
  const { versions: _versions, ...summary } = detail;
  return summary;
}

export const mockKycCases: readonly KycCase[] = [
  {
    caseId: "kyc_01",
    dealId: "deal_01",
    dealTitle: "Northwind Energy — 120ha greenfield",
    subject: {
      kind: "organization",
      organizationId: "org_northwind",
      displayName: "Northwind Energy",
    },
    provider: "sumsub",
    providerCaseId: "SUM-8841-NW",
    status: "approved",
    riskLevel: "low",
    assignedToId: "user_compliance_01",
    assignedToName: "Tomas Reyes",
    rejectionReason: null,
    submittedAt: daysAgo(35),
    // Required by the backend whenever status is approved.
    verifiedAt: daysAgo(31),
    expiresAt: daysAhead(334),
    updatedAt: daysAgo(31),
    revision: 5,
  },
  {
    caseId: "kyc_02",
    dealId: "deal_02",
    dealTitle: "Helio Labs — 64× H100 training cluster",
    subject: {
      kind: "contact",
      contactId: "ct_02",
      displayName: "Marcus Ihejirika",
    },
    provider: null,
    providerCaseId: null,
    status: "pending_documents",
    riskLevel: "medium",
    assignedToId: "user_compliance_01",
    assignedToName: "Tomas Reyes",
    rejectionReason: null,
    submittedAt: null,
    verifiedAt: null,
    expiresAt: null,
    updatedAt: daysAgo(4),
    revision: 2,
  },
  {
    caseId: "kyc_03",
    dealId: "deal_03",
    dealTitle: "Tessellate Capital — token allocation",
    subject: {
      kind: "organization",
      organizationId: "org_tessellate",
      displayName: "Tessellate Capital",
    },
    provider: "sumsub",
    providerCaseId: "SUM-9107-TC",
    status: "rejected",
    // Prohibited is a stop, not "very high" — the UI must not read it as a scale.
    riskLevel: "prohibited",
    assignedToId: "user_compliance_01",
    assignedToName: "Tomas Reyes",
    // Required by the backend whenever status is rejected.
    rejectionReason: "Beneficial owner appears on a sanctions list; escalated to counsel.",
    submittedAt: daysAgo(26),
    verifiedAt: null,
    expiresAt: null,
    updatedAt: daysAgo(20),
    revision: 4,
  },
  {
    caseId: "kyc_04",
    dealId: "deal_04",
    dealTitle: "Meridian Build — 80MW campus",
    subject: {
      kind: "organization",
      organizationId: "org_meridian",
      displayName: "Meridian Build",
    },
    provider: "sumsub",
    providerCaseId: "SUM-9330-MB",
    status: "provider_error",
    riskLevel: null,
    assignedToId: null,
    assignedToName: null,
    rejectionReason: null,
    submittedAt: daysAgo(2),
    verifiedAt: null,
    expiresAt: null,
    updatedAt: daysAgo(2),
    revision: 2,
  },
];
