"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useInspectionCapture } from "@/controllers/useInspectionCapture";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";
import { InspectionStatusPill } from "@/components/inspection/InspectionStatusPill";
import { EvidenceCard } from "@/components/inspection/EvidenceCard";
import { EvidenceViewerModal } from "@/components/inspection/EvidenceViewerModal";
import { InspectionCopilotPanel } from "@/components/inspection/InspectionCopilotPanel";

export default function InspectionCapturePage() {
  const params = useParams();
  const inspectionId = String(params.id || "insp_demo_ready");

  const {
    loading,
    error,
    inspection,
    tasks,
    categories,
    activeCategory,
    setActiveCategory,
    activeTaskId,
    setActiveTaskId,
    activeTask,
    filteredTasks,
    isUploading,
    selectedEvidenceForView,
    setSelectedEvidenceForView,
    conditionalNotice,
    setConditionalNotice,
    handleFileUpload,
    handleRemoveEvidence,
    handleMarkUnavailable,
    totalTasksCount,
    completedTasksCount,
  } = useInspectionCapture(inspectionId);

  const [isCopilotOpenMobile, setIsCopilotOpenMobile] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState("");
  const [showUnavailableDialog, setShowUnavailableDialog] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-base text-ink flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-ink-dim font-mono">Loading capture checklist studio...</p>
        </div>
      </div>
    );
  }

  const completionPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      <SimulationDisclosure />

      {/* Sticky Top Header */}
      <header className="border-b border-line bg-surface/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/site-inspections"
              className="p-1.5 rounded-lg text-ink-dim hover:text-ink hover:bg-card transition"
              title="Return"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-ink truncate">
                  {inspection?.siteName || "Data Center Facility Capture"}
                </h1>
                <InspectionStatusPill status={inspection?.status || "collecting"} size="sm" />
              </div>
              <p className="text-[11px] text-ink-dim font-mono truncate">
                {inspection?.address?.city}, {inspection?.address?.state} &bull; {inspection?.profileName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress metric */}
            <div className="hidden sm:flex items-center gap-3 font-mono text-xs">
              <div className="w-28 h-2 bg-deep rounded-full overflow-hidden border border-line">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="text-accent font-semibold">{completedTasksCount}/{totalTasksCount} Ready</span>
            </div>

            {/* Mobile Copilot Trigger */}
            <button
              type="button"
              onClick={() => setIsCopilotOpenMobile(true)}
              className="md:hidden px-3 py-1.5 rounded-lg bg-surface hover:bg-card border border-line text-accent text-xs font-mono flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Copilot
            </button>

            {/* Review & Submit Button */}
            <Link
              href={`/inspections/${inspectionId}/review`}
              className="px-4 py-2 rounded-xl bg-accent text-accent-fg font-medium hover:bg-accent-dim transition text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-accent/10"
            >
              Review &amp; Submit &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Conditional Task Live Alert */}
      {conditionalNotice && (
        <div
          role="status"
          aria-live="polite"
          className="bg-accent/10 border-b border-accent/30 px-4 py-2 text-xs text-accent flex items-center justify-between gap-4 animate-fade-in"
        >
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <span className="font-mono font-bold uppercase">&bull; Rule Trigger:</span>
            <span>{conditionalNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setConditionalNotice(null)}
            className="text-ink-dim hover:text-ink text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/70 border-b border-rose-500/30 px-4 py-2 text-xs text-rose-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Studio 3-Region Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* Region 1 (Left): Task Categories & Checklist */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-surface border border-line">
            <h2 className="text-xs font-mono font-semibold uppercase text-ink-mute tracking-wider mb-3">
              Categories
            </h2>
            <div className="flex flex-wrap md:flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`text-left text-xs px-3 py-2 rounded-lg transition font-medium flex items-center justify-between ${
                  activeCategory === "all"
                    ? "bg-accent text-accent-fg"
                    : "bg-deep text-ink-dim hover:text-ink hover:bg-card"
                }`}
              >
                <span>All Checklist Tasks</span>
                <span className="font-mono text-[11px] opacity-80">{tasks.length}</span>
              </button>
              {categories.map((cat) => {
                const count = tasks.filter((t) => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`text-left text-xs px-3 py-2 rounded-lg transition font-medium flex items-center justify-between ${
                      activeCategory === cat
                        ? "bg-accent text-accent-fg"
                        : "bg-deep text-ink-dim hover:text-ink hover:bg-card"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span className="font-mono text-[11px] opacity-80">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 p-4 rounded-xl bg-surface border border-line flex flex-col">
            <h2 className="text-xs font-mono font-semibold uppercase text-ink-mute tracking-wider mb-3">
              Tasks in Category
            </h2>
            <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
              {filteredTasks.map((task) => {
                const isActive = task.id === activeTaskId;
                const hasEvidence = task.evidence.length > 0;
                const hasIssue = task.evidence.some(
                  (e) => e.status === "retake_required" || e.status === "wrong_evidence",
                );

                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskId(task.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      isActive
                        ? "border-accent bg-accent/5 shadow-md shadow-accent/5"
                        : "border-line bg-card/60 hover:border-line-strong hover:bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3
                        className={`text-xs font-medium truncate ${
                          isActive ? "text-accent" : "text-ink"
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </h3>
                      <InspectionStatusPill status={task.criticality} size="sm" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-ink-dim">
                      <span>{task.category}</span>
                      {task.isUnavailable ? (
                        <span className="text-zinc-400">Unavailable</span>
                      ) : hasIssue ? (
                        <span className="text-amber-400 font-semibold">⚠ Retake Needed</span>
                      ) : hasEvidence ? (
                        <span className="text-emerald-400">✓ Ready ({task.evidence.length})</span>
                      ) : (
                        <span className="text-ink-mute">Pending</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Region 2 (Center): Active Task Capture Studio */}
        <section className="flex-1 flex flex-col gap-6">
          {activeTask ? (
            <div className="p-6 rounded-2xl bg-surface border border-line flex flex-col gap-6">
              {/* Task Header */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono text-accent font-semibold uppercase tracking-wider">
                    {activeTask.category} &bull; {activeTask.criticality} Priority
                  </span>
                  <InspectionStatusPill status={activeTask.status} size="sm" />
                </div>
                <h2 className="text-xl font-bold text-ink mb-2">{activeTask.title}</h2>
                <p className="text-xs sm:text-sm text-ink-dim leading-relaxed">
                  {activeTask.instruction}
                </p>
              </div>

              {/* Safety & Non-invasive Warning */}
              <div className="p-3.5 rounded-xl bg-deep border border-line-soft flex items-start gap-3 text-xs text-ink-dim">
                <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="space-y-0.5">
                  <strong className="text-ink font-semibold">Safety Boundary Protocol:</strong>
                  <p>
                    Capture from outside energized electrical boundaries. Do not open energized panels, remove covers, or touch live components.
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              {!activeTask.isUnavailable && (
                <div>
                  <label
                    htmlFor="evidence-file-input"
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                      isUploading
                        ? "border-accent bg-accent/5 animate-pulse"
                        : "border-line-strong hover:border-accent hover:bg-card/40"
                    }`}
                  >
                    <input
                      id="evidence-file-input"
                      type="file"
                      accept={activeTask.allowedMimeTypes.join(",")}
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(activeTask.id, file);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />

                    <div className="w-12 h-12 rounded-full bg-accent-soft border border-accent-line flex items-center justify-center text-accent mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>

                    <h3 className="text-sm font-semibold text-ink mb-1">
                      {isUploading ? "Uploading & Running AI Preflight..." : "Select Photo or PDF to Upload"}
                    </h3>
                    <p className="text-xs text-ink-dim max-w-sm mb-2">
                      Supports JPEG, PNG, WebP or official engineering PDF scan logs (max 3 files).
                    </p>
                    <span className="text-[11px] font-mono text-accent">
                      Instant optical clarity check &amp; label validation
                    </span>
                  </label>
                </div>
              )}

              {/* Uploaded Evidence Grid */}
              <div>
                <h3 className="text-xs font-mono font-semibold uppercase text-ink-mute tracking-wider mb-3">
                  Attached Evidence Records ({activeTask.evidence.length})
                </h3>

                {activeTask.evidence.length === 0 ? (
                  <div className="p-6 rounded-xl bg-deep/60 border border-line text-center text-xs text-ink-mute">
                    No evidence records uploaded for this task yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeTask.evidence.map((ev) => (
                      <EvidenceCard
                        key={ev.id}
                        evidence={ev}
                        onView={(e) => setSelectedEvidenceForView(e)}
                        onRemove={(e) => handleRemoveEvidence(activeTask.id, e.id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Cannot Provide / Mark Unavailable Action */}
              <div className="pt-4 border-t border-line flex items-center justify-between">
                {activeTask.isUnavailable ? (
                  <div className="text-xs text-amber-300 font-mono">
                    Marked unavailable: &ldquo;{activeTask.unavailableReason}&rdquo;
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUnavailableDialog(true)}
                    className="text-xs text-ink-mute hover:text-rose-400 transition font-mono"
                  >
                    Cannot provide evidence for this item?
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-ink-mute">Select a task to begin capture.</div>
          )}
        </section>

        {/* Region 3 (Right): Contextual Copilot Panel */}
        <InspectionCopilotPanel
          inspectionId={inspectionId}
          activeTaskId={activeTaskId}
          isOpenMobile={isCopilotOpenMobile}
          onCloseMobile={() => setIsCopilotOpenMobile(false)}
        />
      </main>

      {/* Evidence Viewer Modal */}
      <EvidenceViewerModal
        evidence={selectedEvidenceForView}
        onClose={() => setSelectedEvidenceForView(null)}
      />

      {/* Cannot Provide Dialog */}
      {showUnavailableDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-alt border border-line rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-ink">Mark Item as Unavailable</h3>
            <p className="text-xs text-ink-dim">
              If this equipment is not accessible, this task will be recorded as <code className="text-amber-300 font-mono">not_verified</code> and flagged in report limitations.
            </p>
            <div>
              <label htmlFor="unavailable-reason-input" className="block text-xs text-ink-mute font-mono uppercase mb-1">
                Reason (Optional)
              </label>
              <input
                id="unavailable-reason-input"
                type="text"
                value={unavailableReason}
                onChange={(e) => setUnavailableReason(e.target.value)}
                placeholder="e.g. Substation room locked by landlord"
                className="w-full px-3 py-2 rounded-lg bg-deep border border-line text-ink text-xs focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUnavailableDialog(false)}
                className="px-3 py-1.5 text-xs text-ink-dim hover:text-ink font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeTask) {
                    handleMarkUnavailable(activeTask.id, unavailableReason);
                  }
                  setShowUnavailableDialog(false);
                  setUnavailableReason("");
                }}
                className="px-4 py-1.5 text-xs bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg font-medium transition"
              >
                Confirm Unavailable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
