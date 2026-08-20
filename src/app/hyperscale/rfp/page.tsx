"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FlowFooter, FlowHeader, FlowProgress } from "@/components/wizard/FlowChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useHyperscale } from "@/controllers/HyperscaleContext";
import { HYPERSCALE_TOTAL_STEPS, STEP_RFP } from "@/config/hyperscale";
import type { UploadedDocument } from "@/models";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";
import { useAuth } from "@/controllers/AuthContext";
import { CustomerContactFields } from "@/components/customer/CustomerContactFields";
import type { SubmissionContact } from "@/models/submission";

/**
 * Step 4 — RFP & Consultation. Transcribed from `hyper4.png`.
 *
 * ⚠ The design's "See Results" button had no destination — no Results screen
 * exists. Confirmed it should reuse the shared Request Received confirmation,
 * so submitting routes to /requests/[reference].
 *
 * The terminal log only runs once a document is actually uploaded. A processing
 * animation with nothing behind it would be theatre.
 */
export default function RfpPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { draft, update } = useHyperscale();
const config = STEP_RFP;

const CONTACT_STORAGE_KEY = "cp.hyperscale.contact";

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<SubmissionContact>({ fullName: "", email: "", companyName: "", phone: "" });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CONTACT_STORAGE_KEY);
      if (saved) setContact((current) => ({ ...current, ...(JSON.parse(saved) as Partial<SubmissionContact>) }));
    } catch {
      // Ignore corrupt optional contact draft; the form remains editable.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
  }, [contact]);

  useEffect(() => {
    if (!draft.projectStage?.stage || !draft.capacity?.targetCapacityMw || !draft.capacity?.cooling || !draft.geography?.region || !draft.geography?.targetGoLive) {
      router.replace("/hyperscale/stage");
    }
  }, [draft, router]);

  const documentIds = draft.rfp?.documentIds ?? [];
  const requestConsultation = draft.rfp?.requestConsultation ?? false;
  const canSubmit = (documentIds.length > 0 || pendingFiles.length > 0 || requestConsultation) && Boolean(contact.fullName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()));

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent("/hyperscale/rfp")}`);
      return;
    }
    setError(null);
    const selected = Array.from(files);
    setPendingFiles((prev) => [...prev, ...selected]);
    setDocuments((prev) => [...prev, ...selected.map((file, index) => ({
      id: `pending-${Date.now()}-${index}`,
      fileName: file.name,
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      mimeType: file.type || "application/octet-stream",
    }))]);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    if (pendingFiles.length > 0 && !isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent("/hyperscale/rfp")}`);
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.submissions.create({
        source: "website",
        persona: "hyperscaler",
        vertical: "hyperscale",
        summary: "Hyperscale data center planning request",
        contact,
        idempotencyKey: `hyperscale-${draft.projectStage?.stage ?? "unknown"}-${draft.capacity?.targetCapacityMw ?? 0}-${draft.geography?.region ?? "unknown"}`,
        authenticated: pendingFiles.length > 0,
        sourcePayload: {
          projectStage: draft.projectStage?.stage ?? null,
          targetCapacityMw: draft.capacity?.targetCapacityMw ?? null,
          cooling: draft.capacity?.cooling ?? null,
          region: draft.geography?.region ?? null,
          targetGoLive: draft.geography?.targetGoLive ?? null,
          requestConsultation,
        },
      });
      const uploadedIds = [...documentIds];
      let pendingScan = false;
      for (const file of pendingFiles) {
        setUploading(true);
        const checksum = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())))
          .map((value) => value.toString(16).padStart(2, "0")).join("");
        const session = await api.documents.createUploadSession({
          context: { type: "submission", resourceId: result.leadId },
          originalFilename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          sha256Checksum: checksum,
          retentionClass: "standard",
          idempotencyKey: `rfp-${result.leadId}-${file.name}-${file.size}`,
        });
        await api.documents.uploadToSignedUrl(session.uploadUrl, file, session.requiredHeaders);
        const finalized = await api.documents.finalize(session.documentId);
        if (finalized.malwareScanStatus === "clean") uploadedIds.push(finalized.documentId);
        else pendingScan = true;
      }
      if (uploadedIds.length > documentIds.length) await api.submissions.attachDocuments(result.leadId, uploadedIds);
      window.localStorage.removeItem(CONTACT_STORAGE_KEY);
      router.push(`/requests/${encodeURIComponent(result.leadId)}${pendingScan ? "?documentScan=pending" : ""}`);
    } catch (cause) {
      const normalized = normalizeError(cause);
      // The public form may have a stale/partial Clerk session while the
      // document gateway still requires a verified session. Route the user to
      // the existing login flow instead of leaving the RFP wizard on a raw
      // upload-session error page.
      if (pendingFiles.length > 0 && [401, 403].includes(normalized.status ?? 0)) {
        router.replace(`/login?returnTo=${encodeURIComponent("/hyperscale/rfp")}`);
        return;
      }
      setError(normalized.message);
      setSubmitting(false);
    } finally {
      setUploading(false);
    }
  }

  const processing = uploading || documents.length > 0;

  return (
    <>
      <FlowHeader exitHref="/" exitLabel="Save & Exit" />

      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-[24px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[12px]">
          <FlowProgress
            label={config.statusLine}
            step={4}
            total={HYPERSCALE_TOTAL_STEPS}
            className="max-w-[200px]"
          />

          <h1 className="font-sans text-[32px] font-bold leading-[40px] tracking-[-0.9px] text-white">
            {config.title}
          </h1>

          <p className="max-w-[640px] font-sans text-[13px] leading-[21px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[20px] lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col gap-[16px]">
            {/* Upload */}
            <Reveal>
              <div className="card-highlight flex flex-col gap-[14px] rounded-card border border-line-hair bg-card p-[22px]">
                <h2 className="flex items-center gap-[8px] font-sans text-[17px] font-semibold leading-[25px] text-white">
                  <span aria-hidden className="text-accent">
                    ▤
                  </span>
                  {config.upload.title}
                </h2>

                <p className="font-sans text-[11px] leading-[18px] text-ink-dim">
                  {config.upload.body}
                </p>

                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-[8px] rounded-panel border border-dashed p-[28px] text-center transition-colors",
                    uploading ? "border-accent bg-accent-soft" : "border-line-soft bg-surface hover:border-accent/50",
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.zip"
                    onChange={(event) => void handleFiles(event.target.files)}
                    className="sr-only"
                  />

                  <span aria-hidden className="text-[20px] text-accent">
                    ⭱
                  </span>
                  <span className="font-sans text-[13px] leading-[20px] text-ink">
                    {uploading ? "Uploading…" : config.upload.dropTitle}
                  </span>
                  <span className="font-sans text-[11px] leading-[16px] text-ink-faint">
                    {config.upload.dropHint}
                  </span>
                  <span className="mt-[6px] rounded-full border border-accent/40 px-[16px] py-[7px] font-sans text-[11px] leading-[16px] text-accent">
                    {config.upload.button}
                  </span>
                </label>

                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-[12px] rounded-field border border-accent/30 bg-accent-soft px-[12px] py-[9px]"
                  >
                    <span className="min-w-0 truncate font-sans text-[11px] leading-[17px] text-ink">
                      ⎘ {doc.fileName}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-ink-dim">
                      {(doc.sizeBytes / 1_048_576).toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>

            <CustomerContactFields value={contact} onChange={setContact} />

            {/* Consultation */}
            <Reveal delay={80}>
              <div className="card-highlight flex flex-col gap-[14px] rounded-card border border-line-hair bg-card p-[22px]">
                <h2 className="flex items-center gap-[8px] font-sans text-[17px] font-semibold leading-[25px] text-white">
                  <span aria-hidden className="text-accent">
                    ▦
                  </span>
                  {config.consultation.title}
                </h2>

                <p className="font-sans text-[11px] leading-[18px] text-ink-dim">
                  {config.consultation.body}
                </p>

                <div className="flex flex-wrap gap-[10px]">
                  <button
                    type="button"
                    aria-pressed={requestConsultation}
                    onClick={() => update("rfp", { requestConsultation: true })}
                    className="inline-flex items-center gap-[7px] rounded-full border border-line-strong px-[18px] py-[10px] font-sans text-[12px] leading-[18px] text-ink transition-colors hover:border-accent hover:text-accent"
                  >
                    <span aria-hidden>◷</span>
                    {config.consultation.availabilityCta}
                  </button>

                  <button
                    type="button"
                    aria-pressed={requestConsultation}
                    onClick={() =>
                      update("rfp", { requestConsultation: !requestConsultation })
                    }
                    className={cn(
                      "inline-flex flex-1 items-center justify-center gap-[7px] rounded-full px-[18px] py-[10px] font-sans text-[12px] font-semibold leading-[18px] transition-all duration-200",
                      requestConsultation
                        ? "bg-accent text-accent-fg drop-shadow-[0px_0px_16px_rgba(0,242,255,0.4)]"
                        : "border border-accent/40 text-accent hover:bg-accent-soft",
                    )}
                  >
                    {requestConsultation ? "✓ Consultation requested" : config.consultation.scheduleCta}
                  </button>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Terminal */}
          <Reveal delay={140}>
            <div
              data-circuit-attract
              className="card-highlight flex h-full flex-col gap-[14px] rounded-card border border-line-hair bg-card p-[22px]"
            >
              <div className="flex items-center justify-between gap-[12px]">
                <span className="flex items-center gap-[8px] font-sans text-[12px] leading-[18px] text-accent">
                  <span aria-hidden className="pulse-dot size-[6px] rounded-full bg-accent" />
                  {config.terminal.title}
                </span>
                <span className="font-mono text-[9px] tracking-[1px] text-ink-faint">
                  {config.terminal.handle}
                </span>
              </div>

              <div className="min-h-[180px] flex-1 rounded-panel border border-line-soft bg-deep p-[14px]">
                {processing ? (
                  <ol className="flex flex-col gap-[6px]">
                    {config.terminal.entries.map((entry) => (
                      <li key={entry.message} className="font-mono text-[10px] leading-[16px]">
                        <span className="text-ink-faint">[{entry.time}] </span>
                        <span className="text-ink-dim">{entry.message}</span>
                        {entry.outcome === "pass" ? (
                          <span className="text-accent"> PASS</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="flex h-full items-center justify-center text-center font-mono text-[10px] leading-[16px] text-ink-faint">
                    Awaiting document upload…
                  </p>
                )}
              </div>

              {error ? (
                <p role="alert" className="font-sans text-[11px] text-red-400">
                  {error}
                </p>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className={cn(
                  "inline-flex w-full items-center justify-between gap-[8px] rounded-full bg-accent px-[20px] py-[12px]",
                  "font-sans text-[12px] font-bold leading-[18px] text-accent-fg transition-all duration-200",
                  "hover:-translate-y-[2px] hover:drop-shadow-[0px_0px_20px_rgba(0,242,255,0.45)]",
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                {submitting ? "Submitting…" : config.resultsCta}
                <span aria-hidden>→</span>
              </button>
            </div>
          </Reveal>
        </div>

        <nav className="mt-[4px] flex items-center">
          <Link
            href="/hyperscale/geography"
            className="inline-flex items-center gap-[8px] rounded-full border border-line-strong px-[22px] py-[11px] font-sans text-[12px] font-medium uppercase leading-[12px] tracking-[1.2px] text-ink-dim transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>←</span>
            Back to geography
          </Link>
        </nav>
      </main>

      <FlowFooter />
    </>
  );
}
