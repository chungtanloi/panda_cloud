"use client";

import React, { useState } from "react";
import { apiConfig } from "@/services/config";
import type { DemoScenarioId } from "@/models";
import { demoSiteInspectionStore } from "@/services/mock/siteInspectionMock";

interface ScenarioCardInfo {
  id: DemoScenarioId;
  name: string;
  badge: string;
  summary: string;
  targetRoute: string;
}

const SCENARIOS: ScenarioCardInfo[] = [
  {
    id: "ready",
    name: "1. Ready for Load",
    badge: "Happy Journey",
    summary: "Clean capture, automatic battery rule activation, 100% pass, and reviewed final certificate.",
    targetRoute: "/inspections/insp_demo_ready/capture",
  },
  {
    id: "retake",
    name: "2. In-Field Preflight Retake",
    badge: "AI Guidance",
    summary: "Simulated blurry nameplate & wrong component image, guiding the user to replace evidence.",
    targetRoute: "/inspections/insp_demo_retake/capture",
  },
  {
    id: "critical",
    name: "3. Critical Risk Blocker",
    badge: "Safety Invariant",
    summary: "Inadequate generator fuel reserve blocks readiness; overall verdict becomes NOT READY.",
    targetRoute: "/inspections/insp_demo_critical/results",
  },
  {
    id: "override",
    name: "4. Reviewer Decision Override",
    badge: "PE Accountability",
    summary: "Technical reviewer audits citations and overrides an AI finding with audited reasoning.",
    targetRoute: "/technical/inspections/insp_demo_override",
  },
  {
    id: "missing",
    name: "5. Inaccessible Equipment",
    badge: "Limitation Scope",
    summary: "Substation room marked unavailable; completeness requires limitation sign-off.",
    targetRoute: "/inspections/insp_demo_missing/review",
  },
  {
    id: "outage",
    name: "6. Provider 503 Outage Recovery",
    badge: "Resilience",
    summary: "AI provider timeout handled gracefully with idempotency retry preservation.",
    targetRoute: "/inspections/insp_demo_outage/results",
  },
  {
    id: "conflict",
    name: "7. 409 Revision Conflict",
    badge: "Concurrency",
    summary: "Concurrent reviewer claim collision detected; reloads latest state safely.",
    targetRoute: "/technical/inspections/insp_demo_conflict",
  },
];

export function DemoPresenterDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  if (apiConfig.adapter !== "mock") {
    return null;
  }

  const activeScenario = demoSiteInspectionStore.getScenario();

  return (
    <aside aria-label="Demo Presenter Control Panel">
      {/* Floating Pill Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-2xl hover:brightness-110 flex items-center gap-2 border border-amber-300/40"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        Presenter Tools ({activeScenario})
      </button>

      {/* Drawer Body */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-alt/95 backdrop-blur-xl border-l border-line-card shadow-2xl flex flex-col p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
            <div>
              <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                Demo Scenario Orchestrator
              </span>
              <h3 className="text-lg font-bold text-ink">Choose Journey Scenario</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 rounded-lg text-ink-dim hover:text-ink hover:bg-card border border-line text-xs font-mono uppercase"
            >
              Close
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {SCENARIOS.map((sc) => {
              const isCurrent = sc.id === activeScenario;

              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    demoSiteInspectionStore.resetScenario(sc.id);
                    window.location.href = sc.targetRoute;
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                    isCurrent
                      ? "border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-950/20"
                      : "border-line bg-card/60 hover:border-line-strong hover:bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink">{sc.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-amber-300 uppercase">
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-xs text-ink-dim leading-relaxed">{sc.summary}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-line mt-4">
            <button
              type="button"
              onClick={() => {
                demoSiteInspectionStore.resetScenario("ready");
                window.location.href = "/site-inspections";
              }}
              className="w-full py-2.5 rounded-xl bg-surface hover:bg-card border border-line text-xs font-mono text-ink transition"
            >
              Reset to Landing Page (/site-inspections)
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
