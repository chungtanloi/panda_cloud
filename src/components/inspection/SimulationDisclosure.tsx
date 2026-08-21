"use client";

import React from "react";
import { apiConfig } from "@/services/config";
import type { DemoScenarioId } from "@/models";
import { demoSiteInspectionStore } from "@/services/mock/siteInspectionMock";

interface SimulationDisclosureProps {
  currentScenario?: DemoScenarioId;
  onScenarioChange?: (scenario: DemoScenarioId) => void;
  className?: string;
}

export function SimulationDisclosure({
  currentScenario,
  onScenarioChange,
  className = "",
}: SimulationDisclosureProps) {
  // Only render in mock mode per INS-UX-008
  if (apiConfig.adapter !== "mock") {
    return null;
  }

  const activeScenario = currentScenario || demoSiteInspectionStore.getScenario();

  return (
    <div
      className={`w-full bg-gradient-to-r from-amber-950/70 via-neutral-900/90 to-amber-950/70 border-b border-amber-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 text-amber-200/90 ${className}`}
      role="region"
      aria-label="Simulation Environment Disclosure"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span className="font-mono uppercase font-semibold text-amber-300">
          Prototype Mode:
        </span>
        <span>
          Simulated AI analysis &amp; technical review. No real files or credentials transmitted.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="demo-scenario-select" className="text-neutral-400 font-mono text-[11px]">
          SCENARIO:
        </label>
        <select
          id="demo-scenario-select"
          value={activeScenario}
          onChange={(e) => {
            const chosen = e.target.value as DemoScenarioId;
            demoSiteInspectionStore.resetScenario(chosen);
            if (onScenarioChange) {
              onScenarioChange(chosen);
            } else {
              window.location.reload();
            }
          }}
          className="bg-neutral-950 text-amber-300 border border-amber-500/40 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="ready">ready — Clean Happy Path</option>
          <option value="retake">retake — Quality Preflight Retake</option>
          <option value="critical">critical — Critical Generator Failure</option>
          <option value="override">override — Reviewer Verdict Override</option>
          <option value="missing">missing — Missing Evidence Limitations</option>
          <option value="outage">outage — Simulated 503 Provider Outage</option>
          <option value="conflict">conflict — 409 Optimistic Concurrency</option>
        </select>

        <button
          type="button"
          onClick={() => {
            demoSiteInspectionStore.resetScenario(activeScenario);
            window.location.reload();
          }}
          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded border border-amber-500/30 text-[11px] font-mono transition"
          title="Reset all demo metadata and session object URLs"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
