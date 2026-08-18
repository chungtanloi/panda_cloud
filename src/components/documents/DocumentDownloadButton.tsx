"use client";

import { useState } from "react";
import { api, normalizeError } from "@/services/api";

/**
 * Requests an authorized, short-lived download URL only when the user asks.
 * Document links never expose storage paths or durable signed URLs.
 */
export function DocumentDownloadButton({ documentId }: { documentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function download() {
    setError(null);
    setLoading(true);
    try {
      const session = await api.documents.createDownloadSession(documentId);
      window.location.assign(session.downloadUrl);
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(
        normalized.correlationId
          ? `${normalized.message} (correlation ${normalized.correlationId})`
          : normalized.message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void download()}
        className="rounded-full border border-line px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-dim hover:border-accent/40 disabled:opacity-50"
      >
        {loading ? "Preparing…" : "Download"}
      </button>
      {error ? <span role="alert" className="max-w-48 text-right text-[10px] text-red-300">{error}</span> : null}
    </span>
  );
}
