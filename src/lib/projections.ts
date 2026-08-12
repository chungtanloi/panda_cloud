import { CAPEX_PER_MW, DELIVERY_PHASES, HYPERSCALE_REGIONS, STEP_GEOGRAPHY } from "@/config/hyperscale";
import type {
  CapexProjection,
  DeliverySchedule,
  HyperscaleDraft,
  ProjectStage,
  RegionFacts,
  StageAnalysis,
} from "@/models/hyperscale";
import type { InvestmentDraft, SettlementQuote, VolumeProjection } from "@/models/investment";

/**
 * Projection maths shared by the mock adapter and, where useful, the UI.
 *
 * ⚠ Every formula here is a frontend working assumption so the wizards respond
 * to input. The authoritative models — token economics, CapEx rates, delivery
 * scheduling — belong to the backend. Replace these, do not port them.
 *
 * Two rules they all follow:
 *   1. A displayed total always equals the sum of the parts shown beside it.
 *   2. Nothing is invented for a step the user has not answered.
 */

/* ----------------------------- Investment ------------------------------ */

/** USD per token. Placeholder — the real rate comes from `/investments/rate`. */
export const TOKEN_PRICE_USD = 2;

export function projectVolume(amountUsd: number): VolumeProjection {
  const tokenAllocation = Math.round(amountUsd / TOKEN_PRICE_USD);

  // Hash-rate scales with allocation; the design shows 450 TH/s at $25k.
  const hashRateTh = Math.round((amountUsd / 25_000) * 450);

  // ROI tapers as allocation grows — larger positions buy at a thinner margin.
  const roiPercent = Math.round(215 * (1 - Math.min(0.35, amountUsd / 3_000_000)));

  return {
    tokenAllocation,
    tokenSymbol: "CPT",
    hashRate: `${hashRateTh.toLocaleString("en-US")} TH/s`,
    roiPercent,
    breakEven: "Y1",
    maxYield: "Y5",
  };
}

export function quoteSettlement(draft: InvestmentDraft): SettlementQuote {
  const amountUsd = draft.volume?.amountUsd ?? 0;
  const projection = projectVolume(amountUsd);
  const method = draft.payment?.method;

  // Card carries the processing fee stated on the payment screen.
  const feeRate = method === "credit_card" ? 0.029 : method === "usdc" ? 0.000_12 : 0;
  const settlementTime =
    method === "bank_wire" ? "1-3 business days" : method === "credit_card" ? "Instant" : "~2 Mins";

  return {
    allocationVolume: `${projection.tokenAllocation.toLocaleString("en-US")} ${projection.tokenSymbol}`,
    estimatedUsdValue: amountUsd,
    networkFeeUsd: Number((amountUsd * feeRate).toFixed(2)),
    settlementTime,
    rateLockMinutes: 15,
  };
}

/* ----------------------------- Hyperscale ------------------------------ */

const STAGE_ANALYSIS: Record<ProjectStage, StageAnalysis> = {
  greenfield: {
    estimatedTimeline: "24-36 Months",
    impact:
      "High customization, maximum scalability. Requires land acquisition and full build-out.",
    buildReadiness: 20,
  },
  retrofit: {
    estimatedTimeline: "12-18 Months",
    impact:
      "Moderate customization. Existing shell and utilities reduce lead time but constrain density.",
    buildReadiness: 55,
  },
  modular: {
    estimatedTimeline: "6-9 Months",
    impact:
      "Prefabricated units deploy quickly and expand incrementally. Limited per-site ceiling.",
    buildReadiness: 75,
  },
  turnkey: {
    estimatedTimeline: "1-3 Months",
    impact:
      "Powered shell ready for immediate rack and stack. Lowest control over power and cooling design.",
    buildReadiness: 95,
  },
};

export function analyzeStage(stage: ProjectStage): StageAnalysis {
  return STAGE_ANALYSIS[stage];
}

/**
 * Return type is annotated deliberately: without it, a renamed field in
 * CapexProjection would silently stop matching instead of failing here.
 */
export function projectCapex(draft: HyperscaleDraft): CapexProjection {
  const mw = draft.capacity?.targetCapacityMw ?? 0;
  const cooling = draft.capacity?.cooling ?? "air_hot_cold";

  const categories = [
    { label: "Infrastructure & Land", amountUsd: mw * CAPEX_PER_MW.infrastructureLand },
    { label: "Power Systems", amountUsd: mw * CAPEX_PER_MW.powerSystems },
    {
      label: "Cooling & HVAC",
      amountUsd: mw * CAPEX_PER_MW.coolingByArchitecture[cooling],
      emphasis: true,
    },
  ];

  return {
    categories,
    totalUsd: categories.reduce((sum, category) => sum + category.amountUsd, 0),
    note: "Excludes active IT hardware",
  };
}

export function listRegions(): RegionFacts[] {
  return HYPERSCALE_REGIONS.map((region) => ({
    id: region.id,
    label: region.label,
    availablePower: region.availablePower,
    coolingType: region.coolingType,
  }));
}

export function buildSchedule(draft: HyperscaleDraft): DeliverySchedule {
  const target = draft.geography?.targetGoLive;
  const phases = DELIVERY_PHASES.map((phase, index) => ({
    ...phase,
    status: index < 4 ? ("active" as const) : ("pending" as const),
  }));

  if (!target) {
    return { phases, criticalPathDelayDays: 0 };
  }

  const daysOut = Math.round(
    (new Date(target).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const threshold = STEP_GEOGRAPHY.goLive.expediteThresholdDays;

  // Anything inside the procurement window pushes the critical path.
  const criticalPathDelayDays = daysOut >= threshold ? 0 : Math.max(0, threshold - daysOut);

  return {
    phases,
    criticalPathDelayDays,
    expediteWarning: daysOut < threshold ? STEP_GEOGRAPHY.goLive.expediteWarning : undefined,
  };
}
