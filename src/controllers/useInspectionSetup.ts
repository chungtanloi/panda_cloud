"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";
import type {
  InspectionProfileVersion,
  SiteInspectionCreateRequest,
  FacilityType,
  OperationalState,
  InspectionObjective,
  KnownSystemsMap,
  UsAddress,
} from "@/models";

export function useInspectionSetup() {
  const router = useRouter();
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profiles, setProfiles] = useState<InspectionProfileVersion[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [organizationId, setOrganizationId] = useState("org_demo_northstar");
  const [siteName, setSiteName] = useState("Austin Hyperscale Campus - Building B");
  const [address, setAddress] = useState<UsAddress>({
    streetAddress: "10800 Tech Ridge Blvd",
    city: "Austin",
    state: "TX",
    postalCode: "78753",
  });
  const [timeZone, setTimeZone] = useState("America/Chicago");
  const [facilityType, setFacilityType] = useState<FacilityType>("enterprise_dc");
  const [operationalState, setOperationalState] = useState<OperationalState>("commissioned_active");
  const [objective, setObjective] = useState<InspectionObjective>("ai_readiness_assessment");

  const [knownSystems, setKnownSystems] = useState<KnownSystemsMap>({
    utilityFeeder: true,
    mainTransformerSwitchgear: true,
    upsSystem: true,
    batteryEnergyStorage: true,
    backupGenerators: true,
    hvacCooling: true,
    fireSuppression: true,
    physicalSecurityAccess: true,
  });

  const [ahjName, setAhjName] = useState("City of Austin Development Services");
  const [isUnknownAhj, setIsUnknownAhj] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchProfiles() {
      try {
        setLoadingProfiles(true);
        const data = await api.siteInspections.getPublishedProfiles();
        if (active) {
          setProfiles(data);
          if (data.length > 0 && data[0]) {
            setSelectedProfileId(data[0].id);
          }
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load profiles");
        }
      } finally {
        if (active) setLoadingProfiles(false);
      }
    }
    fetchProfiles();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = useCallback(async () => {
    if (!siteName.trim() || !address.streetAddress.trim() || !address.city.trim() || !address.state.trim() || !address.postalCode.trim()) {
      setError("Please complete all required site identification and address fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const body: SiteInspectionCreateRequest = {
        organizationId,
        profileVersionId: selectedProfileId,
        siteName,
        address,
        timeZone,
        facilityType,
        operationalState,
        objective,
        knownSystems,
        jurisdiction: {
          ahjName: isUnknownAhj ? undefined : ahjName,
          isUnknown: isUnknownAhj,
        },
        idempotencyKey,
      };

      const created = await api.siteInspections.createInspection(body);
      router.push(`/inspections/${created.id}/capture`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create site inspection.");
      setSubmitting(false);
    }
  }, [
    organizationId,
    selectedProfileId,
    siteName,
    address,
    timeZone,
    facilityType,
    operationalState,
    objective,
    knownSystems,
    ahjName,
    isUnknownAhj,
    router,
  ]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  return {
    loadingProfiles,
    profiles,
    selectedProfile,
    selectedProfileId,
    setSelectedProfileId,
    submitting,
    error,
    organizationId,
    setOrganizationId,
    siteName,
    setSiteName,
    address,
    setAddress,
    timeZone,
    setTimeZone,
    facilityType,
    setFacilityType,
    operationalState,
    setOperationalState,
    objective,
    setObjective,
    knownSystems,
    setKnownSystems,
    ahjName,
    setAhjName,
    isUnknownAhj,
    setIsUnknownAhj,
    handleCreate,
  };
}
