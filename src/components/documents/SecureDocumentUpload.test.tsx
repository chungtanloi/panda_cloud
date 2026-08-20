import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createUploadSession, uploadToSignedUrl, finalize } = vi.hoisted(() => ({
  createUploadSession: vi.fn(),
  uploadToSignedUrl: vi.fn(),
  finalize: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: { documents: { createUploadSession, uploadToSignedUrl, finalize } },
  normalizeError: (cause: unknown) => ({
    message: cause instanceof Error ? cause.message : "Upload failed.",
  }),
}));

import { SecureDocumentUpload } from "./SecureDocumentUpload";

describe("SecureDocumentUpload", () => {
  beforeEach(() => {
    createUploadSession.mockReset();
    uploadToSignedUrl.mockReset();
    finalize.mockReset();
    vi.stubGlobal("crypto", {
      randomUUID: () => "upload-request-1",
      subtle: { digest: vi.fn().mockResolvedValue(new Uint8Array(32).buffer) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries only finalize after bytes reached private storage", async () => {
    const user = userEvent.setup();
    createUploadSession.mockResolvedValue({
      documentId: "document-1",
      uploadUrl: "https://storage.example/upload",
      expiresAt: "2026-08-18T00:05:00.000Z",
      requiredHeaders: { "x-upload": "signed" },
      replayed: false,
    });
    uploadToSignedUrl.mockResolvedValue(undefined);
    finalize
      .mockRejectedValueOnce(new Error("The storage inspection timed out."))
      .mockResolvedValueOnce({
        documentId: "document-1",
        finalized: true,
        checksumVerified: false,
        malwareScanStatus: "pending",
        encryptionStatus: "pending",
      });

    render(
      <SecureDocumentUpload
        contextType="dd_assessment"
        resourceId="assessment-1"
        retentionClass="audit"
      />,
    );

    const file = new File(["technical evidence"], "rack-layout.pdf", {
      type: "application/pdf",
    });
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(new TextEncoder().encode("technical evidence").buffer),
    });
    fireEvent.change(screen.getByLabelText(/choose a document/i), {
      target: { files: [file] },
    });
    await user.click(screen.getByRole("button", { name: /upload document/i }));

    await screen.findByRole("button", { name: /retry finalize/i });
    expect(createUploadSession).toHaveBeenCalledTimes(1);
    expect(uploadToSignedUrl).toHaveBeenCalledWith(
      "https://storage.example/upload",
      file,
    { "x-upload": "signed" },
      expect.any(Function),
    );
    expect(finalize).toHaveBeenCalledTimes(1);
    expect(createUploadSession.mock.calls[0]![0]).toEqual(expect.objectContaining({
      context: { type: "dd_assessment", resourceId: "assessment-1" },
      idempotencyKey: "upload-request-1",
    }));
    expect(createUploadSession.mock.calls[0]![0]).not.toHaveProperty("bucket");
    expect(createUploadSession.mock.calls[0]![0]).not.toHaveProperty("objectPath");

    await user.click(screen.getByRole("button", { name: /retry finalize/i }));
    await waitFor(() => expect(screen.getByText(/document registered successfully/i)).toBeInTheDocument());

    expect(finalize).toHaveBeenNthCalledWith(1, "document-1");
    expect(finalize).toHaveBeenNthCalledWith(2, "document-1");
    expect(createUploadSession).toHaveBeenCalledTimes(1);
    expect(uploadToSignedUrl).toHaveBeenCalledTimes(1);
  });
});
