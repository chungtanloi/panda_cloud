"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/services/api";
import type { InspectionProfile } from "@/models";

export function useProfileAdmin() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<InspectionProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<InspectionProfile | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.inspectionProfiles.listProfiles();
      setProfiles(list);
      if (list.length > 0 && !selectedProfile) {
        setSelectedProfile(list[0] ?? null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load profiles.");
    } finally {
      setLoading(false);
    }
  }, [selectedProfile]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    loading,
    error,
    profiles,
    selectedProfile,
    setSelectedProfile,
    reload: fetchProfiles,
  };
}
