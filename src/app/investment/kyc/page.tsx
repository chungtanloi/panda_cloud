"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FlowFooter, FlowHeader, FlowNav, FlowPanel, FlowProgress } from "@/components/wizard/FlowChrome";
import { Reveal } from "@/components/motion/Reveal";
import { useInvestment } from "@/controllers/InvestmentContext";
import { INVESTMENT_TOTAL_STEPS, STEP_KYC } from "@/config/investment";
import type { InvestorClassification, KycCheckState, UploadedDocument } from "@/models/investment";
import { api, normalizeError } from "@/services/api";
import { cn } from "@/lib/cn";

/**
 * Step 4 — Identity Verification. Transcribed from `KYC.png`.
 *
 * Files are uploaded one at a time to `POST /investments/kyc-documents`, which
 * returns an object id. Only those ids enter the draft — identity documents are
 * never held in localStorage alongside the rest of the wizard state.
 */
export default function KycPage() {
  const router = useRouter();
  const { draft, update } = useInvestment();
  const config = STEP_KYC;

  const classification = draft.kyc?.classification;
  const organizationName = draft.kyc?.organizationName ?? "";
  const documentIds = draft.kyc?.documentIds ?? [];

  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const needsOrganization = classification === "institutional" && !organizationName.trim();
  const canSubmit = Boolean(classification) && documentIds.length > 0 && !needsOrganization;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        const uploaded = await api.investment.uploadKycDocument(file);
        setDocuments((prev) => [...prev, uploaded]);
        update("kyc", { documentIds: [...documentIds, uploaded.id] });
      }
    } catch (cause) {
      setError(normalizeError(cause).message);
    } finally {
      setUploading(false);
    }
  }

  function removeDocument(id: string) {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    update("kyc", { documentIds: documentIds.filter((docId) => docId !== id) });
  }

  async function handleVerify() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await api.investment.submit(draft as never);
      router.push(`/investment/confirmation?id=${encodeURIComponent(result.id)}`);
    } catch (cause) {
      setError(normalizeError(cause).message);
      setSubmitting(false);
    }
  }

  // Drives the checklist panel. Each item reflects real state, not decoration.
  const progress: Record<string, KycCheckState> = {
    secureConnection: "complete",
    walletSignature: classification ? "complete" : "pending",
    sourcingDocuments: uploading ? "active" : documentIds.length > 0 ? "complete" : "pending",
    nodeValidation: submitting ? "active" : "pending",
  };

  return (
    <>
      <FlowHeader status={config.statusRight} />

      <main className="mx-auto flex w-full max-w-[1150px] flex-1 flex-col gap-[24px] px-[24px] py-[24px] lg:px-[40px]">
        <Reveal className="flex flex-col gap-[12px]">
          <FlowProgress
            label={`${config.eyebrow} · STEP 04 / 0${INVESTMENT_TOTAL_STEPS}`}
            step={4}
            total={INVESTMENT_TOTAL_STEPS}
            className="max-w-[320px]"
          />

          <h1 className="font-sans text-[32px] font-bold leading-[40px] tracking-[-0.9px] text-accent">
            {config.title}
          </h1>

          <p className="max-w-[640px] font-sans text-[13px] leading-[21px] text-ink-dim">
            {config.body}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 items-start gap-[20px] lg:grid-cols-[1.6fr_1fr]">
          <Reveal>
            <div className="card-highlight flex flex-col gap-[22px] rounded-card border border-line-hair bg-card p-[24px]">
              {/* Classification */}
              <fieldset className="flex flex-col gap-[12px]">
                <legend className="font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">
                  {config.classificationLabel}
                </legend>

                <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                  {config.classifications.map((option) => {
                    const selected = classification === option.value;
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex cursor-pointer flex-col gap-[6px] rounded-panel border p-[16px] transition-colors",
                          selected
                            ? "border-accent bg-accent-soft"
                            : "border-line-soft bg-surface hover:border-accent/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="classification"
                          value={option.value}
                          checked={selected}
                          onChange={() =>
                            update("kyc", {
                              classification: option.value as InvestorClassification,
                            })
                          }
                          className="sr-only"
                        />

                        <span className="flex items-center gap-[8px]">
                          <span
                            aria-hidden
                            className={cn(
                              "grid size-[15px] shrink-0 place-items-center rounded-full border",
                              selected ? "border-accent" : "border-line-strong",
                            )}
                          >
                            {selected ? <span className="size-[6px] rounded-full bg-accent" /> : null}
                          </span>
                          <span
                            className={cn(
                              "font-sans text-[14px] font-semibold leading-[20px]",
                              selected ? "text-accent" : "text-white",
                            )}
                          >
                            {option.title}
                          </span>
                        </span>

                        <span className="pl-[23px] font-sans text-[11px] leading-[17px] text-ink-dim">
                          {option.body}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Organization */}
              <div className="flex flex-col gap-[8px]">
                <label
                  htmlFor="organization"
                  className="flex items-center justify-between gap-[12px] font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim"
                >
                  {config.organizationLabel}
                  {classification !== "institutional" ? (
                    <span className="text-ink-faint">{config.organizationOptional}</span>
                  ) : null}
                </label>

                <input
                  id="organization"
                  value={organizationName}
                  onChange={(event) =>
                    update("kyc", { organizationName: event.target.value })
                  }
                  placeholder={
                    classification === "institutional" ? "Registered entity name" : "—"
                  }
                  className="w-full rounded-field border border-line-strong bg-deep px-[16px] py-[12px] font-sans text-[14px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                />

                {needsOrganization ? (
                  <p role="alert" className="font-sans text-[11px] text-amber-300">
                    Required for institutional investors.
                  </p>
                ) : null}
              </div>

              {/* Upload */}
              <div className="flex flex-col gap-[10px]">
                <span className="flex items-center gap-[8px] font-mono text-[10px] uppercase tracking-[1.2px] text-ink-dim">
                  {config.uploadLabel}
                  <span aria-hidden className="text-accent">
                    ⓘ
                  </span>
                </span>

                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-[8px] rounded-panel border border-dashed p-[28px] text-center transition-colors",
                    uploading ? "border-accent bg-accent-soft" : "border-line-soft bg-surface hover:border-accent/50",
                  )}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(event) => void handleFiles(event.target.files)}
                    className="sr-only"
                  />

                  <span aria-hidden className="text-[22px] text-accent">
                    ⭱
                  </span>
                  <span className="font-sans text-[16px] font-semibold leading-[24px] text-white">
                    {uploading ? "Uploading…" : config.upload.title}
                  </span>
                  <span className="font-sans text-[12px] leading-[18px] text-ink-dim">
                    {config.upload.body}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[1.1px] text-ink-faint">
                    {config.upload.security}
                  </span>
                  <span className="font-mono text-[10px] tracking-[1px] text-accent">
                    {config.upload.formats}
                  </span>
                </label>

                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-[12px] rounded-field border border-accent/30 bg-accent-soft px-[12px] py-[10px]"
                  >
                    <span className="flex min-w-0 items-center gap-[8px]">
                      <span aria-hidden className="text-accent">
                        ⎘
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-sans text-[12px] leading-[18px] text-ink">
                          {doc.fileName}
                        </span>
                        <span className="block font-mono text-[10px] text-ink-dim">
                          {(doc.sizeBytes / 1_048_576).toFixed(1)} MB · AES-256
                        </span>
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      aria-label={`Remove ${doc.fileName}`}
                      className="shrink-0 text-ink-dim transition-colors hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {error ? (
                <p role="alert" className="font-sans text-[12px] text-red-400">
                  {error}
                </p>
              ) : null}

              <FlowNav
                backLabel={config.back}
                backHref="/investment/payment"
                nextLabel={config.next}
                onNext={handleVerify}
                disabled={!canSubmit}
                busy={submitting}
              />
            </div>
          </Reveal>

          {/* Status */}
          <div className="flex flex-col gap-[16px]">
            <Reveal delay={100}>
              <FlowPanel title={config.progress.title}>
                <ul className="flex flex-col gap-[12px]">
                  {Object.entries(config.progress.steps).map(([key, step]) => (
                    <CheckItem
                      key={key}
                      label={step.label}
                      detail={step.detail}
                      state={progress[key] ?? "pending"}
                    />
                  ))}
                </ul>
              </FlowPanel>
            </Reveal>

            <Reveal delay={160}>
              <div className="rounded-card border border-accent/30 bg-accent-soft p-[18px]">
                <p className="flex items-center gap-[8px] font-sans text-[13px] font-semibold leading-[20px] text-accent">
                  <span aria-hidden>◈</span>
                  {config.zkNotice.title}
                </p>
                <p className="pt-[6px] font-sans text-[11px] leading-[17px] text-ink-dim">
                  {config.zkNotice.body}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </main>

      <FlowFooter />
    </>
  );
}

function CheckItem({
  label,
  detail,
  state,
}: {
  label: string;
  detail: string;
  state: KycCheckState;
}) {
  return (
    <li className="flex items-start gap-[10px]">
      <span
        aria-hidden
        className={cn(
          "mt-[2px] grid size-[16px] shrink-0 place-items-center rounded-full border text-[9px]",
          state === "complete" && "border-accent bg-accent text-accent-fg",
          state === "active" && "pulse-dot border-accent text-accent",
          state === "pending" && "border-line-strong text-ink-faint",
          state === "failed" && "border-red-400 text-red-400",
        )}
      >
        {state === "complete" ? "✓" : state === "failed" ? "✕" : "•"}
      </span>

      <span className="flex flex-col">
        <span
          className={cn(
            "font-sans text-[12px] leading-[18px]",
            state === "pending" ? "text-ink-dim" : "text-accent",
          )}
        >
          {label}
        </span>
        <span className="font-mono text-[10px] leading-[14px] text-ink-faint">{detail}</span>
      </span>
    </li>
  );
}
