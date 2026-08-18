import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCard: vi.fn(),
  organizations: vi.fn(),
  contacts: vi.fn(),
  owners: vi.fn(),
}));

vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({
    profile: {
      user: {
        id: "manager-1", email: "manager@pandacloud.example", fullName: "Morgan Manager",
        userType: "staff", status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
      },
      authorization: { isStaff: true, memberships: [{ organizationId: "cloud-panda", role: "manager" }] },
    },
  }),
}));

vi.mock("@/services/api", () => ({
  api: {
    sales: { createCard: mocks.createCard },
    lookup: { organizations: mocks.organizations, contacts: mocks.contacts, owners: mocks.owners },
  },
  normalizeError: (cause: unknown) => cause,
}));

import { ManualDealModal } from "./ManualDealModal";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createCard.mockResolvedValue({ dealId: "deal-1", revision: 1 });
  mocks.organizations.mockResolvedValue({ items: [{ organizationId: "org-opaque", displayName: "Acme AI", legalName: "Acme AI", organizationType: "customer", status: "active" }], nextCursor: null, isDone: true });
  mocks.contacts.mockResolvedValue({ items: [{ contactId: "contact-opaque", organizationId: "org-opaque", fullName: "Dana Okafor", jobTitle: "VP Infrastructure", email: "dana@acme.example", status: "active" }], nextCursor: null, isDone: true });
  mocks.owners.mockResolvedValue({ items: [{ userId: "owner-opaque", fullName: "Sam Sales", email: "sam@pandacloud.example", role: "sales" }], nextCursor: null, isDone: true });
});
afterEach(cleanup);

describe("ManualDealModal authorized selectors", () => {
  it("sends only opaque organization, contact, and owner ids chosen from authorized lookups", async () => {
    render(<ManualDealModal open columns={[]} onClose={vi.fn()} onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Company name *"), { target: { value: "Ac" } });
    fireEvent.click(await screen.findByRole("button", { name: /Acme AI customer/i }));
    expect(mocks.organizations).toHaveBeenCalledWith({ q: "Ac", limit: 8 });

    fireEvent.change(screen.getByLabelText("Contact name *"), { target: { value: "Da" } });
    fireEvent.click(await screen.findByRole("button", { name: /Dana Okafor/i }));
    expect(mocks.contacts).toHaveBeenCalledWith({ organizationId: "org-opaque", q: "Da", limit: 8 });

    fireEvent.change(screen.getByLabelText("Owner (optional)"), { target: { value: "Sa" } });
    fireEvent.click(await screen.findByRole("button", { name: /Sam Sales sales/i }));
    expect(mocks.owners).toHaveBeenCalledWith({ q: "Sa", limit: 8 });

    fireEvent.change(screen.getByLabelText("Title *"), { target: { value: "Acme GPU opportunity" } });
    fireEvent.click(screen.getByRole("button", { name: "Add card" }));

    await waitFor(() => expect(mocks.createCard).toHaveBeenCalledWith(expect.objectContaining({
      title: "Acme GPU opportunity",
      organizationId: "org-opaque",
      primaryContactId: "contact-opaque",
      ownerId: "owner-opaque",
      vertical: "land",
      priority: "normal",
    })));
    expect(mocks.createCard.mock.calls[0]?.[0]).not.toHaveProperty("organizationName");
    expect(mocks.createCard.mock.calls[0]?.[0]).not.toHaveProperty("contactName");
  });
});
