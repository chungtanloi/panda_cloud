"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlowFooter, FlowHeader, FlowProgress } from "@/components/wizard/FlowChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useHyperscale } from "@/controllers/HyperscaleContext";
import { HYPERSCALE_TOTAL_STEPS, STEP_RFP } from "@/config/hyperscale";
import type { HyperscaleSubmission, UploadedDocument } from "@/models";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";

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
  const { draft, update } = useHyperscale();
  const config = STEP_RFP;

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const documentIds = draft.rfp?.documentIds ?? [];
  const requestConsultation = draft.rfp?.requestConsultation ?? false;
  const canSubmit = documentIds.length > 0 || requestConsultation;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const uploaded = await api.hyperscale.uploadRfpDocument(file);
        setDocuments((prev) => [...prev, uploaded]);
        update("rfp", { documentIds: [...documentIds, uploaded.id] });
      }
    } catch (cause) {
      setError(normalizeError(cause).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.hyperscale.submit(draft as HyperscaleSubmission);
      router.push(`/requests/${encodeURIComponent(result.reference)}`);
    } catch (cause) {
      setError(normalizeError(cause).message);
      setSubmitting(false);
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
      </main>

      <FlowFooter />
    </>
  );
}
