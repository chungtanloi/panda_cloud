"use client";

import type { HyperscaleDraft } from "@/models/hyperscale";
import { createFlowContext } from "./createFlowContext";

/** Draft state for the Hyperscale Data Center wizard. */
const flow = createFlowContext<HyperscaleDraft>("Hyperscale", "cp.hyperscale.draft");

export const HyperscaleProvider = flow.Provider;
export const useHyperscale = flow.useFlow;
