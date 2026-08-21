"use client";

import React from "react";
import type {
  InspectionStatus,
  EvidenceStatus,
  InspectionVerdict,
  CriterionVerdict,
  CriterionCriticality,
} from "@/models";

interface StatusPillProps {
  status?: InspectionStatus | EvidenceStatus | InspectionVerdict | CriterionVerdict | CriterionCriticality | string;
  type?: "inspection" | "evidence" | "verdict" | "criterion" | "criticality";
  size?: "sm" | "md";
  className?: string;
}

export function InspectionStatusPill({
  status = "unknown",
  type = "inspection",
  size = "md",
  className = "",
}: StatusPillProps) {
  let label = String(status).replace(/_/g, " ");
  let colorStyles = "bg-neutral-800/80 text-neutral-300 border-neutral-700";

  switch (status) {
    // Inspection overall & criterion verdicts
    case "ready":
    case "pass":
      colorStyles = "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
      label = status === "ready" ? "READY FOR LOAD" : "PASS";
      break;
    case "not_ready":
    case "fail":
      colorStyles = "bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]";
      label = status === "not_ready" ? "NOT READY" : "FAIL";
      break;
    case "provisional":
      colorStyles = "bg-amber-950/70 text-amber-300 border-amber-500/40";
      label = "PROVISIONAL";
      break;
    case "not_verified":
      colorStyles = "bg-orange-950/70 text-orange-300 border-orange-500/40";
      label = "NOT VERIFIED";
      break;
    case "not_applicable":
      colorStyles = "bg-zinc-900 text-zinc-400 border-zinc-700";
      label = "NOT APPLICABLE";
      break;

    // Evidence Statuses
    case "accepted":
      colorStyles = "bg-emerald-950/60 text-emerald-300 border-emerald-500/30";
      label = "ACCEPTED";
      break;
    case "uploading":
      colorStyles = "bg-cyan-950/60 text-cyan-300 border-cyan-500/30 animate-pulse";
      label = "UPLOADING";
      break;
    case "scanning":
      colorStyles = "bg-indigo-950/60 text-indigo-300 border-indigo-500/30 animate-pulse";
      label = "SCANNING";
      break;
    case "analyzing":
      colorStyles = "bg-purple-950/60 text-purple-300 border-purple-500/30 animate-pulse";
      label = "AI PREFLIGHT";
      break;
    case "retake_required":
      colorStyles = "bg-amber-950/80 text-amber-300 border-amber-500/50";
      label = "RETAKE REQUIRED";
      break;
    case "wrong_evidence":
      colorStyles = "bg-rose-950/80 text-rose-300 border-rose-500/50";
      label = "WRONG EVIDENCE";
      break;
    case "manual_review":
      colorStyles = "bg-blue-950/60 text-blue-300 border-blue-500/40";
      label = "MANUAL REVIEW";
      break;
    case "unavailable":
      colorStyles = "bg-zinc-900 text-zinc-400 border-zinc-700";
      label = "UNAVAILABLE";
      break;
    case "failed":
      colorStyles = "bg-red-950/80 text-red-300 border-red-500/50";
      label = "FAILED";
      break;

    // Criticality
    case "critical":
      colorStyles = "bg-rose-950/80 text-rose-200 border-rose-500/40 font-semibold";
      label = "CRITICAL";
      break;
    case "high":
      colorStyles = "bg-orange-950/70 text-orange-200 border-orange-500/40 font-semibold";
      label = "HIGH";
      break;
    case "medium":
      colorStyles = "bg-yellow-950/60 text-yellow-200 border-yellow-500/30";
      label = "MEDIUM";
      break;
    case "low":
      colorStyles = "bg-zinc-900 text-zinc-300 border-zinc-700";
      label = "LOW";
      break;

    // Inspection lifecycle
    case "collecting":
      colorStyles = "bg-cyan-950/60 text-cyan-300 border-cyan-500/30";
      label = "COLLECTING EVIDENCE";
      break;
    case "submitted":
    case "in_review":
      colorStyles = "bg-indigo-950/60 text-indigo-300 border-indigo-500/30";
      label = status === "in_review" ? "IN REVIEW" : "SUBMITTED";
      break;
    case "final":
      colorStyles = "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
      label = "REVIEWED FINAL";
      break;
  }

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 uppercase font-mono tracking-wider rounded-full border ${sizeStyles} ${colorStyles} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
