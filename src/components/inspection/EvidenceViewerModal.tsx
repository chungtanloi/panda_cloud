"use client";

import React, { useEffect } from "react";
import type { EvidenceRecord } from "@/models";
import { InspectionStatusPill } from "./InspectionStatusPill";

interface EvidenceViewerModalProps {
  evidence: EvidenceRecord | null;
  onClose: () => void;
  citationSnippet?: string;
}

export function EvidenceViewerModal({
  evidence,
  onClose,
  citationSnippet,
}: EvidenceViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!evidence) return null;

  const isPdf = evidence.mimeType === "application/pdf" || evidence.fileName.toLowerCase().endsWith(".pdf");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="evidence-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface-alt border border-line-card rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-card/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface border border-line">
              {isPdf ? (
                <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div>
              <h3 id="evidence-modal-title" className="text-base font-semibold text-ink">
                {evidence.fileName}
              </h3>
              <p className="text-xs text-ink-dim font-mono">
                {(evidence.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB &bull; Uploaded {new Date(evidence.uploadedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <InspectionStatusPill status={evidence.status} size="sm" />
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-dim hover:text-ink hover:bg-surface border border-transparent hover:border-line transition focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-deep/80 min-h-[360px]">
          {isPdf ? (
            <div className="text-center p-8 rounded-xl border border-line-soft bg-surface/60 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-base font-medium text-ink mb-1">{evidence.fileName}</h4>
              <p className="text-xs text-ink-dim mb-4">Official Engineering Document (PDF)</p>
              <p className="text-xs text-ink-mute">
                In demo mode, text extraction and OCR thermography metadata are processed in memory without external rendering.
              </p>
            </div>
          ) : evidence.localPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={evidence.localPreviewUrl}
              alt={evidence.fileName}
              className="max-h-[60vh] max-w-full rounded-lg object-contain border border-line shadow-lg"
            />
          ) : (
            <div className="text-center p-8 rounded-xl border border-dashed border-line bg-surface/30 max-w-md">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent-soft border border-accent-line flex items-center justify-center text-accent">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-ink mb-1">Standard Visual Evidence Record</h4>
              <p className="text-xs text-ink-dim font-mono">ID: {evidence.id}</p>
            </div>
          )}

          {/* Citation or Preflight note */}
          {citationSnippet && (
            <div className="mt-6 w-full max-w-2xl p-3.5 bg-accent/5 border border-accent/20 rounded-lg text-xs text-ink">
              <span className="font-mono text-accent font-semibold uppercase block mb-1">
                Citation Grounding:
              </span>
              <p className="italic text-ink-bright">&ldquo;{citationSnippet}&rdquo;</p>
            </div>
          )}

          {evidence.feedback && (
            <div className="mt-4 w-full max-w-2xl p-3.5 bg-surface border border-line rounded-lg text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-semibold text-ink-bright">AI Preflight Feedback:</span>
                <span className={evidence.feedback.usableQuality ? "text-emerald-400 font-mono text-[11px]" : "text-amber-400 font-mono text-[11px]"}>
                  {evidence.feedback.usableQuality ? "✓ QUALITY VERIFIED" : "⚠ ACTION NEEDED"}
                </span>
              </div>
              <p className="text-ink-dim">{evidence.feedback.summary}</p>
              {evidence.feedback.suggestedAction && (
                <p className="mt-1 text-accent text-[11px]">
                  <strong>Recommended Action:</strong> {evidence.feedback.suggestedAction}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line bg-card/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-surface-solid border border-line text-ink rounded-lg text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
