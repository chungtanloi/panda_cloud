"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/services/api";

interface CopilotPanelProps {
  inspectionId: string;
  activeTaskId?: string;
  activeFindingId?: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export function InspectionCopilotPanel({
  inspectionId,
  activeTaskId,
  activeFindingId,
  isOpenMobile = false,
  onCloseMobile,
  className = "",
}: CopilotPanelProps) {
  const [prompts, setPrompts] = useState<string[]>([
    "What should I capture for this task?",
    "Why is this evidence required?",
    "What are the common preflight failure reasons?",
  ]);
  const [activeAnswer, setActiveAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadContext() {
      try {
        setLoading(true);
        const res = await api.siteInspections.getCopilotContext(inspectionId, activeTaskId, activeFindingId);
        if (!cancelled) {
          setPrompts(res.suggestedPrompts || []);
          setActiveAnswer(res.explanation || null);
        }
      } catch {
        // fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadContext();
    return () => {
      cancelled = true;
    };
  }, [inspectionId, activeTaskId, activeFindingId]);

  const handleSelectPrompt = (prompt: string) => {
    setLoading(true);
    setTimeout(() => {
      if (prompt.includes("What should I capture")) {
        setActiveAnswer(
          "Ensure the equipment nameplate or control panel is centered in frame with no glare or shadow. Ratings, serial numbers, and switch positions should be legible.",
        );
      } else if (prompt.includes("Why is this evidence")) {
        setActiveAnswer(
          "This observation verifies power capacity ratings against standard data center reliability baselines, preventing over-subscription risk.",
        );
      } else if (prompt.includes("retake")) {
        setActiveAnswer(
          "Retakes are requested when optical preflight detects image blur, glare, occluded text, or mismatch with requested electrical subsystem.",
        );
      } else if (prompt.includes("verdict")) {
        setActiveAnswer(
          "Provisional verdicts are calculated deterministically by evaluating accepted evidence against the immutable profile criteria. Final authority rests with the PE reviewer.",
        );
      } else {
        setActiveAnswer(
          "The advisory copilot provides grounded reference guidance. All findings remain backed by cited photographic or engineering document records.",
        );
      }
      setLoading(false);
    }, 300);
  };

  const content = (
    <div className="flex flex-col h-full bg-surface-alt/90 border border-line-card rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent-soft border border-accent-line flex items-center justify-center text-accent">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-ink font-mono uppercase tracking-wider">
              Inspection Copilot
            </h3>
            <p className="text-[10px] text-ink-mute">Grounded Evidence Assistant</p>
          </div>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1 text-ink-dim hover:text-ink"
            aria-label="Close Copilot"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Answer Area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {loading ? (
          <div className="p-3 bg-surface rounded-lg border border-line animate-pulse space-y-2">
            <div className="h-3 bg-raised rounded w-3/4" />
            <div className="h-3 bg-raised rounded w-1/2" />
          </div>
        ) : activeAnswer ? (
          <div className="p-3 bg-surface rounded-lg border border-line text-xs text-ink-bright leading-relaxed">
            <p>{activeAnswer}</p>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-ink-mute">
            Select a suggested prompt below for grounded assistance on this task.
          </div>
        )}

        <div className="p-2.5 bg-card/60 rounded-lg border border-line-soft text-[11px] text-ink-dim flex items-start gap-2">
          <svg className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Copilot assists capture &amp; explains findings. It does not modify inspection state or certify results.
          </span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="border-t border-line pt-3">
        <span className="text-[11px] font-mono text-ink-mute uppercase tracking-wider block mb-2">
          Suggested Prompts
        </span>
        <div className="flex flex-col gap-1.5">
          {prompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(p)}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-surface hover:bg-card border border-line-soft hover:border-accent-line text-ink-dim hover:text-accent transition leading-snug"
            >
              &bull; {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Mobile Bottom-Sheet vs Desktop Sidebar
  return (
    <>
      {/* Desktop inline panel */}
      <div className={`hidden md:block w-80 flex-shrink-0 ${className}`}>
        {content}
      </div>

      {/* Mobile Drawer/Modal */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex flex-col justify-end p-2">
          <div className="max-h-[80vh] w-full">{content}</div>
        </div>
      )}
    </>
  );
}
