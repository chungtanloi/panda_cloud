"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import type {
  TechnicalInspectionDetail,
  CriterionFinding,
  CriterionVerdict,
  FinalReport,
} from "@/models";

export function useTechnicalReview(inspectionId: string) {
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<TechnicalInspectionDetail | null>(null);
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>("");
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);

  // Override form
  const [overrideVerdict, setOverrideVerdict] = useState<CriterionVerdict>("pass");
  const [overrideReason, setOverrideReason] = useState("");
  const [customerRationale, setCustomerRationale] = useState("");

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.inspectionReview.getDetail(inspectionId);
      setDetail(data);

      if (data.result.findings.length > 0 && !selectedCriterionId) {
        setSelectedCriterionId(data.result.findings[0]?.criterionId || "");
      }

      if (data.inspection.status === "final") {
        const report = await api.siteInspections.getFinalReport(inspectionId).catch(() => null);
        setFinalReport(report);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load inspection review detail.");
    } finally {
      setLoading(false);
    }
  }, [inspectionId, selectedCriterionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleClaim = useCallback(async () => {
    if (!detail) return;
    try {
      setActionInProgress(true);
      setError(null);
      const updated = await api.inspectionReview.claimInspection(inspectionId, {
        expectedRevision: detail.inspection.revision,
      });
      setDetail(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to claim inspection.");
    } finally {
      setActionInProgress(false);
    }
  }, [detail, inspectionId]);

  const handleRelease = useCallback(async () => {
    try {
      setActionInProgress(true);
      setError(null);
      const updated = await api.inspectionReview.releaseClaim(inspectionId);
      setDetail(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to release claim.");
    } finally {
      setActionInProgress(false);
    }
  }, [inspectionId]);

  const handleResolveCriterion = useCallback(async () => {
    if (!detail || !selectedCriterionId) return;

    if (!overrideReason.trim()) {
      setError("Please provide an engineering reason for this determination.");
      return;
    }

    try {
      setActionInProgress(true);
      setError(null);
      const updated = await api.inspectionReview.resolveCriterion(inspectionId, selectedCriterionId, {
        verdict: overrideVerdict,
        reason: overrideReason,
        customerRationale,
        expectedRevision: detail.inspection.revision,
      });
      setDetail(updated);
      setOverrideReason("");
      setCustomerRationale("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resolve criterion.");
    } finally {
      setActionInProgress(false);
    }
  }, [detail, selectedCriterionId, overrideVerdict, overrideReason, customerRationale, inspectionId]);

  const handleFinalize = useCallback(async () => {
    if (!detail) return;
    try {
      setActionInProgress(true);
      setError(null);
      const report = await api.inspectionReview.finalizeInspection(inspectionId, {
        expectedRevision: detail.inspection.revision,
        confirmReadiness: true,
      });
      setFinalReport(report);
      await loadDetail();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to finalize inspection.");
    } finally {
      setActionInProgress(false);
    }
  }, [detail, inspectionId, loadDetail]);

  const selectedFinding: CriterionFinding | undefined = detail?.result.findings.find(
    (f) => f.criterionId === selectedCriterionId,
  );

  return {
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
    reload: loadDetail,
  };
}
