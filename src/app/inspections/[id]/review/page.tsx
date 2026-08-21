"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useInspectionReview } from "@/controllers/useInspectionReview";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";
import { InspectionStatusPill } from "@/components/inspection/InspectionStatusPill";
import { Card, CardHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";

export default function InspectionReviewPage() {
  const params = useParams();
  const inspectionId = String(params.id || "insp_demo_ready");

  const {
    loading,
    submitting,
    error,
    inspection,
    tasks,
    completeness,
    acknowledgeLimitations,
    setAcknowledgeLimitations,
    handleSubmit,
    canSubmit,
  } = useInspectionReview(inspectionId);

  if (loading) {
    return (
      <div className="min-h-screen bg-base text-ink flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-ink-dim font-mono">Evaluating completeness summary...</p>
        </div>
      </div>
    );
  }

  const groups = completeness?.groups;

  return (
    <div className="relative min-h-screen bg-base text-ink flex flex-col">
      <AnimatedBackdrop stars />
      <SimulationDisclosure />

      <main className="relative z-10 flex-1 max-w-[1000px] w-full mx-auto px-[24px] lg:px-[40px] py-[40px] lg:py-[64px]">
        {/* Header */}
        <Reveal className="mb-[32px]">
          <div className="flex items-center gap-[8px] text-[12px] text-ink-dim mb-[12px] font-sans">
            <Link href={`/inspections/${inspectionId}/capture`} className="text-accent hover:underline">
              &larr; Return to Capture Studio
            </Link>
            <span>/</span>
            <span className="text-ink">Completeness Review</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-[16px]">
            <div>
              <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px] font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-accent mb-[10px]">
                <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
                STEP 2 OF 3 &bull; COMPLETENESS VERIFICATION
              </span>
              <h1 className="font-sans text-[32px] font-bold leading-[1.2] tracking-[-1px] text-white lg:text-[40px]">
                Review Completeness &amp; Submit
              </h1>
              <p className="mt-[6px] font-sans text-[14px] text-ink-dim">
                Site: <strong className="text-ink font-semibold">{inspection?.siteName}</strong> &bull; {inspection?.address?.city}, {inspection?.address?.state}
              </p>
            </div>
            <InspectionStatusPill status={inspection?.status || "collecting"} size="md" />
          </div>
        </Reveal>

        {error && (
          <div className="mb-[24px] p-[16px] rounded-field bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[13px] font-sans">
            {error}
          </div>
        )}

        {/* Group Counts Metric Cards */}
        <Reveal delay={60} className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] mb-[32px]">
          <div className="p-[20px] rounded-card bg-surface border border-line-card backdrop-blur-card">
            <span className="text-[11px] font-mono text-emerald-400 uppercase block mb-[4px] font-semibold">
              Accepted Records
            </span>
            <span className="text-[28px] font-bold text-ink font-sans">{groups?.acceptedCount || 0}</span>
            <span className="text-[12px] text-ink-dim block mt-[4px]">Ready for synthesis</span>
          </div>

          <div className="p-[20px] rounded-card bg-surface border border-line-card backdrop-blur-card">
            <span className="text-[11px] font-mono text-amber-400 uppercase block mb-[4px] font-semibold">
              Retake Needed
            </span>
            <span className="text-[28px] font-bold text-ink font-sans">{groups?.retakeCount || 0}</span>
            <span className="text-[12px] text-ink-dim block mt-[4px]">Preflight action required</span>
          </div>

          <div className="p-[20px] rounded-card bg-surface border border-line-card backdrop-blur-card">
            <span className="text-[11px] font-mono text-rose-400 uppercase block mb-[4px] font-semibold">
              Missing Required
            </span>
            <span className="text-[28px] font-bold text-ink font-sans">{groups?.missingRequiredCount || 0}</span>
            <span className="text-[12px] text-ink-dim block mt-[4px]">Not uploaded</span>
          </div>

          <div className="p-[20px] rounded-card bg-surface border border-line-card backdrop-blur-card">
            <span className="text-[11px] font-mono text-ink-dim uppercase block mb-[4px] font-semibold">
              Unavailable
            </span>
            <span className="text-[28px] font-bold text-ink font-sans">{groups?.unavailableCount || 0}</span>
            <span className="text-[12px] text-ink-dim block mt-[4px]">Marked inaccessible</span>
          </div>
        </Reveal>

        {/* Missing / Unavailable Warning if any */}
        {completeness?.criticalMissingItems && completeness.criticalMissingItems.length > 0 && (
          <Reveal delay={120} className="p-[24px] rounded-card bg-amber-950/40 border border-amber-500/40 mb-[32px] space-y-[12px]">
            <div className="flex items-center gap-[10px]">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-500/40 rounded px-[6px] py-[2px] bg-amber-950/60">
                CRITICAL NOTICE
              </span>
              <h3 className="font-sans text-[15px] font-semibold text-amber-300">
                Critical Items Pending or Inaccessible
              </h3>
            </div>
            <p className="font-sans text-[13px] text-amber-200/90 leading-[20px]">
              The following critical criteria lack verified evidence. Submitting will record these criteria as <code className="font-mono bg-deep px-[6px] py-[2px] rounded text-amber-300">not_verified</code> and may impact the provisional readiness determination:
            </p>
            <ul className="list-disc list-inside font-sans text-[13px] text-amber-200/80 space-y-[4px] pl-[8px]">
              {completeness.criticalMissingItems.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </Reveal>
        )}

        {/* Checklist Breakdown Table */}
        <Reveal delay={180}>
          <Card className="mb-[32px] space-y-[20px]">
            <CardHeading
              title="Detailed Checklist Verification"
              description="Review each evidence task status before requesting synthesis."
            />

            <div className="space-y-[10px]">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-[14px] rounded-field bg-deep border border-line text-[13px] font-sans"
                >
                  <div className="min-w-0 pr-[16px]">
                    <div className="flex items-center gap-[10px] mb-[2px]">
                      <span className="font-semibold text-ink truncate">{task.title}</span>
                      <InspectionStatusPill status={task.criticality} size="sm" />
                    </div>
                    <span className="text-[11px] text-ink-dim font-mono">{task.category}</span>
                  </div>

                  <div className="flex items-center gap-[12px] flex-shrink-0">
                    <InspectionStatusPill status={task.status} size="sm" />
                    <Link
                      href={`/inspections/${inspectionId}/capture`}
                      className="font-sans text-[12px] text-accent hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* Limitations Acknowledgement */}
        <Reveal delay={240}>
          <Card className="mb-[32px] space-y-[16px]">
            <CardHeading
              title="Submission Confirmation &amp; Scope Boundary"
              description="Panda Cloud AI provides rapid advisory analysis. Final determination is audited by a licensed PE within 1 business day SLA."
            />

            <label className="flex items-start gap-[12px] cursor-pointer pt-[8px]">
              <input
                type="checkbox"
                checked={acknowledgeLimitations}
                onChange={(e) => setAcknowledgeLimitations(e.target.checked)}
                className="mt-[3px] rounded border-line bg-deep text-accent focus:ring-accent"
              />
              <span className="font-sans text-[13px] text-ink leading-[20px]">
                I acknowledge the advisory scope and confirm that all accessible evidence has been provided. Inaccessible or missing items will be evaluated as not verified.
              </span>
            </label>
          </Card>
        </Reveal>

        {/* Submit Actions */}
        <Reveal delay={300} className="flex flex-wrap items-center justify-between gap-[16px] pt-[16px]">
          <Link
            href={`/inspections/${inspectionId}/capture`}
            className="font-sans text-[14px] text-ink-dim hover:text-ink transition"
          >
            &larr; Back to Capture Studio
          </Link>

          <Button
            type="button"
            disabled={!canSubmit || submitting}
            loading={submitting}
            onClick={handleSubmit}
            className="rounded-full bg-accent px-[40px] py-[16px] font-sans text-[15px] font-bold text-accent-fg hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
          >
            SUBMIT FOR AI SYNTHESIS →
          </Button>
        </Reveal>
      </main>
    </div>
  );
}
