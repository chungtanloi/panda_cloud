import { COMMITMENT_DISCOUNTS, EGRESS_PER_GPU_HOUR } from "@/config/booking";
import type {
  BookingDraft,
  BookingQuote,
  CommitmentTerm,
  GpuModel,
  QuoteLineItem,
} from "@/models/booking";

/**
 * Run-rate calculation shared by the mock adapter and the pricing panel.
 *
 * ⚠ These are the frontend's working assumptions so the wizard is usable
 * end-to-end. The real commercial model belongs to the backend
 * (`POST /bookings/quote`, docs/API_CONTRACT.md § 4) — replace this, do not
 * port it.
 *
 * One rule matters more than the formula: **the total is always the sum of the
 * line items shown**. The design's own step-3 panel does not satisfy that
 * (245.60 + 13.00 − 65.00 = 193.60, displayed as 288.48), which would look like
 * a bug to any customer who adds it up.
 */

const HOURS_PER_MONTH = 730;

export function computeQuote(draft: BookingDraft, catalogue: GpuModel[]): BookingQuote {
  const model = catalogue.find((gpu) => gpu.id === draft.hardware?.gpuModelId);
  const gpuCount = draft.scale?.gpuCount ?? 0;
  const commitment = draft.scale?.commitment ?? "on_demand";

  // Pre-order models have no rate; treat them as zero rather than guessing one.
  const rate = model?.hourlyRateUsd ?? 0;

  const computeBase = rate * gpuCount;
  const egress = EGRESS_PER_GPU_HOUR * gpuCount;
  const discountRate = COMMITMENT_DISCOUNTS[commitment];
  const discount = -(computeBase * discountRate);

  const hourlyItems: QuoteLineItem[] = [
    {
      label: model ? `Base Compute (${gpuCount}x ${model.name})` : "Base Compute",
      amountUsd: round(computeBase),
    },
    { label: "Network Egress (Est.)", amountUsd: round(egress) },
  ];

  // Only show the discount line when one actually applies.
  if (discountRate > 0) {
    hourlyItems.push({
      label: `Term Discount (${commitmentLabel(commitment)})`,
      amountUsd: round(discount),
    });
  }

  const hourlyTotal = round(hourlyItems.reduce((sum, item) => sum + item.amountUsd, 0));

  // Monthly view — the step-5 panel splits support out as its own line.
  const monthlyCompute = round(computeBase * HOURS_PER_MONTH * (1 - discountRate));
  const monthlyEgress = round(egress * HOURS_PER_MONTH);
  const monthlySupport = round(monthlyCompute * 0.04);

  const monthlyItems: QuoteLineItem[] = [
    { label: "Compute Base", amountUsd: monthlyCompute },
    { label: "Networking Overage Est.", amountUsd: monthlyEgress },
    { label: "Premium Support", amountUsd: monthlySupport },
  ];

  return {
    hourly: { lineItems: hourlyItems, total: hourlyTotal },
    monthly: {
      lineItems: monthlyItems,
      total: round(monthlyItems.reduce((sum, item) => sum + item.amountUsd, 0)),
    },
    discountPercent: Math.round(discountRate * 100),
  };
}

function commitmentLabel(term: CommitmentTerm): string {
  switch (term) {
    case "monthly":
      return "1mo";
    case "one_year":
      return "1y";
    case "three_year":
      return "3y";
    case "on_demand":
      return "";
  }
}

/** Two decimals — currency, and it keeps the displayed sum honest. */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}
