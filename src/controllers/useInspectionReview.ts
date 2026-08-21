"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import type {
  SiteInspection,
  CompletenessSummary,
  CaptureTask,
} from "@/models";

export function useInspectionReview(inspectionId: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<SiteInspection | null>(null);
  const [tasks, setTasks] = useState<CaptureTask[]>([]);
  const [completeness, setCompleteness] = useState<CompletenessSummary | null>(null);
  const [acknowledgeLimitations, setAcknowledgeLimitations] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [insp, taskList, comp] = await Promise.all([
        api.siteInspections.getInspection(inspectionId),
        api.siteInspections.getTasks(inspectionId),
        api.siteInspections.getCompleteness(inspectionId),
      ]);
      setInspection(insp);
      setTasks(taskList);
      setCompleteness(comp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load completeness review.");
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = useCallback(async () => {
    if (!inspection) return;

    try {
      setSubmitting(true);
      setError(null);

      const idempotencyKey = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      await api.siteInspections.submitInspection(inspectionId, {
        expectedRevision: inspection.revision,
        idempotencyKey,
        acknowledgeLimitations,
      });

      router.push(`/inspections/${inspectionId}/results`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit inspection.");
      setSubmitting(false);
    }
  }, [inspection, inspectionId, acknowledgeLimitations, router]);

  const canSubmit = completeness?.canSubmitNormally || (completeness?.canSubmitWithLimitations && acknowledgeLimitations);

  return {
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
  };
}
