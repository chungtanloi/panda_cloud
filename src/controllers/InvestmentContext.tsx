"use client";

import type { InvestmentDraft } from "@/models/investment";
import { createFlowContext } from "./createFlowContext";

/** Draft state for the AI Token Investment wizard. */
const flow = createFlowContext<InvestmentDraft>("Investment", "cp.investment.draft");

export const InvestmentProvider = flow.Provider;
export const useInvestment = flow.useFlow;
