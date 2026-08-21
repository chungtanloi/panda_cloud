"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTechnicalReview } from "@/controllers/useTechnicalReview";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";
import { InspectionStatusPill } from "@/components/inspection/InspectionStatusPill";
import { EvidenceViewerModal } from "@/components/inspection/EvidenceViewerModal";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import type { EvidenceRecord, CriterionVerdict } from "@/models";

export default function TechnicalInspectionDetailPage() {
  const params = useParams();
  const inspectionId = String(params.id || "insp_demo_ready");

  const {
    loading,
    actionInProgress,
    error,
    detail,
    selectedCriterionId,
    setSelectedCriterionId,
    selectedFinding,
    overrideVerdict,
    setOverrideVerdict,
    overrideReason,
    setOverrideReason,
    customerRationale,
    setCustomerRationale,
    handleClaim,
    handleRelease,
    handleResolveCriterion,
    handleFinalize,
    finalReport,
  } = useTechnicalReview(inspectionId);

  const [selectedEvidenceForView, setSelectedEvidenceForView] = useState<EvidenceRecord | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-base text-ink flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-ink-dim font-mono">Loading technical review workbench...</p>
        </div>
      </div>
    );
  }

  const isClaimed = !!detail?.inspection.assignedReviewerId;
  const isFinal = detail?.inspection.status === "final";

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      <SimulationDisclosure />

      <WorkspacePage
        eyebrow="TECHNICAL WORKSPACE / SITE INSPECTION AUDIT"
        title={detail?.inspection.siteName || "Austin Hyperscale Campus"}
        description={`Organization: ${detail?.inspection.organizationName} • Profile: ${detail?.profile.name} • Location: ${detail?.inspection.address.city}, ${detail?.inspection.address.state}`}
        stats={[
          { label: "Status", value: detail?.inspection.status === "final" ? "Final" : "In Review", detail: `Rev ${detail?.inspection.revision}` },
          { label: "Provisional Verdict", value: detail?.result.overallVerdict.toUpperCase() || "READY", detail: `${detail?.result.findings.length} criteria audited` },
          { label: "Critical Risks", value: String(detail?.result.criticalFindingsCount || 0), detail: "Direct blockers" },
          { label: "Lead Reviewer", value: detail?.inspection.assignedReviewerName || "Unassigned", detail: "PE Lead" },
        ]}
      >
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link
            href="/technical/inspections"
            className="text-xs font-sans text-ink-dim hover:text-ink transition flex items-center gap-1.5"
          >
            &larr; Return to Review Queue
          </Link>

          <div className="flex items-center gap-3">
            {!isFinal && (
              <>
                {isClaimed ? (
                  <button
                    type="button"
                    disabled={actionInProgress}
                    onClick={handleRelease}
                    className="px-4 py-2 rounded-field bg-surface hover:bg-card border border-line-strong text-xs font-sans text-ink-dim transition"
                  >
                    Release Claim
                  </button>
                ) : (
                  <Button
                    type="button"
                    size="md"
                    disabled={actionInProgress}
                    onClick={handleClaim}
                    className="rounded-field"
                  >
                    Claim Inspection
                  </Button>
                )}

                <Button
                  type="button"
                  size="md"
                  disabled={actionInProgress || !isClaimed}
                  onClick={() => setShowFinalizeModal(true)}
                  className="rounded-field bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Finalize Report &rarr;
                </Button>
              </>
            )}

            {isFinal && finalReport?.downloadSessionUrl && (
              <a
                href={finalReport.downloadSessionUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-field bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs font-sans uppercase tracking-wider shadow-lg shadow-emerald-950/40"
              >
                Download Immutable Report PDF
              </a>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-field bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-sans">
            {error}
          </div>
        )}

        {/* Workbench Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Criteria Navigator */}
          <Card className="p-4 flex flex-col gap-3">
            <h2 className="text-xs font-mono font-semibold uppercase text-ink-dim tracking-wider mb-1">
              Criteria Evaluation List ({detail?.result.findings.length || 0})
            </h2>

            <div className="space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {detail?.result.findings.map((finding) => {
                const isSelected = finding.criterionId === selectedCriterionId;
                const isOverridden = finding.isOverridden;

                return (
                  <div
                    key={finding.id}
                    onClick={() => setSelectedCriterionId(finding.criterionId)}
                    className={`p-3.5 rounded-field border cursor-pointer transition ${
                      isSelected
                        ? "border-accent bg-accent/5 shadow-md"
                        : "border-line bg-deep/80 hover:border-line-strong"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-ink truncate">
                        {finding.criterionCode}: {finding.title}
                      </span>
                      <InspectionStatusPill status={finding.criticality} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-dim mt-2">
                      <span className="text-[10px] text-ink-dim">{finding.category}</span>
                      <div className="flex items-center gap-1.5">
                        {isOverridden && (
                          <span className="text-[10px] text-amber-400 font-semibold uppercase">
                            [OVERRIDDEN]
                          </span>
                        )}
                        <InspectionStatusPill
                          status={finding.finalVerdict || finding.provisionalVerdict}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Center/Right Workbench Detail */}
          <div className="lg:col-span-2 space-y-6">
            {selectedFinding ? (
              <Card className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-line">
                  <div>
                    <span className="text-xs font-mono text-accent font-semibold uppercase tracking-wider block mb-1">
                      {selectedFinding.criterionCode} &bull; {selectedFinding.category}
                    </span>
                    <h2 className="text-xl font-bold text-ink">{selectedFinding.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <InspectionStatusPill status={selectedFinding.criticality} size="sm" />
                    <InspectionStatusPill
                      status={selectedFinding.finalVerdict || selectedFinding.provisionalVerdict}
                      size="md"
                    />
                  </div>
                </div>

                {/* Observation & Rationale */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="p-4 rounded-field bg-deep border border-line space-y-1.5">
                    <span className="font-mono text-accent font-semibold uppercase text-[11px]">
                      Direct Photographic Observation:
                    </span>
                    <p className="text-ink leading-relaxed">
                      {selectedFinding.directObservation}
                    </p>
                  </div>

                  <div className="p-4 rounded-field bg-deep border border-line space-y-1.5">
                    <span className="font-mono text-accent font-semibold uppercase text-[11px]">
                      AI Engineering Rationale:
                    </span>
                    <p className="text-ink-dim leading-relaxed">
                      {selectedFinding.engineeringRationale}
                    </p>
                  </div>
                </div>

                {/* Citations */}
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase text-ink-dim tracking-wider mb-2">
                    Cited Evidence Records ({selectedFinding.citations.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFinding.citations.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setSelectedEvidenceForView({
                            id: c.evidenceId,
                            taskId: "task",
                            documentId: c.evidenceId,
                            fileName: c.fileName,
                            fileSizeBytes: 2048000,
                            mimeType: "image/jpeg",
                            status: "accepted",
                            uploadedAt: new Date().toISOString(),
                          })
                        }
                        className="px-3 py-1.5 rounded-field bg-deep border border-line text-ink hover:border-accent text-xs font-mono flex items-center gap-2 transition"
                      >
                        <span>[FILE] {c.fileName}</span>
                        <span className="text-[10px] text-accent">View</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reviewer Determination Form */}
                {!isFinal && isClaimed && (
                  <div className="p-5 rounded-field bg-deep border border-line space-y-4">
                    <h3 className="text-xs font-mono font-semibold uppercase text-accent tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent" />
                      Reviewer Determination &amp; Override
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Determination *"
                        value={overrideVerdict}
                        options={[
                          { value: "pass", label: "PASS" },
                          { value: "fail", label: "FAIL" },
                          { value: "not_verified", label: "NOT VERIFIED" },
                          { value: "not_applicable", label: "NOT APPLICABLE" },
                        ]}
                        onChange={(e) => setOverrideVerdict(e.target.value as CriterionVerdict)}
                      />

                      <Input
                        label="Engineering Override Reason *"
                        placeholder="e.g. Verified secondary breaker nameplate photo"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                      />
                    </div>

                    <Input
                      label="Customer-Safe Report Explanation"
                      placeholder="e.g. Confirmed continuous service entrance capacity meets design load."
                      value={customerRationale}
                      onChange={(e) => setCustomerRationale(e.target.value)}
                    />

                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        size="md"
                        disabled={actionInProgress || !overrideReason.trim()}
                        onClick={handleResolveCriterion}
                        className="rounded-field"
                      >
                        Save Determination
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 text-center text-ink-dim text-xs font-sans">
                Select a criterion from the left navigator to inspect.
              </Card>
            )}
          </div>
        </div>
      </WorkspacePage>

      {/* Modal */}
      <EvidenceViewerModal
        evidence={selectedEvidenceForView}
        onClose={() => setSelectedEvidenceForView(null)}
      />

      {/* Finalize Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-surface border border-line-card rounded-card p-6 space-y-4 shadow-2xl backdrop-blur-card">
            <h3 className="text-base font-bold text-ink font-sans">Finalize Reviewed Report</h3>
            <p className="text-xs text-ink-dim leading-relaxed font-sans">
              Finalizing will generate an immutable, cryptographically signed readiness report for <strong className="text-ink">{detail?.inspection.siteName}</strong>. The report version will become permanent and read-only.
            </p>

            <div className="p-3.5 bg-deep rounded-field border border-line text-xs font-mono text-ink-dim space-y-1">
              <div>Overall Verdict: <span className="text-accent uppercase font-bold">{detail?.result.overallVerdict}</span></div>
              <div>Audited Criteria: {detail?.result.findings.length} items</div>
              <div>Lead Reviewer: Alex Vance, Senior PE</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowFinalizeModal(false)}
                className="px-4 py-2 text-xs text-ink-dim hover:text-ink font-sans font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionInProgress}
                onClick={async () => {
                  await handleFinalize();
                  setShowFinalizeModal(false);
                }}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-field text-xs font-sans font-semibold uppercase tracking-wider transition"
              >
                Confirm &amp; Issue Final Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
