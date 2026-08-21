"use client";

import { useRef, useState } from "react";
import { Hash } from "fast-sha256";
import type {
  DocumentFinalizeResponse,
  DocumentRetentionClass,
  DocumentUploadContextType,
} from "@/models/documents";
import { api, normalizeError } from "@/services/api";

type UploadPhase =
  | "idle"
  | "hashing"
  | "authorizing"
  | "uploading"
  | "finalizing"
  | "finalize_failed"
  | "complete";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

async function sha256(file: File): Promise<string> {
  const hasher = new Hash();
  // Browser File objects expose a stream; the arrayBuffer fallback only keeps
  // older test/runtime shims working and is not used by supported browsers.
  const stream = typeof file.stream === "function" ? file.stream() : null;
  if (!stream) {
    hasher.update(new Uint8Array(await file.arrayBuffer()));
    return Array.from(hasher.digest())
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  }
  const reader = stream.getReader();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      hasher.update(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Array.from(hasher.digest())
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Authorizes metadata through PandaCloud, uploads bytes directly to the
 * server-issued private-storage URL, then finalizes only the server-owned
 * document. A failed finalize retains the document id so retry never creates
 * another object or re-uploads bytes.
 */
export function SecureDocumentUpload({
  contextType,
  resourceId,
  retentionClass,
  onFinalized,
}: {
  contextType: DocumentUploadContextType;
  resourceId: string;
  retentionClass: DocumentRetentionClass;
  onFinalized?: (result: DocumentFinalizeResponse) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [result, setResult] = useState<DocumentFinalizeResponse | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const idempotencyKey = useRef<string | null>(null);

  async function finalize(documentId: string) {
    setPhase("finalizing");
    try {
      const finalized = await api.documents.finalize(documentId);
      setResult(finalized);
      setError(null);
      setPhase("complete");
      onFinalized?.(finalized);
    } catch (cause) {
      setError(normalizeError(cause).message);
      setPhase("finalize_failed");
    }
  }

  async function upload() {
    if (!file) return;
    if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) {
      setError("File must be between 1 byte and 25 MB.");
      return;
    }
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
      setError("This file type is not supported. Use PDF, DOCX, XLSX, PNG or JPG.");
      return;
    }
    setError(null);
    setResult(null);
    try {
      setPhase("hashing");
      const checksum = await sha256(file);
      setPhase("authorizing");
      idempotencyKey.current ??= crypto.randomUUID();
      const session = await api.documents.createUploadSession({
        context: { type: contextType, resourceId },
        originalFilename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        sha256Checksum: checksum,
        retentionClass,
        idempotencyKey: idempotencyKey.current,
      });
      setUploadedDocumentId(session.documentId);
      setPhase("uploading");
      setProgress(0);
      await api.documents.uploadToSignedUrl(session.uploadUrl, file, session.requiredHeaders, setProgress);
      await finalize(session.documentId);
    } catch (cause) {
      setError(normalizeError(cause).message);
      setPhase("idle");
    }
  }

  const phaseLabel: Record<UploadPhase, string> = {
    idle: "Upload document",
    hashing: "Checking file…",
    authorizing: "Creating secure session…",
    uploading: "Uploading securely…",
    finalizing: "Finalizing…",
    finalize_failed: "Retry finalize",
    complete: "Upload complete",
  };

  const isBusy = !["idle", "complete", "finalize_failed"].includes(phase);

  return (
    <section className="rounded-[24px] border border-line bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Secure document upload</h2>
          <p className="mt-1 text-xs leading-5 text-ink-dim">
            The browser uploads directly to private storage using a short-lived signed URL.
            Storage paths and credentials remain server-owned.
          </p>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-[10px] uppercase tracking-wider text-ink-dim">
          {retentionClass}
        </span>
      </div>

      <label className="mt-5 block rounded-2xl border border-dashed border-accent/35 bg-accent/[0.04] p-5 text-center">
        <input
          type="file"
          className="sr-only"
          disabled={isBusy}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setResult(null);
            setUploadedDocumentId(null);
            setError(null);
            setProgress(0);
            setPhase("idle");
            idempotencyKey.current = null;
          }}
        />
        <span className="text-sm font-medium text-ink">{file ? file.name : "Choose a document"}</span>
        <span className="mt-1 block text-xs text-ink-dim">
          {file
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ${file.type || "Unknown MIME"}`
            : "The checksum is calculated locally before authorization."}
        </span>
      </label>

      <button
        type="button"
        disabled={isBusy || (!file && phase !== "finalize_failed")}
        onClick={() =>
          void (phase === "finalize_failed" && uploadedDocumentId
            ? finalize(uploadedDocumentId)
            : upload())
        }
        className="mt-4 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-fg disabled:opacity-40"
      >
        {phaseLabel[phase]}
      </button>

      {error ? <p role="alert" className="mt-3 text-xs text-red-300">{error}</p> : null}
      {phase === "uploading" ? <div className="mt-4" aria-live="polite"><div className="h-2 overflow-hidden rounded-full bg-black/30"><div className="h-full bg-accent transition-[width]" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-xs text-ink-dim">Uploading {progress}%</p></div> : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-line bg-white/[0.02] p-4 text-xs text-ink-dim">
          <p className="font-medium text-ink">Document registered successfully</p>
          <p className="mt-2">
            Malware scan: {result.malwareScanStatus} · Encryption: {result.encryptionStatus}
          </p>
          <p className="mt-1">
            Attachment remains unavailable until the backend reports a clean malware scan.
          </p>
        </div>
      ) : null}
    </section>
  );
}
