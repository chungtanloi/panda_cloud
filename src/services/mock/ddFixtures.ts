import type {
  DdAssessmentSummary,
  DdResponse,
  DdTemplateItem,
} from "@/models/dueDiligence";

/**
 * Development fixtures for the Technical workspace.
 *
 * Shapes come from `DEALFLOW_MVP_DATABASE_DESIGN.md` §§ 5.3–5.4 and § 6. The
 * requirement codes follow the documented seed: 56 `IDC-*` plus 12 `DL-*`,
 * 68 items in total, published and immutable.
 *
 * ⚠ The question text below is representative, not the real workbook. The two
 * Due Diligence workbooks live in the backend repository's `excels/` folder and
 * were not available here, so the *content* of each requirement is placeholder
 * copy while the *structure* (code, category, criticality, response type,
 * counts) matches the documented seed. Do not present these questions to a
 * customer, and replace them from the published template version once the
 * backend exposes it.
 */

interface Seed {
  code: string;
  category: string;
  question: string;
  criticality: DdTemplateItem["criticality"];
  responseType: DdTemplateItem["responseType"];
  unit?: string;
  targetCriteria?: string;
  requiredEvidence?: string;
  options?: readonly string[];
}

/** The IDC categories the workbook is organised into. */
const IDC_CATEGORIES = [
  "Site & Civil",
  "Power",
  "Cooling",
  "Fire & Safety",
  "Security",
  "Network",
  "Operations",
] as const;

const IDC_TEMPLATES: readonly Omit<Seed, "code" | "category">[] = [
  {
    question: "Is the incoming utility feed rated for the contracted IT load with N+1 redundancy?",
    criticality: "critical",
    responseType: "boolean",
    targetCriteria: "N+1 at contracted load",
    requiredEvidence: "Single-line diagram",
  },
  {
    question: "What is the measured design PUE at 80% load?",
    criticality: "high",
    responseType: "number",
    unit: "PUE",
    targetCriteria: "<= 1.30",
    requiredEvidence: "Commissioning report",
  },
  {
    question: "Which cooling topology is deployed in the target hall?",
    criticality: "high",
    responseType: "single_select",
    options: ["Air", "Direct-to-chip liquid", "Rear-door heat exchanger", "Immersion"],
    requiredEvidence: "Mechanical layout",
  },
  {
    question: "Describe the generator fuel autonomy and refuelling contract.",
    criticality: "medium",
    responseType: "text",
    targetCriteria: ">= 48 hours",
    requiredEvidence: "Fuel supply agreement",
  },
  {
    question: "Date of the most recent full-load black-building test.",
    criticality: "medium",
    responseType: "date",
    requiredEvidence: "Test certificate",
  },
  {
    question: "Which physical security controls are certified at the perimeter?",
    criticality: "low",
    responseType: "multi_select",
    options: ["Anti-passback", "Mantrap", "Biometric", "24/7 guarding", "CCTV retention >= 90d"],
  },
  {
    question: "Provide the current fire suppression compliance certificate.",
    criticality: "critical",
    responseType: "document",
    requiredEvidence: "Certificate PDF",
  },
];

const DL_TEMPLATES: readonly Omit<Seed, "code" | "category">[] = [
  {
    question: "Is the dedicated line delivered over diverse physical paths?",
    criticality: "critical",
    responseType: "boolean",
    targetCriteria: "Two diverse entries",
    requiredEvidence: "Route diagram",
  },
  {
    question: "Committed information rate on the primary circuit.",
    criticality: "high",
    responseType: "number",
    unit: "Gbps",
    targetCriteria: ">= 100 Gbps",
  },
  {
    question: "Contractual latency to the nearest peering exchange.",
    criticality: "medium",
    responseType: "number",
    unit: "ms",
    targetCriteria: "<= 5 ms",
  },
  {
    question: "Name the carriers available on site.",
    criticality: "low",
    responseType: "text",
  },
];

function buildItems(): DdTemplateItem[] {
  const items: DdTemplateItem[] = [];

  // 56 IDC requirements — IDC-001 .. IDC-056.
  for (let index = 0; index < 56; index += 1) {
    const template = IDC_TEMPLATES[index % IDC_TEMPLATES.length]!;
    items.push({
      id: `ddi_idc_${index + 1}`,
      requirementCode: `IDC-${String(index + 1).padStart(3, "0")}`,
      position: index + 1,
      category: IDC_CATEGORIES[index % IDC_CATEGORIES.length]!,
      criticality: template.criticality,
      question: template.question,
      responseType: template.responseType,
      required: template.criticality !== "low",
      ...(template.unit ? { unit: template.unit } : {}),
      ...(template.targetCriteria ? { targetCriteria: template.targetCriteria } : {}),
      ...(template.requiredEvidence ? { requiredEvidence: template.requiredEvidence } : {}),
      ...(template.options ? { options: template.options } : {}),
    });
  }

  // 12 Dedicated Line requirements — DL-01 .. DL-12.
  for (let index = 0; index < 12; index += 1) {
    const template = DL_TEMPLATES[index % DL_TEMPLATES.length]!;
    items.push({
      id: `ddi_dl_${index + 1}`,
      requirementCode: `DL-${String(index + 1).padStart(2, "0")}`,
      position: 56 + index + 1,
      category: "Dedicated Line",
      criticality: template.criticality,
      question: template.question,
      responseType: template.responseType,
      required: template.criticality !== "low",
      ...(template.unit ? { unit: template.unit } : {}),
      ...(template.targetCriteria ? { targetCriteria: template.targetCriteria } : {}),
      ...(template.requiredEvidence ? { requiredEvidence: template.requiredEvidence } : {}),
      ...(template.options ? { options: template.options } : {}),
    });
  }

  return items;
}

/** Exactly 68 items: 56 `IDC-*` + 12 `DL-*` (DEALFLOW § 6). */
export const mockDdTemplateItems: readonly DdTemplateItem[] = buildItems();

export const MOCK_TEMPLATE_VERSION_LABEL = "data_center_technical_dd v1";

interface AssessmentSeed {
  id: string;
  dealId: string;
  dealTitle: string;
  organizationName: string;
  status: DdAssessmentSummary["status"];
  assignedToName?: string;
  /** How many of the 68 items already carry a reviewed response. */
  reviewed: number;
  /** How many answered-but-not-yet-reviewed items sit in the queue. */
  answeredPendingReview: number;
  /** Deterministic status mix applied to the reviewed items. */
  nonCompliantEvery: number;
  partialEvery: number;
  notApplicableEvery: number;
  startedAt?: string;
  completedAt?: string;
}

const ASSESSMENT_SEEDS: readonly AssessmentSeed[] = [
  {
    id: "dda_4821",
    dealId: "deal_01",
    dealTitle: "Northwind Energy — 120ha greenfield",
    organizationName: "Northwind Energy",
    status: "in_progress",
    assignedToName: "You",
    reviewed: 41,
    answeredPendingReview: 6,
    nonCompliantEvery: 9,
    partialEvery: 5,
    notApplicableEvery: 13,
    startedAt: "2026-08-02T09:12:00Z",
  },
  {
    id: "dda_4830",
    dealId: "deal_04",
    dealTitle: "Meridian Build — Tier III retrofit",
    organizationName: "Meridian Build",
    status: "under_review",
    assignedToName: "You",
    reviewed: 63,
    answeredPendingReview: 5,
    nonCompliantEvery: 14,
    partialEvery: 7,
    notApplicableEvery: 17,
    startedAt: "2026-07-21T04:40:00Z",
  },
  {
    id: "dda_4795",
    dealId: "deal_02",
    dealTitle: "Helio Labs — 24MW campus",
    organizationName: "Helio Labs",
    status: "completed",
    assignedToName: "T. Nguyen",
    reviewed: 68,
    answeredPendingReview: 0,
    nonCompliantEvery: 23,
    partialEvery: 11,
    notApplicableEvery: 19,
    startedAt: "2026-06-30T02:05:00Z",
    completedAt: "2026-07-18T10:22:00Z",
  },
  {
    id: "dda_4844",
    dealId: "deal_05",
    dealTitle: "Kestrel AI — inference edge sites",
    organizationName: "Kestrel AI",
    status: "not_started",
    reviewed: 0,
    answeredPendingReview: 0,
    nonCompliantEvery: 0,
    partialEvery: 0,
    notApplicableEvery: 0,
  },
];

/** Builds one response per template item, exactly as `createAssessment` does. */
function buildResponses(seed: AssessmentSeed): DdResponse[] {
  return mockDdTemplateItems.map((item, index) => {
    const reviewed = index < seed.reviewed;
    const answeredOnly = !reviewed && index < seed.reviewed + seed.answeredPendingReview;

    let status: DdResponse["status"] = "not_reviewed";
    if (reviewed) {
      if (seed.notApplicableEvery && index % seed.notApplicableEvery === 0) status = "not_applicable";
      else if (seed.nonCompliantEvery && index % seed.nonCompliantEvery === 0) status = "non_compliant";
      else if (seed.partialEvery && index % seed.partialEvery === 0) status = "partially_compliant";
      else status = "compliant";
    } else if (answeredOnly) {
      status = index % 2 === 0 ? "needs_verification" : "information_pending";
    }

    return {
      responseId: `ddr_${seed.id}_${item.id}`,
      assessmentId: seed.id,
      templateItemId: item.id,
      status,
      responseValue: reviewed || answeredOnly ? sampleValue(item) : null,
      comments: reviewed ? null : answeredOnly ? "Awaiting operator confirmation." : null,
      reviewedBy: reviewed ? seed.assignedToName ?? "T. Nguyen" : null,
      reviewedAt: reviewed ? "2026-08-10T08:00:00Z" : null,
      updatedAt: "2026-08-12T06:30:00Z",
      revision: 1,
    } satisfies DdResponse;
  });
}

function sampleValue(item: DdTemplateItem): DdResponse["responseValue"] {
  switch (item.responseType) {
    case "boolean":
      return true;
    case "number":
      return item.unit === "PUE" ? 1.24 : 120;
    case "date":
      return "2026-05-14";
    case "single_select":
      return item.options?.[0] ?? "";
    case "multi_select":
      return item.options?.slice(0, 2) ?? [];
    case "document":
      return "See attached evidence.";
    default:
      return "Confirmed against the commissioning documentation.";
  }
}

export function buildMockAssessments(): {
  summaries: DdAssessmentSummary[];
  responsesByAssessment: Record<string, DdResponse[]>;
} {
  const responsesByAssessment: Record<string, DdResponse[]> = {};
  const summaries = ASSESSMENT_SEEDS.map((seed) => {
    responsesByAssessment[seed.id] = buildResponses(seed);
    return {
      assessmentId: seed.id,
      dealId: seed.dealId,
      templateVersionId: MOCK_TEMPLATE_VERSION_LABEL,
      status: seed.status,
      assignedTo: seed.assignedToName ?? null,
      createdBy: "mock-technical-user",
      startedAt: seed.startedAt ?? null,
      completedAt: seed.completedAt ?? null,
      updatedAt: "2026-08-12T06:30:00Z",
      revision: 1,
      // Placeholder; the mock adapter recomputes this from the responses using
      // the documented formulas before returning anything.
      metrics: {
        totalItems: mockDdTemplateItems.length,
        reviewedItems: 0,
        applicableReviewedItems: 0,
        compliantItems: 0,
        partiallyCompliantItems: 0,
        completionRate: null,
        complianceRate: null,
        criticalFailures: 0,
      },
    } satisfies DdAssessmentSummary;
  });

  return { summaries, responsesByAssessment };
}
