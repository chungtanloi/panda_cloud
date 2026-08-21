"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/services/api";
import type {
  InspectionResult,
  InspectionAnalysisStatus,
  CriterionFinding,
  FinalReport,
} from "@/models";

export function useInspectionResults(inspectionId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<InspectionAnalysisStatus | null>(null);
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<CriterionFinding | null>(null);
  const [retrying, setRetrying] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const checkProgressAndResult = useCallback(async () => {
    try {
      setError(null);
      const status = await api.siteInspections.getAnalysisStatus(inspectionId);
      setAnalysisStatus(status);

      if (status.stage === "completed") {
        const [res, report] = await Promise.all([
          api.siteInspections.getResult(inspectionId),
          api.siteInspections.getFinalReport(inspectionId).catch(() => null),
        ]);
        setResult(res);
        setFinalReport(report);
        if (res.findings.length > 0 && !selectedFinding) {
          setSelectedFinding(res.findings[0] ?? null);
        }
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load inspection results.");
    } finally {
      setLoading(false);
    }
  }, [inspectionId, selectedFinding]);

  useEffect(() => {
    checkProgressAndResult();

    // Start polling if not yet completed
    pollingRef.current = setInterval(() => {
      checkProgressAndResult();
    }, 2500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [checkProgressAndResult]);

  const handleRetry = useCallback(async () => {
    try {
      setRetrying(true);
      setError(null);
      const retried = await api.siteInspections.retryAnalysis(inspectionId);
      setAnalysisStatus(retried);
      await checkProgressAndResult();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Retry failed.");
    } finally {
      setRetrying(false);
    }
  }, [inspectionId, checkProgressAndResult]);

  return {
    loading,
    error,
    analysisStatus,
    result,
    finalReport,
    selectedFinding,
    setSelectedFinding,
    handleRetry,
    retrying,
  };
}
