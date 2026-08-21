"use client";

import React from "react";
import Link from "next/link";
import { useProfileAdmin } from "@/controllers/useProfileAdmin";
import { SimulationDisclosure } from "@/components/inspection/SimulationDisclosure";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { Card } from "@/components/ui/Card";

export default function InspectionProfilesAdminPage() {
  const { loading, error, profiles, selectedProfile, setSelectedProfile } = useProfileAdmin();

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col">
      <SimulationDisclosure />

      <WorkspacePage
        eyebrow="TECHNICAL WORKSPACE / STANDARDS GOVERNANCE"
        title="Inspection Standards Profiles"
        description="Governed evaluation criteria, technical requirements mappings, and version management for data center site inspection."
        stats={[
          { label: "Active Profiles", value: String(profiles.length), detail: "US Market Edition" },
          { label: "Governed Criteria", value: "10 Criteria", detail: "Golden test verified" },
          { label: "Version Control", value: "Immutable", detail: "Strict revision locking" },
          { label: "Validation Suite", value: "100+ Tests", detail: "20 baseline sites" },
        ]}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/technical/inspections"
            className="text-xs font-sans text-ink-dim hover:text-ink transition flex items-center gap-1.5"
          >
            &larr; Return to Review Queue
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-field bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-sans">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile List */}
          <Card className="p-4 flex flex-col gap-3">
            <h2 className="text-xs font-mono font-semibold uppercase text-ink-dim tracking-wider mb-1">
              Active Profiles
            </h2>

            {loading ? (
              <div className="p-4 text-xs text-ink-dim font-mono animate-pulse">Loading profiles...</div>
            ) : (
              profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-4 rounded-field border cursor-pointer transition ${
                    selectedProfile?.id === profile.id
                      ? "border-accent bg-accent/5"
                      : "border-line bg-deep/80 hover:border-line-strong"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-accent font-semibold">{profile.code}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 uppercase">
                      {profile.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-ink mb-1 font-sans">{profile.name}</h3>
                  <p className="text-xs text-ink-dim leading-relaxed font-sans">{profile.description}</p>
                </div>
              ))
            )}
          </Card>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-6">
              {selectedProfile ? (
                <>
                  <div className="flex items-start justify-between pb-4 border-b border-line">
                    <div>
                      <span className="text-xs font-mono text-accent font-semibold uppercase tracking-wider block mb-1">
                        Market: {selectedProfile.market} &bull; Active Version: {selectedProfile.activeVersionId}
                      </span>
                      <h2 className="text-xl font-bold text-ink font-sans">{selectedProfile.name}</h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-mono font-semibold uppercase text-ink-dim tracking-wider">
                      Published Profile Governance &amp; Versioning
                    </h3>
                    <div className="p-4 rounded-field bg-deep border border-line text-xs font-sans text-ink-dim space-y-2">
                      <p>
                        Published profile versions are immutable per Panda Cloud compliance policy. Any modifications to criteria rules, evidence prompts, or criticality weighting require creating a successor revision (`V2`) and passing the golden evaluation test suite.
                      </p>
                      <div className="font-mono text-[11px] text-accent pt-1">
                        &bull; Golden evaluation set: 20 baseline historical sites, 100+ criterion tests.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-ink-dim font-sans">
                  Select a profile to view details.
                </div>
              )}
            </Card>
          </div>
        </div>
      </WorkspacePage>
    </div>
  );
}
