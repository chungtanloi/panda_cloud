"use client";

import React from "react";
import Link from "next/link";
import { useInspectionSetup } from "@/controllers/useInspectionSetup";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";
import { Card, CardHeading } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AnimatedBackdrop } from "@/components/motion/AnimatedBackdrop";
import { Reveal } from "@/components/motion/Reveal";
import type { FacilityType } from "@/models";

export default function NewInspectionPage() {
  const {
    loadingProfiles,
    profiles,
    selectedProfile,
    selectedProfileId,
    setSelectedProfileId,
    submitting,
    error,
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
  } = useInspectionSetup();

  return (
    <div className="relative min-h-screen bg-base text-ink flex flex-col">
      <AnimatedBackdrop stars />
      <SimulationDisclosure />

      <main className="relative z-10 flex-1 max-w-[1000px] w-full mx-auto px-[24px] lg:px-[40px] py-[40px] lg:py-[64px]">
        {/* Breadcrumb Header */}
        <Reveal className="mb-[32px]">
          <div className="flex items-center gap-[8px] text-[12px] text-ink-dim mb-[12px] font-sans">
            <Link href="/site-inspections" className="text-accent hover:underline">
              Site Inspections
            </Link>
            <span>/</span>
            <span className="text-ink">New Inspection</span>
          </div>

          <span className="inline-flex items-center gap-[8px] rounded-full border border-accent/30 bg-accent-soft px-[13px] py-[5px] font-mono text-[10px] uppercase leading-[12px] tracking-[1.2px] text-accent mb-[12px]">
            <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
            STEP 1 OF 3 &bull; SITE CONFIGURATION
          </span>

          <h1 className="font-sans text-[32px] font-bold leading-[1.2] tracking-[-1px] text-white lg:text-[40px]">
            Configure Site Inspection
          </h1>
          <p className="mt-[8px] max-w-[640px] font-sans text-[15px] leading-[24px] text-ink-dim">
            Select an evaluation standards profile and provide US facility parameters to initialize your custom checklist.
          </p>
        </Reveal>

        {error && (
          <div className="mb-[24px] p-[16px] rounded-field bg-rose-950/60 border border-rose-500/40 text-rose-200 text-[13px] font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-[32px]">
          {/* Section 1: Standards Profile */}
          <Reveal delay={60}>
            <Card className="flex flex-col gap-[20px]">
              <CardHeading
                title="1. Inspection Standards Profile"
                description="Select the evaluation ruleset applicable to your facility type and region."
              />

              {loadingProfiles ? (
                <div className="p-[24px] text-center font-mono text-[12px] text-ink-dim animate-pulse">
                  Loading standards profiles...
                </div>
              ) : (
                <div className="space-y-[16px]">
                  <Select
                    label="Evaluation Profile *"
                    value={selectedProfileId}
                    options={profiles.map((p) => ({
                      value: p.id,
                      label: `${p.name} (${p.market} Edition)`,
                    }))}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                  />

                  {selectedProfile && (
                    <div className="p-[16px] rounded-field bg-deep border border-line space-y-[8px]">
                      <div className="flex items-center justify-between text-[11px] font-mono text-accent">
                        <span>CRITERIA COUNT: {selectedProfile.criteria.length} VERIFIED CHECKS</span>
                        <span>VERSION: V{selectedProfile.version}</span>
                      </div>
                      <p className="font-sans text-[13px] leading-[20px] text-ink-dim">
                        {selectedProfile.name} &bull; Market: {selectedProfile.market}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </Reveal>

          {/* Section 2: Facility & Location */}
          <Reveal delay={120}>
            <Card className="flex flex-col gap-[20px]">
              <CardHeading
                title="2. Site & Location Details"
                description="Exact physical location of the data center or substation."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
                <div className="md:col-span-2">
                  <Input
                    label="Site / Facility Name *"
                    placeholder="e.g. Austin Hyperscale Campus - Building B"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Street Address *"
                    placeholder="e.g. 7400 Technology Blvd"
                    value={address.streetAddress}
                    onChange={(e) => setAddress({ ...address, streetAddress: e.target.value })}
                  />
                </div>

                <Input
                  label="City *"
                  placeholder="Austin"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-[12px]">
                  <Input
                    label="State (US) *"
                    placeholder="TX"
                    maxLength={2}
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                  />
                  <Input
                    label="ZIP Code *"
                    placeholder="78744"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  />
                </div>

                <Select
                  label="Time Zone *"
                  value={timeZone}
                  options={[
                    { value: "America/Chicago", label: "Central Time (US / Chicago)" },
                    { value: "America/New_York", label: "Eastern Time (US / New York)" },
                    { value: "America/Denver", label: "Mountain Time (US / Denver)" },
                    { value: "America/Los_Angeles", label: "Pacific Time (US / Los Angeles)" },
                  ]}
                  onChange={(e) => setTimeZone(e.target.value)}
                />

                <Select
                  label="Facility Type *"
                  value={facilityType}
                  options={[
                    { value: "enterprise_dc", label: "Enterprise Data Center" },
                    { value: "colocation_dc", label: "Colocation Facility" },
                    { value: "hyperscale_dc", label: "Hyperscale Campus" },
                    { value: "edge_dc", label: "Edge Compute Enclosure" },
                    { value: "substation_industrial", label: "Industrial Substation" },
                  ]}
                  onChange={(e) => setFacilityType(e.target.value as FacilityType)}
                />
              </div>
            </Card>
          </Reveal>

          {/* Section 3: Existing Infrastructure Systems */}
          <Reveal delay={180}>
            <Card className="flex flex-col gap-[20px]">
              <CardHeading
                title="3. Known On-Site Systems"
                description="Toggle the infrastructure assets present to dynamically adapt checklist requirements."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                {[
                  { key: "utilityFeeder", label: "Utility Service Entrance & Switchgear", desc: "Medium/low-voltage transformers & distribution boards." },
                  { key: "mainTransformerSwitchgear", label: "Step-Down Transformers", desc: "Dry-type or pad-mounted utility transformers." },
                  { key: "upsSystem", label: "Uninterruptible Power Supply (UPS)", desc: "Double-conversion static UPS systems." },
                  { key: "batteryEnergyStorage", label: "Battery Storage Room (BESS / VRLA)", desc: "Dedicated battery containment and monitoring." },
                  { key: "backupGenerators", label: "Standby Diesel / Gas Generators", desc: "Emergency gensets with automatic transfer switch (ATS)." },
                  { key: "hvacCooling", label: "CRAC / CRAH Chilled Water Cooling", desc: "Data hall precision air conditioning & containment." },
                  { key: "fireSuppression", label: "Clean Agent Fire Suppression", desc: "FM-200 / Novec / Inergen gaseous fire protection." },
                  { key: "physicalSecurityAccess", label: "Access Control & Security", desc: "Biometric / card reader vestibule security." },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start gap-[12px] p-[16px] rounded-field border cursor-pointer transition-all ${
                      knownSystems[item.key as keyof typeof knownSystems]
                        ? "border-accent bg-accent/5"
                        : "border-line bg-deep hover:border-line-strong"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={knownSystems[item.key as keyof typeof knownSystems]}
                      onChange={(e) =>
                        setKnownSystems({
                          ...knownSystems,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="mt-[3px] rounded border-line bg-base text-accent focus:ring-accent"
                    />
                    <div>
                      <span className="font-sans text-[14px] font-semibold text-ink block">
                        {item.label}
                      </span>
                      <span className="font-sans text-[12px] text-ink-dim leading-[18px] block mt-[2px]">
                        {item.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </Reveal>

          {/* Section 4: Jurisdiction (AHJ) */}
          <Reveal delay={240}>
            <Card className="flex flex-col gap-[20px]">
              <CardHeading
                title="4. Authority Having Jurisdiction (AHJ)"
                description="Local municipal fire marshal or building inspection authority."
              />

              <div className="space-y-[16px]">
                <Input
                  label="Local AHJ Name"
                  placeholder="e.g. City of Austin Fire Prevention & Building Dept"
                  value={ahjName}
                  disabled={isUnknownAhj}
                  onChange={(e) => setAhjName(e.target.value)}
                />

                <label className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUnknownAhj}
                    onChange={(e) => setIsUnknownAhj(e.target.checked)}
                    className="rounded border-line bg-deep text-accent focus:ring-accent"
                  />
                  <span className="font-sans text-[13px] text-ink-dim">
                    AHJ is currently unknown (will be flagged for reviewer verification)
                  </span>
                </label>
              </div>
            </Card>
          </Reveal>

          {/* Actions */}
          <Reveal delay={300} className="flex flex-wrap items-center justify-between gap-[16px] pt-[16px]">
            <Link
              href="/site-inspections"
              className="font-sans text-[14px] text-ink-dim hover:text-ink transition"
            >
              &larr; Cancel &amp; Return
            </Link>

            <Button
              type="submit"
              loading={submitting}
              className="rounded-full bg-accent px-[40px] py-[16px] font-sans text-[15px] font-bold text-accent-fg hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]"
            >
              PROCEED TO CAPTURE STUDIO →
            </Button>
          </Reveal>
        </form>
      </main>
    </div>
  );
}
