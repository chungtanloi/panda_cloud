"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/services/api";
import type {
  SiteInspection,
  CaptureTask,
  EvidenceRecord,
  EvidenceAttachRequest,
} from "@/models";

export function useInspectionCapture(inspectionId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inspection, setInspection] = useState<SiteInspection | null>(null);
  const [tasks, setTasks] = useState<CaptureTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedEvidenceForView, setSelectedEvidenceForView] = useState<EvidenceRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [conditionalNotice, setConditionalNotice] = useState<string | null>(null);

  // Track session-created object URLs to revoke on unmount
  const sessionObjectUrls = useRef<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [insp, taskList] = await Promise.all([
        api.siteInspections.getInspection(inspectionId),
        api.siteInspections.getTasks(inspectionId),
      ]);
      setInspection(insp);
      setTasks(taskList);
      if (taskList.length > 0 && !activeTaskId && taskList[0]) {
        setActiveTaskId(taskList[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load inspection capture data.");
    } finally {
      setLoading(false);
    }
  }, [inspectionId, activeTaskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Clean up object URLs on component unmount
  useEffect(() => {
    return () => {
      sessionObjectUrls.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
      sessionObjectUrls.current = [];
    };
  }, []);

  const handleFileUpload = useCallback(
    async (taskId: string, file: File) => {
      try {
        setIsUploading(true);
        setError(null);

        let localPreviewUrl: string | undefined;
        if (file.type.startsWith("image/")) {
          localPreviewUrl = URL.createObjectURL(file);
          sessionObjectUrls.current.push(localPreviewUrl);
        }

        const attachBody: EvidenceAttachRequest = {
          documentId: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type || "application/octet-stream",
          localPreviewUrl,
        };

        const attached = await api.siteInspections.attachEvidence(inspectionId, taskId, attachBody);

        // Update local task state
        setTasks((prevTasks) =>
          prevTasks.map((t) => {
            if (t.id === taskId) {
              const updatedEvidence = [...t.evidence, attached];
              return {
                ...t,
                evidence: updatedEvidence,
                status: attached.status === "accepted" ? "ready" : "needs_action",
              };
            }
            return t;
          }),
        );

        // Check if conditional rule triggered
        if (taskId === "task_demo_util_feeder") {
          setConditionalNotice("Conditional Battery Energy Storage task activated based on electrical feeder configuration.");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to attach evidence.");
      } finally {
        setIsUploading(false);
      }
    },
    [inspectionId],
  );

  const handleRemoveEvidence = useCallback(
    async (taskId: string, evidenceId: string) => {
      try {
        await api.siteInspections.removeEvidence(inspectionId, taskId, evidenceId);
        setTasks((prevTasks) =>
          prevTasks.map((t) => {
            if (t.id === taskId) {
              const remaining = t.evidence.filter((e) => e.id !== evidenceId);
              return {
                ...t,
                evidence: remaining,
                status: remaining.length > 0 && remaining.every((e) => e.status === "accepted") ? "ready" : "pending",
              };
            }
            return t;
          }),
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to remove evidence.");
      }
    },
    [inspectionId],
  );

  const handleMarkUnavailable = useCallback(
    async (taskId: string, reason?: string) => {
      try {
        const updated = await api.siteInspections.markTaskUnavailable(inspectionId, taskId, reason);
        setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? updated : t)));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to update task.");
      }
    },
    [inspectionId],
  );

  const categories = Array.from(new Set(tasks.map((t) => t.category)));
  const filteredTasks = activeCategory === "all" ? tasks : tasks.filter((t) => t.category === activeCategory);
  const activeTask = tasks.find((t) => t.id === activeTaskId) || tasks[0];

  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === "ready" || t.status === "unavailable").length;

  return {
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
    reload: loadData,
  };
}
