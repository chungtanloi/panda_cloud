"use client";

import { useRef, useState } from "react";
import { WorkspacePage } from "@/components/workspace/WorkspacePage";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { StatusBadge } from "@/components/shared/StatusBadge";

/**
 * Technical / Assessment evidence — ROLE_PERMISSION_MATRIX § 5.3 "Attach
 * Evidence": signed upload, malware-scan gate.
 *
 * ⚠ No signed-upload endpoint (e.g. `POST /technical/assessments/{id}/evidence
 * /upload-url`) or malware-scan-status endpoint exists in the backend
 * contract. The KYC/RFP uploads elsewhere in this repo (`services/contracts.ts`)
 * are a direct multipart POST, not a signed-URL flow, so they are not a
 * pattern to copy here either. Everything below is a client-only simulation
 * of the *shape* described in § 5.3 (request a signed URL → PUT the file to
 * it → poll scan status), clearly labelled as a placeholder, so it is obvious
 * what to replace once the real endpoints are defined:
 *   1. request a signed upload URL for the file
 *   2. PUT the file directly to that URL
 *   3. poll / receive the malware-scan status before evidence is usable
 */

type ScanStatus = "pending" | "scanning" | "clean" | "infected";

interface EvidenceItem {
  id: string;
  fileName: string;
  sizeLabel: string;
  scanStatus: ScanStatus;
}

const SAMPLE_EVIDENCE: EvidenceItem[] = [
  { id: "ev-2201", fileName: "power-redundancy-cert.pdf", sizeLabel: "1.2 MB", scanStatus: "clean" },
  { id: "ev-2198", fileName: "fiber-path-diagram.png", sizeLabel: "3.4 MB", scanStatus: "scanning" },
];

function scanStatusLabel(status: ScanStatus): string {
  switch (status) {
    case "pending": return "Pending Scan";
    case "scanning": return "Scanning";
    case "clean": return "Clean";
    case "infected": return "Infected";
  }
}

export default function Page({ params }: { params: { id: string } }) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>(SAMPLE_EVIDENCE);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function simulateSignedUpload(file: File) {
    setUploading(true);

    // TODO: NEEDS CLARIFICATION — replace with the real signed-upload flow
    // once it exists:
    //   const { uploadUrl, evidenceId } = await api.technical.requestEvidenceUploadUrl(params.id, file);
    //   await fetch(uploadUrl, { method: "PUT", body: file });
    // The steps and delays below only simulate the UI states so the screen
    // is not built against a guessed response shape.
    const provisionalId = `ev-pending-${Date.now()}`;
    setEvidence((current) => [
      { id: provisionalId, fileName: file.name, sizeLabel: `${(file.size / (1024 * 1024)).toFixed(1)} MB`, scanStatus: "pending" },
      ...current,
    ]);

    window.setTimeout(() => {
      setEvidence((current) => current.map((item) => (item.id === provisionalId ? { ...item, scanStatus: "scanning" } : item)));
    }, 600);
    window.setTimeout(() => {
      setEvidence((current) => current.map((item) => (item.id === provisionalId ? { ...item, scanStatus: "clean" } : item)));
      setUploading(false);
    }, 1800);
  }

  return (
    <WorkspacePage
      eyebrow="Technical / DD"
      title={`Evidence — Assessment ${params.id}`}
      description="Attach supporting evidence for this assessment. Every file is scanned for malware before it can be used."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
          Sample data
        </span>
        <span className="text-xs text-ink-dim">
          Simulated signed-upload flow — no backend evidence endpoint exists yet.
        </span>
      </div>

      <PermissionGate permission="dd:evidence:upload">
        <div className="mb-6 rounded-[24px] border border-dashed border-line bg-surface p-6">
          <h2 className="text-sm font-semibold">Upload Evidence</h2>
          <p className="mt-2 text-xs leading-5 text-ink-dim">
            Files are uploaded directly to signed storage and cannot be attached to the assessment
            until the malware scan reports clean.
          </p>
          <input
            ref={inputRef}
            type="file"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) simulateSignedUpload(file);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="mt-4 block text-xs text-ink-dim file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2.5 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-accent-fg disabled:opacity-50"
          />
          {uploading ? <p className="mt-3 text-xs text-accent">Uploading…</p> : null}
        </div>
      </PermissionGate>

      <div className="space-y-3">
        {evidence.map((item) => (
          <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-5">
            <div>
              <p className="text-sm font-medium text-ink">{item.fileName}</p>
              <p className="mt-1 text-xs text-ink-dim">{item.sizeLabel}</p>
            </div>
            <StatusBadge status={scanStatusLabel(item.scanStatus)} />
          </article>
        ))}
      </div>
    </WorkspacePage>
  );
}
