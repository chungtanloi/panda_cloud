import type { StatusTone } from "@/components/workspace/StatusPill";
import {
  DD_ASSESSMENT_STATUS_LABELS,
  type DdAssessmentSummary,
} from "@/models/dueDiligence";
import { KYC_STATUS_LABELS, type KycCase } from "@/models/kyc";
import { NCNDA_STATUS_LABELS, type NcndaAgreement } from "@/models/ncnda";

/**
 * The single source of truth for "is this deal ready to hand over".
 *
 * ⚠ WHY THIS MODULE EXISTS.
 *
 * Before this file, the same question was answered in three places with three
 * different implementations:
 *
 *   - `DealReadinessView` picked the newest record by `updatedAt`.
 *   - `DealHandoffPanel` picked `items[0]`, i.e. whatever order the backend
 *     happened to return.
 *   - `AgreementsPage` / `CasesPage` sorted by a hand-written urgency list and
 *     never evaluated readiness at all.
 *
 * `newest()` and `items[0]` are not guaranteed to be the same record, so one
 * deal could read "Ready" in the handoff panel and "Needs attention" on the
 * readiness page. Two different answers to one factual question is the fastest
 * way to lose a user's trust in a status display, so the rule is now fixed
 * once, here, and every surface calls this function.
 *
 * This module is pure: no I/O, no React, no environment access. The fetching
 * lives in `controllers/ReadinessContext.tsx`.
 *
 * Readiness is **guidance only**. The backend remains authoritative for
 * authorization, won status, optimistic concurrency, idempotency and the
 * project-conversion policy. Nothing here is a client-side gate.
 */

export type LaneId = "ncnda" | "kyc" | "dd";

/**
 * `missing` is deliberately distinct from `attention`: "nobody has started
 * this" and "someone is working on it" call for different next actions, and
 * collapsing them would hide the difference behind one amber pill.
 */
export type LaneState = "ready" | "attention" | "blocked" | "missing";

export const READINESS_LANES: readonly LaneId[] = ["ncnda", "kyc", "dd"];

export const LANE_LABELS: Record<LaneId, string> = {
  ncnda: "NCNDA",
  kyc: "KYC",
  dd: "Due diligence",
};

/** Which workspace owns the lane. Shown so the reader knows who to chase. */
export const LANE_OWNERS: Record<LaneId, string> = {
  ncnda: "Legal",
  kyc: "Compliance",
  dd: "Technical",
};

/** One-character badge used on the pipeline card, where space is scarce. */
export const LANE_INITIALS: Record<LaneId, string> = {
  ncnda: "N",
  kyc: "K",
  dd: "D",
};

export const LANE_STATE_LABELS: Record<LaneState, string> = {
  ready: "Ready",
  attention: "Needs attention",
  blocked: "Blocked",
  missing: "Not started",
};

export const LANE_STATE_TONES: Record<LaneState, StatusTone> = {
  ready: "good",
  attention: "waiting",
  blocked: "bad",
  missing: "neutral",
};

export interface ReadinessInput {
  agreements: readonly NcndaAgreement[];
  cases: readonly KycCase[];
  assessments: readonly DdAssessmentSummary[];
}

export interface ReadinessResult {
  lanes: Record<LaneId, LaneState>;
  /** The record each lane was judged on, or null when the lane has none. */
  current: {
    ncnda: NcndaAgreement | null;
    kyc: KycCase | null;
    dd: DdAssessmentSummary | null;
  };
  /** Human-readable current status per lane, already localized to a label. */
  statusLabels: Record<LaneId, string>;
  overall: LaneState;
  readyCount: number;
  /** The lane a reader should look at first. */
  worstLane: LaneId;
  /** One sentence naming what is holding the deal up. */
  blocker: string;
  /** One sentence naming what should happen next, and who does it. */
  nextAction: string;
}

/**
 * The fixed record-selection rule: newest by `updatedAt`.
 *
 * The backend does not promise an ordering on these list endpoints, so taking
 * `items[0]` is reading an implementation detail. Sorting explicitly makes the
 * choice visible and identical everywhere.
 */
function newest<T extends { updatedAt: string }>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}

/** NCNDA is in force only when it is `active` — every other status is not. */
function ncndaState(item: NcndaAgreement | null): LaneState {
  if (!item) return "missing";
  if (item.status === "active") return "ready";
  if (item.status === "rejected" || item.status === "expired" || item.status === "cancelled") {
    return "blocked";
  }
  return "attention";
}

/**
 * KYC needs more than an `approved` status: the backend requires `verifiedAt`
 * when approving, and an expired verification is not a current one. A case that
 * says "approved" but has lapsed must not read as ready.
 */
function kycState(item: KycCase | null): LaneState {
  if (!item) return "missing";
  if (
    item.status === "rejected" ||
    item.status === "expired" ||
    item.status === "cancelled" ||
    item.status === "provider_error" ||
    item.riskLevel === "prohibited"
  ) {
    return "blocked";
  }
  const unexpired = !item.expiresAt || new Date(item.expiresAt).getTime() > Date.now();
  return item.status === "approved" && Boolean(item.verifiedAt) && unexpired ? "ready" : "attention";
}

/**
 * A critical failure blocks regardless of completion: an assessment can be
 * 68/68 reviewed and still contain a critical non-compliance.
 */
function ddState(item: DdAssessmentSummary | null): LaneState {
  if (!item) return "missing";
  if (item.status === "cancelled" || item.metrics.criticalFailures > 0) return "blocked";
  return item.status === "completed" ? "ready" : "attention";
}

const NCNDA_NEXT: Record<NcndaAgreement["status"], string> = {
  not_requested: "Legal starts the drafting matter for this deal.",
  drafting: "Attach the current draft and complete internal review.",
  sent: "Record the counterparty response or redline.",
  received: "Review the returned agreement.",
  under_review: "Resolve redlines and prepare signature.",
  signed: "Record the countersigned document.",
  countersigned: "Set an effective date and activate the agreement.",
  active: "Monitor expiry and retain the executed version.",
  rejected: "Review the rejection before opening a new matter.",
  expired: "Review renewal requirements.",
  cancelled: "A new matter requires approval.",
};

const KYC_NEXT: Record<KycCase["status"], string> = {
  not_started: "Request KYC from the subject.",
  requested: "Confirm the evidence request.",
  pending_documents: "Collect and attach registered evidence.",
  submitted: "Start the compliance review.",
  under_review: "Set risk, then approve, reject, or request more evidence.",
  approved: "Monitor verification expiry.",
  rejected: "Review the rejection reason.",
  expired: "Re-verification is required.",
  cancelled: "A new review requires approval.",
  provider_error: "Resolve the provider issue or continue manual review.",
};

function ncndaNext(item: NcndaAgreement | null): string {
  if (!item) return "Legal creates a drafting matter from this deal.";
  return NCNDA_NEXT[item.status];
}

function kycNext(item: KycCase | null): string {
  if (!item) return "Compliance creates a case for the deal organization or primary contact.";
  return KYC_NEXT[item.status];
}

function ddNext(item: DdAssessmentSummary | null): string {
  if (!item) return "Technical initializes an assessment from the deal context.";
  if (item.metrics.criticalFailures > 0) {
    return `${item.metrics.criticalFailures} critical requirement(s) failed — Technical and Manager must review.`;
  }
  if (item.status === "completed") return "Review the final technical result and critical findings.";
  if (item.status === "cancelled") return "Manager must review why the assessment was cancelled.";
  return `${item.metrics.reviewedItems} of ${item.metrics.totalItems} requirements reviewed.`;
}

const NEXT_ACTION: Record<LaneId, (result: ReadinessResult["current"]) => string> = {
  ncnda: (current) => ncndaNext(current.ncnda),
  kyc: (current) => kycNext(current.kyc),
  dd: (current) => ddNext(current.dd),
};

/**
 * Which lane a reader should look at first. Blocked outranks not-started,
 * which outranks in-progress: a rejected KYC needs a decision today, an
 * unstarted assessment needs scheduling, and a lane in progress needs nothing
 * from the reader at all.
 */
const WORST_FIRST: readonly LaneState[] = ["blocked", "missing", "attention", "ready"];

function blockerSentence(lane: LaneId, state: LaneState, statusLabel: string): string {
  if (state === "ready") return "All three workstreams are ready.";
  if (state === "blocked") {
    return `${LANE_LABELS[lane]} is blocked (${statusLabel}) — ${LANE_OWNERS[lane]} must review.`;
  }
  if (state === "missing") {
    return `${LANE_LABELS[lane]} has not been started — ${LANE_OWNERS[lane]} owns it.`;
  }
  return `${LANE_LABELS[lane]}: ${statusLabel} — waiting on ${LANE_OWNERS[lane]}.`;
}

export function evaluateReadiness(input: ReadinessInput): ReadinessResult {
  const current = {
    ncnda: newest(input.agreements),
    kyc: newest(input.cases),
    dd: newest(input.assessments),
  };

  const lanes: Record<LaneId, LaneState> = {
    ncnda: ncndaState(current.ncnda),
    kyc: kycState(current.kyc),
    dd: ddState(current.dd),
  };

  const statusLabels: Record<LaneId, string> = {
    ncnda: current.ncnda ? NCNDA_STATUS_LABELS[current.ncnda.status] : "No agreement",
    kyc: current.kyc ? KYC_STATUS_LABELS[current.kyc.status] : "No case",
    dd: current.dd ? DD_ASSESSMENT_STATUS_LABELS[current.dd.status] : "No assessment",
  };

  const states = READINESS_LANES.map((lane) => lanes[lane]);
  const overall: LaneState = states.includes("blocked")
    ? "blocked"
    : states.every((state) => state === "ready")
      ? "ready"
      : "attention";

  // `noUncheckedIndexedAccess` is on, so the [0] is typed `LaneId | undefined`
  // even though READINESS_LANES is never empty. The fallback is unreachable.
  const worstLane: LaneId =
    [...READINESS_LANES].sort(
      (a, b) => WORST_FIRST.indexOf(lanes[a]) - WORST_FIRST.indexOf(lanes[b]),
    )[0] ?? "ncnda";

  const firstUnready = READINESS_LANES.find((lane) => lanes[lane] !== "ready");

  return {
    lanes,
    current,
    statusLabels,
    overall,
    readyCount: states.filter((state) => state === "ready").length,
    worstLane,
    blocker: blockerSentence(worstLane, lanes[worstLane], statusLabels[worstLane]),
    nextAction: firstUnready
      ? NEXT_ACTION[firstUnready](current)
      : "Manager may review and convert this won deal to a project.",
  };
}

/** Per-lane next action, for surfaces that show all three lanes at once. */
export function laneNextAction(lane: LaneId, current: ReadinessResult["current"]): string {
  return NEXT_ACTION[lane](current);
}

/**
 * Progress width for a lane bar, 0-100. `attention` uses the assessment's real
 * completion rate when there is one, because "34 of 68 reviewed" is a genuine
 * measurement, and a fixed two-thirds bar everywhere else because the other two
 * lanes are state machines with no meaningful percentage.
 */
export function lanePercent(lane: LaneId, result: ReadinessResult): number {
  const state = result.lanes[lane];
  if (state === "ready") return 100;
  if (state === "missing") return 0;
  if (lane === "dd" && result.current.dd) {
    const { reviewedItems, totalItems } = result.current.dd.metrics;
    if (totalItems > 0) return Math.round((reviewedItems / totalItems) * 100);
  }
  return 60;
}
