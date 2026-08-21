"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import type {
  TechnicalQueueItem,
  TechnicalQueueQuery,
  InspectionStatus,
} from "@/models";

export function useTechnicalQueue() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TechnicalQueueItem[]>([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | "all">("all");
  const [slaFilter, setSlaFilter] = useState<"all" | "approaching" | "breached">("all");
  const [page, setPage] = useState(1);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query: TechnicalQueueQuery = {
        status: statusFilter,
        slaFilter,
        page,
        pageSize: 10,
      };
      const res = await api.inspectionReview.listQueue(query);
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load technical queue.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, slaFilter, page]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return {
    loading,
    error,
    items,
    total,
    statusFilter,
    setStatusFilter,
    slaFilter,
    setSlaFilter,
    page,
    setPage,
    reload: fetchQueue,
  };
}
