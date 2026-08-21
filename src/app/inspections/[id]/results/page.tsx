"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useInspectionResults } from "@/controllers/useInspectionResults";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";
import { InspectionStatusPill } from "@/components/inspection/InspectionStatusPill";
import { InspectionCopilotPanel } from "@/components/inspection/InspectionCopilotPanel";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";

export default function InspectionResultsPage() {
  const params = useParams();
  const inspectionId = String(params.id || "insp_demo_ready");

  const {
    loading,
    error,
    analysisStatus,
    result,
    finalReport,
    selectedFinding,
    setSelectedFinding,
    handleRetry,
    retrying,
  } = useInspectionResults(inspectionId);

  if (loading) {
    return (
      <div className="min-h-screen bg-base text-ink flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="size-[32px] border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-ink-dim font-mono">Connecting to synthesis engine...</p>
        </div>
      </div>
    );
  }

  // 1. In-Progress or Retryable Failure State
  if (analysisStatus && analysisStatus.stage !== "completed") {
    const isOutage = analysisStatus.stage === "retryable_failed";

    return (
      <div className="relative min-h-screen bg-base text-ink flex flex-col">
        <AnimatedBackdrop stars />
        <SimulationDisclosure />

        <main className="relative z-10 flex-1 max-w-[700px] w-full mx-auto px-[24px] py-[64px] flex flex-col justify-center">
          <Card className="p-[40px] text-center space-y-[24px]">
            <div className="size-[64px] rounded-full mx-auto flex items-center justify-center bg-accent-soft border border-accent-line text-accent">
              {isOutage ? (
                <span className="text-[28px]">⚠</span>
              ) : (
                <div className="size-[28px] border-2 border-accent border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div>
              <h1 className="font-sans text-[28px] font-bold text-ink">
                {isOutage ? "AI Synthesis Delayed (503 Outage)" : "Evaluating Site Infrastructure..."}
              </h1>
              <p className="mt-[8px] font-sans text-[14px] text-ink-dim max-w-[480px] mx-auto leading-[22px]">
                {analysisStatus.message}
              </p>
            </div>

            {/* 4-Stage Progress Bar */}
            <div className="max-w-[460px] mx-auto space-y-[14px] text-left">
              <div className="w-full bg-deep rounded-full h-[6px] overflow-hidden border border-line">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${analysisStatus.progressPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-[8px] text-[11px] font-mono text-ink-dim pt-[4px]">
                <div className="flex items-center gap-[6px] text-emerald-400">
                  <span>✓</span> 1. Evidence Verified
                </div>
                <div className="flex items-center gap-[6px] text-emerald-400">
                  <span>✓</span> 2. Facts Extracted
                </div>
                <div className={`flex items-center gap-[6px] ${analysisStatus.progressPercent >= 75 ? "text-emerald-400" : "text-ink-dim"}`}>
                  <span>{analysisStatus.progressPercent >= 75 ? "✓" : "○"}</span> 3. Criteria Evaluated
                </div>
                <div className={`flex items-center gap-[6px] ${analysisStatus.progressPercent >= 100 ? "text-emerald-400" : "text-ink-dim"}`}>
                  <span>{analysisStatus.progressPercent >= 100 ? "✓" : "○"}</span> 4. Report Prepared
                </div>
              </div>
            </div>

            {isOutage && (
              <div className="pt-[16px] border-t border-line flex justify-center">
                <Button
                  type="button"
                  disabled={retrying}
                  loading={retrying}
                  onClick={handleRetry}
                  className="rounded-full"
                >
                  RETRY SYNTHESIS NOW
                </Button>
              </div>
            )}
          </Card>
        </main>
      </div>
    );
  }

  // 2. Results Prepared State (Provisional / Final)
  const isFinal = !result?.isProvisional && !!result?.reviewedBy;

  return (
    <div className="relative min-h-screen bg-base text-ink flex flex-col">
      <AnimatedBackdrop stars />
      <SimulationDisclosure />

      {/* Header Bar */}
      <header className="relative z-20 border-b border-line bg-surface/90 backdrop-blur-md px-[24px] lg:px-[40px] py-[16px] sticky top-0">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-[16px]">
          <div>
            <div className="flex items-center gap-[12px] mb-[2px]">
              <h1 className="font-sans text-[18px] font-bold text-ink truncate">
                {result?.siteName || "Austin Hyperscale Campus - Building B"}
              </h1>
              {isFinal ? (
                <span className="px-[10px] py-[2px] rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  ★ PANDA CLOUD REVIEWED — FINAL
                </span>
              ) : (
                <span className="px-[10px] py-[2px] rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider">
                  AI PROVISIONAL — PE REVIEW PENDING
                </span>
              )}
            </div>
            <p className="font-sans text-[12px] text-ink-dim">
              Profile: {result?.profileName} &bull; Evaluated {new Date(result?.evaluatedAt || Date.now()).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-[12px]">
            <Link
              href={`/inspections/${inspectionId}/capture`}
              className="px-[16px] py-[8px] rounded-field bg-surface hover:bg-card border border-line text-xs font-sans text-ink transition"
            >
              Checklist Studio
            </Link>

            {finalReport?.downloadSessionUrl && (
              <a
                href={finalReport.downloadSessionUrl}
                target="_blank"
                rel="noreferrer"
                className="px-[20px] py-[8px] rounded-field bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs font-sans uppercase tracking-wider transition flex items-center gap-[6px] shadow-md shadow-emerald-950/30"
              >
                <span>📥</span>
                Download Official PDF
              </a>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-rose-950/70 border-b border-rose-500/30 px-[24px] py-[8px] text-xs text-rose-200 text-center font-sans">
          {error}
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto p-[24px] lg:p-[40px] flex flex-col lg:flex-row gap-[24px]">
        <div className="flex-1 space-y-[24px]">
          {/* Overall Readiness Card */}
          <Card className="p-[28px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[20px]">
            <div className="space-y-[4px]">
              <span className="text-[11px] font-mono font-semibold uppercase text-ink-dim tracking-wider">
                Overall Infrastructure Determination
              </span>
              <div className="flex items-center gap-[12px]">
                <InspectionStatusPill status={result?.overallVerdict || "ready"} size="md" />
                <span className="font-sans text-[13px] text-ink-dim">
                  {result?.criticalFindingsCount === 0
                    ? "Zero critical failure blockers identified"
                    : `${result?.criticalFindingsCount} critical risk items require resolution`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-[24px] font-sans text-xs text-ink-dim border-t sm:border-t-0 sm:border-l border-line pt-[12px] sm:pt-0 sm:pl-[24px]">
              <div>
                <span className="block text-ink font-bold text-[22px]">{result?.findings.length || 0}</span>
                <span className="text-ink-dim text-[11px]">Criteria</span>
              </div>
              <div>
                <span className="block text-rose-400 font-bold text-[22px]">{result?.criticalFindingsCount || 0}</span>
                <span className="text-ink-dim text-[11px]">Critical</span>
              </div>
              <div>
                <span className="block text-orange-400 font-bold text-[22px]">{result?.notVerifiedCount || 0}</span>
                <span className="text-ink-dim text-[11px]">Not Verified</span>
              </div>
            </div>
          </Card>

          {/* Review SLA Banner if provisional */}
          {!isFinal && (
            <div className="p-[16px] rounded-card bg-card border border-line-card flex flex-wrap items-center justify-between gap-[10px] text-xs text-ink-dim font-sans">
              <div className="flex items-center gap-[10px]">
                <span className="size-[8px] rounded-full bg-amber-400 animate-ping" />
                <span>
                  <strong className="text-ink">Technical Review in Progress:</strong> A Panda Cloud Senior PE is auditing evidence citations. Final report SLA within 1 business day.
                </span>
              </div>
              <span className="font-mono text-accent text-[11px] font-bold">SLA: &lt; 24H</span>
            </div>
          )}

          {/* Findings List */}
          <div className="space-y-[16px]">
            <h2 className="text-xs font-mono font-semibold uppercase text-accent tracking-wider">
              Detailed Criterion Evaluations ({result?.findings.length || 0})
            </h2>

            <div className="space-y-[16px]">
              {result?.findings.map((f) => {
                const isSelected = selectedFinding?.id === f.id;
                const isPass = f.provisionalVerdict === "pass" || f.finalVerdict === "pass";

                return (
                  <Card
                    key={f.id}
                    onClick={() => setSelectedFinding(f)}
                    className={`p-[24px] cursor-pointer transition-all ${
                      isSelected
                        ? "border-accent shadow-lg"
                        : "hover:border-line-strong"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-[10px] mb-[14px]">
                      <div>
                        <span className="text-[11px] font-mono text-accent font-semibold uppercase tracking-wider block mb-[4px]">
                          {f.criterionCode} &bull; {f.category}
                        </span>
                        <h3 className="font-sans text-[16px] font-bold text-ink">{f.title}</h3>
                      </div>
                      <div className="flex items-center gap-[8px]">
                        <InspectionStatusPill status={f.criticality} size="sm" />
                        <InspectionStatusPill status={f.finalVerdict || f.provisionalVerdict} size="sm" />
                      </div>
                    </div>

                    {/* Direct Observation */}
                    <div className="p-[14px] rounded-field bg-deep border border-line mb-[12px] text-xs font-sans">
                      <span className="font-mono text-ink-dim font-semibold uppercase text-[10px] block mb-[4px]">
                        Direct Evidence Observation:
                      </span>
                      <p className="text-ink leading-relaxed">{f.directObservation}</p>
                    </div>

                    {/* Engineering Rationale */}
                    <div className="text-xs font-sans text-ink-dim leading-relaxed mb-[12px]">
                      <strong className="text-ink">Engineering Rationale: </strong>
                      {f.engineeringRationale}
                    </div>

                    {/* Remediation if not pass */}
                    {!isPass && (
                      <div className="p-[14px] rounded-field bg-amber-950/30 border border-amber-500/30 text-xs font-sans text-amber-200 mb-[12px]">
                        <strong>Recommended Remediation: </strong>
                        {f.remediationRecommendation}
                      </div>
                    )}

                    {/* Citations */}
                    {f.citations.length > 0 && (
                      <div className="pt-[12px] border-t border-line/60 flex flex-wrap items-center gap-[8px] text-xs">
                        <span className="font-mono text-ink-dim text-[10px] uppercase">
                          Citations:
                        </span>
                        {f.citations.map((c, i) => (
                          <span
                            key={i}
                            className="px-[10px] py-[3px] rounded-field bg-deep border border-line text-accent font-mono text-[11px]"
                          >
                            📎 {c.fileName}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Copilot Panel */}
        <InspectionCopilotPanel
          inspectionId={inspectionId}
          activeFindingId={selectedFinding?.id}
        />
      </main>
    </div>
  );
}
