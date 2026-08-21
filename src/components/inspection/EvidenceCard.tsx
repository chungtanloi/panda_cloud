"use client";

import React from "react";
import type { EvidenceRecord } from "@/models";
import { InspectionStatusPill } from "./InspectionStatusPill";

interface EvidenceCardProps {
  evidence: EvidenceRecord;
  onView: (evidence: EvidenceRecord) => void;
  onReplace?: (evidence: EvidenceRecord) => void;
  onRemove?: (evidence: EvidenceRecord) => void;
  disabled?: boolean;
}

export function EvidenceCard({
  evidence,
  onView,
  onReplace,
  onRemove,
  disabled = false,
}: EvidenceCardProps) {
  const isPdf = evidence.mimeType === "application/pdf" || evidence.fileName.toLowerCase().endsWith(".pdf");
  const needsAction = evidence.status === "retake_required" || evidence.status === "wrong_evidence" || evidence.status === "failed";

  return (
    <div
      className={`group relative flex flex-col rounded-xl border p-4 transition ${
        needsAction
          ? "border-amber-500/50 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]"
          : "border-line bg-surface/80 hover:border-accent-line hover:bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            onClick={() => onView(evidence)}
            className="w-12 h-12 rounded-lg bg-deep border border-line flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 hover:border-accent transition"
          >
            {isPdf ? (
              <span className="text-rose-400 font-mono text-xs font-bold uppercase">PDF</span>
            ) : evidence.localPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={evidence.localPreviewUrl}
                alt={evidence.fileName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-accent font-mono text-[10px] font-bold uppercase">IMAGE</span>
            )}
          </div>
          <div className="min-w-0">
            <h4
              onClick={() => onView(evidence)}
              className="text-sm font-medium text-ink truncate cursor-pointer hover:text-accent transition"
              title={evidence.fileName}
            >
              {evidence.fileName}
            </h4>
            <p className="text-xs text-ink-dim font-mono">
              {(evidence.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB &bull; {new Date(evidence.uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <InspectionStatusPill status={evidence.status} size="sm" />
      </div>

      {/* Preflight Feedback Summary */}
      {evidence.feedback && (
        <div
          className={`text-xs p-2.5 rounded-lg mb-3 ${
            evidence.feedback.usableQuality
              ? "bg-emerald-950/30 text-emerald-300 border border-emerald-500/20"
              : "bg-amber-950/40 text-amber-200 border border-amber-500/30"
          }`}
        >
          <p className="leading-relaxed">{evidence.feedback.summary}</p>
          {evidence.feedback.suggestedAction && (
            <p className="mt-1 text-[11px] text-accent font-medium">
              &rarr; {evidence.feedback.suggestedAction}
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/50 mt-auto">
        <button
          type="button"
          onClick={() => onView(evidence)}
          className="text-xs font-medium text-ink-dim hover:text-accent px-2.5 py-1 rounded hover:bg-card transition"
        >
          View Full
        </button>

        {onReplace && !disabled && (
          <button
            type="button"
            onClick={() => onReplace(evidence)}
            className="text-xs font-medium text-amber-300 hover:text-amber-200 px-2.5 py-1 rounded hover:bg-amber-500/10 transition"
          >
            Replace
          </button>
        )}

        {onRemove && !disabled && (
          <button
            type="button"
            onClick={() => onRemove(evidence)}
            className="text-xs font-medium text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded hover:bg-rose-500/10 transition"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
