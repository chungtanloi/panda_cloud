import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCase: vi.fn(),
  getCase: vi.fn(),
  updateCase: vi.fn(),
  listKycDocuments: vi.fn(),
  attachKycDocument: vi.fn(),
  detachKycDocument: vi.fn(),
  getAgreement: vi.fn(),
  listAgreementDocuments: vi.fn(),
  upsertAgreement: vi.fn(),
  attachAgreementDocument: vi.fn(),
  detachAgreementDocument: vi.fn(),
  download: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  api: {
    compliance: {
      createCase: mocks.createCase,
      getCase: mocks.getCase,
      updateCase: mocks.updateCase,
      listDocuments: mocks.listKycDocuments,
      attachDocument: mocks.attachKycDocument,
      detachDocument: mocks.detachKycDocument,
    },
    legal: {
      getAgreement: mocks.getAgreement,
      listDocuments: mocks.listAgreementDocuments,
      upsertAgreement: mocks.upsertAgreement,
      attachDocument: mocks.attachAgreementDocument,
      detachDocument: mocks.detachAgreementDocument,
    },
    documents: { createDownloadSession: mocks.download },
  },
  normalizeError: (cause: unknown) => ({
    message: cause instanceof Error ? cause.message : "Request failed.",
    status: (cause as { status?: number } | undefined)?.status,
    correlationId: (cause as { correlationId?: string } | undefined)?.correlationId,
  }),
}));
vi.mock("@/controllers/AuthContext", () => ({ useAuth: () => ({ profile: { user: { id: "user-1" }, authorization: { memberships: [] } } }) }));
vi.mock("@/config/access", () => ({ hasPermission: () => true }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/documents/SecureDocumentUpload", () => ({
  SecureDocumentUpload: ({ onFinalized }: { onFinalized: (result: { documentId: string; malwareScanStatus: string }) => void }) => (
    <button type="button" onClick={() => onFinalized({ documentId: "document-clean", malwareScanStatus: "clean" })}>Finalize clean upload</button>
  ),
}));

import { CreateCaseForm } from "./compliance/CreateCaseForm";
import { CaseDetail } from "./compliance/CaseDetail";
import { CaseDocuments } from "./compliance/CaseDocuments";
import { AgreementDetail } from "./legal/AgreementDetail";
import { AgreementsPage } from "./legal/AgreementsPage";

const deal = {
  dealId: "deal-1", title: "GPU campus", organizationId: "organization-1", organizationName: "Acme AI",
  ownerId: "owner-1", ownerName: "Owner", status: "qualified", revision: 1,
  primaryContact: { contactId: "contact-1", fullName: "Ada Contact" },
} as never;

const kycCase = {
  caseId: "case-1", dealId: "deal-1", dealTitle: null,
  subject: { kind: "organization" as const, organizationId: "organization-1", displayName: "Acme AI" },
  provider: null, providerCaseId: null, status: "not_started" as const, riskLevel: null,
  assignedToId: null, assignedToName: null, rejectionReason: null, submittedAt: null,
  verifiedAt: null, expiresAt: null, updatedAt: "2026-08-18T00:00:00.000Z", revision: 2,
};

const agreement = {
  agreementId: "agreement-1", dealId: "deal-1", dealTitle: null,
  counterpartyOrganizationId: "organization-1", counterpartyName: null,
  status: "drafting" as const, effectiveDate: null, expiresAt: null, sentAt: null,
  signedAt: null, countersignedAt: null, ownerId: "owner-1", ownerName: null,
  notes: null, updatedAt: "2026-08-18T00:00:00.000Z", revision: 3, versions: [],
};

describe("KYC and NCNDA approved gateway integration", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.createCase.mockResolvedValue({ caseId: "case-1", revision: 1 });
    mocks.getCase.mockResolvedValue(kycCase);
    mocks.updateCase.mockResolvedValue({ caseId: "case-1", revision: 3 });
    mocks.listKycDocuments.mockResolvedValue({ caseId: "case-1", documents: [] });
    mocks.attachKycDocument.mockResolvedValue({ linkId: "link-1", documentId: "document-clean" });
    mocks.getAgreement.mockResolvedValue(agreement);
    mocks.listAgreementDocuments.mockResolvedValue([]);
    mocks.upsertAgreement.mockResolvedValue({ agreementId: "agreement-1", revision: 4, created: false });
    mocks.download.mockResolvedValue({ documentId: "document-clean", downloadUrl: "https://example.invalid/signed", expiresAt: "2026-08-18T00:05:00Z" });
  });

  it("creates organization-subject KYC with exactly the required opaque id", async () => {
    const onDone = vi.fn();
    render(<CreateCaseForm dealId="deal-1" context={deal} onDone={onDone} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /create kyc case/i }));
    await waitFor(() => expect(mocks.createCase).toHaveBeenCalledWith("deal-1", { subjectOrganizationId: "organization-1" }));
    expect(mocks.createCase.mock.calls[0]![1]).not.toHaveProperty("subjectContactId");
    expect(mocks.createCase.mock.calls[0]![1]).not.toHaveProperty("role");
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("creates contact-subject KYC without a second subject or authorization fields", async () => {
    render(<CreateCaseForm dealId="deal-1" context={deal} onDone={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /primary contact/i }));
    await userEvent.setup().click(screen.getByRole("button", { name: /create kyc case/i }));
    await waitFor(() => expect(mocks.createCase).toHaveBeenCalledWith("deal-1", { subjectContactId: "contact-1" }));
    expect(mocks.createCase.mock.calls[0]![1]).not.toHaveProperty("subjectOrganizationId");
    expect(mocks.createCase.mock.calls[0]![1]).not.toHaveProperty("organizationId");
  });

  it("reloads KYC after a revision conflict instead of retrying a stale update", async () => {
    mocks.updateCase.mockRejectedValueOnce(Object.assign(new Error("Changed on server"), { status: 409, correlationId: "corr-409" }));
    render(<CaseDetail caseId="case-1" />);
    await screen.findByRole("button", { name: /save review/i });
    await userEvent.setup().click(screen.getByRole("button", { name: /save review/i }));
    await waitFor(() => expect(mocks.updateCase).toHaveBeenCalledWith("case-1", expect.objectContaining({ expectedRevision: 2, status: "not_started" })));
    await waitFor(() => expect(mocks.getCase).toHaveBeenCalledTimes(2));
    expect(mocks.updateCase).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent(/correlation corr-409/i);
  });

  it("uses the shared secure upload then attaches a clean KYC document without storage fields", async () => {
    render(<CaseDocuments caseId="case-1" dealId="deal-1" />);
    await screen.findByRole("button", { name: /finalize clean upload/i });
    await userEvent.setup().click(screen.getByRole("button", { name: /finalize clean upload/i }));
    await waitFor(() => expect(mocks.attachKycDocument).toHaveBeenCalledWith("case-1", { documentId: "document-clean", documentRole: "supporting" }));
    expect(mocks.attachKycDocument.mock.calls[0]![1]).not.toHaveProperty("bucket");
    expect(mocks.attachKycDocument.mock.calls[0]![1]).not.toHaveProperty("objectPath");
  });

  it("surfaces a closed KYC attachment failure from the backend", async () => {
    mocks.attachKycDocument.mockRejectedValueOnce(Object.assign(new Error("KYC case is closed."), { status: 409, correlationId: "closed-1" }));
    render(<CaseDocuments caseId="case-1" dealId="deal-1" />);
    await screen.findByRole("button", { name: /finalize clean upload/i });
    await userEvent.setup().click(screen.getByRole("button", { name: /finalize clean upload/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/KYC case is closed/i));
  });

  it("loads approved NCNDA document versions and sends a revision-guarded manual update", async () => {
    render(<AgreementDetail agreementId="agreement-1" />);
    await screen.findByRole("button", { name: /save lifecycle/i });
    fireEvent.change(screen.getByLabelText(/^status$/i), { target: { value: "sent" } });
    await userEvent.setup().click(screen.getByRole("button", { name: /save lifecycle/i }));
    await waitFor(() => expect(mocks.upsertAgreement).toHaveBeenCalledWith(expect.objectContaining({ agreementId: "agreement-1", dealId: "deal-1", expectedRevision: 3, status: "sent" })));
    expect(mocks.listAgreementDocuments).toHaveBeenCalledWith("agreement-1");
    expect(mocks.upsertAgreement.mock.calls[0]![0]).not.toHaveProperty("role");
  });

  it("does not mount a proposal-backed Legal queue", () => {
    render(<AgreementsPage />);
    expect(screen.getByText(/CR-004 remains proposal-only/i)).toBeInTheDocument();
    expect(screen.queryByText(/needs action/i)).not.toBeInTheDocument();
  });
});
