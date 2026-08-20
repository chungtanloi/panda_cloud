"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAsync } from "@/controllers/useAsync";
import { api } from "@/services/api";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import type { AdminOrganizationCreateRequest, OrgType } from "@/models/admin";

const ORG_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "cloud_panda", label: "Cloud Panda" },
  { value: "customer", label: "Customer" },
  { value: "partner", label: "Partner" },
  { value: "vendor", label: "Vendor" },
  { value: "investor", label: "Investor" },
  { value: "other", label: "Other" },
];

export default function NewOrganizationPage() {
  const router = useRouter();
  const [legalName, setLegalName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const createAsync = useAsync(
    useCallback(
      () =>
        api.admin.createOrganization({
          legalName,
          displayName,
          organizationType,
          ...(registrationNumber && { registrationNumber }),
          ...(countryCode && { countryCode }),
          ...(websiteUrl && { websiteUrl }),
        }).then((result) => {
          router.push("/admin/organizations");
          return result;
        }),
      [legalName, displayName, organizationType, registrationNumber, countryCode, websiteUrl, router],
    ),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void createAsync.run();
  }

  return (
    <WorkspacePage eyebrow="Admin / Organizations" title="Create Organization" description="Create a new organization.">
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4 rounded-2xl border border-line bg-surface p-6">
        <Input label="Legal Name" value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
        <Input label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        <Select label="Organization Type" options={ORG_TYPE_OPTIONS} value={organizationType} onChange={(e) => setOrganizationType(e.target.value)} />
        <Input label="Registration Number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
        <Input label="Country Code" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} />
        <Input label="Website URL" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
        {createAsync.error && <p className="text-xs text-red-400">{createAsync.error.message}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={createAsync.isLoading} disabled={!legalName || !displayName || !organizationType}>Create</Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/organizations")}>Cancel</Button>
        </div>
      </form>
    </WorkspacePage>
  );
}
