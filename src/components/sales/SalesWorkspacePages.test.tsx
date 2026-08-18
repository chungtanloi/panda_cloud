import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  salesWorkspace: {
    overview: vi.fn(), conversionReport: vi.fn(), activityReport: vi.fn(), forecastReport: vi.fn(),
    listLeads: vi.fn(), getLead: vi.fn(), qualifyLead: vi.fn(), listTasks: vi.fn(), getTask: vi.fn(), updateTask: vi.fn(), listActivities: vi.fn(), createActivity: vi.fn(), listCustomers: vi.fn(), getCustomer: vi.fn(),
  },
  lookup: { deals: vi.fn(), organizations: vi.fn(), contacts: vi.fn(), owners: vi.fn() },
}));

vi.mock("@/services/api", () => ({
  api: { salesWorkspace: mocks.salesWorkspace },
  normalizeError: (cause: unknown) => cause,
}));

vi.mock("@/services/lookup", () => ({ lookup: mocks.lookup }));

import { SalesCustomersPage } from "./SalesCustomersPage";
import { SalesCustomerDetail } from "./SalesCustomerDetail";
import { SalesLeadDetail } from "./SalesLeadDetail";
import { SalesLeadsPage } from "./SalesLeadsPage";
import { SalesOverviewPage } from "./SalesOverviewPage";
import { SalesReportsPage } from "./SalesReportsPage";
import { SalesTasksPage } from "./SalesTasksPage";

const error = { code: "INTERNAL_ERROR", message: "Unavailable" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.salesWorkspace.overview.mockResolvedValue({ leadCountsByStatus: {}, pipelineValue: [], pendingFollowUps: [], closingDeals: [], momentum: [], dealSummary: { open: 0, won: 0, lost: 0, total: 0 } });
  mocks.salesWorkspace.listLeads.mockResolvedValue({ leads: [], continueCursor: null, isDone: true });
  mocks.salesWorkspace.listTasks.mockResolvedValue({ tasks: [], continueCursor: null, isDone: true });
  mocks.salesWorkspace.listCustomers.mockResolvedValue({ customers: [], continueCursor: null, isDone: true });
  mocks.salesWorkspace.conversionReport.mockResolvedValue({ totalLeads: 0, countsByStatus: {}, timeSeries: {}, _open: { note: "Formula open", numerator: 0, denominator: 0 } });
  mocks.salesWorkspace.activityReport.mockResolvedValue({ totalActivities: 0, countsByType: {}, countsByStatus: {}, followUp: { overdue: 0, dueInRequestedWindow: 0 } });
  mocks.salesWorkspace.forecastReport.mockResolvedValue({ byCurrency: {}, deals: [], _open: { note: "Weighted formula open" } });
  mocks.lookup.deals.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
});
afterEach(cleanup);

describe("Sales workspace live API views", () => {
  it("renders overview currency buckets separately without inventing revenue", async () => {
    mocks.salesWorkspace.overview.mockResolvedValue({ leadCountsByStatus: { qualified: 2 }, pipelineValue: [{ currency: "USD", amountMinor: "12345" }, { currency: "EUR", amountMinor: "20000" }], pendingFollowUps: [], closingDeals: [], momentum: [], dealSummary: { open: 2, won: 1, lost: 0, total: 3 } });
    render(<SalesOverviewPage />);
    expect(await screen.findByText("$123.45")).toBeInTheDocument();
    expect(screen.getByText("€200.00")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /revenue/i })).toBeNull();
  });

  it("uses the leads cursor returned by the backend for Load more", async () => {
    mocks.salesWorkspace.listLeads.mockResolvedValueOnce({ leads: [{ leadId: "lead-1", organizationId: null, primaryContactId: null, source: "website", persona: null, vertical: "gpu", status: "new", summary: "First lead", sourcePayload: null, createdBy: null, convertedAt: null, updatedAt: "2026-01-01T00:00:00.000Z", archivedAt: null }], continueCursor: "opaque-next", isDone: false }).mockResolvedValueOnce({ leads: [{ leadId: "lead-2", organizationId: null, primaryContactId: null, source: "manual", persona: null, vertical: null, status: "qualified", summary: "Second lead", sourcePayload: null, createdBy: null, convertedAt: null, updatedAt: "2026-01-02T00:00:00.000Z", archivedAt: null }], continueCursor: null, isDone: true });
    render(<SalesLeadsPage />);
    expect(await screen.findByText("First lead")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => expect(mocks.salesWorkspace.listLeads).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "opaque-next" })));
    expect(await screen.findByText("Second lead")).toBeInTheDocument();
  });

  it("qualifies a lead through the live Sales lead operation", async () => {
    mocks.salesWorkspace.getLead.mockResolvedValue({ leadId: "lead-1", organizationId: null, primaryContactId: null, source: "website", persona: null, vertical: "gpu", status: "new", summary: "GPU inquiry", sourcePayload: null, createdBy: null, convertedAt: null, updatedAt: "2026-01-01T00:00:00.000Z", archivedAt: null, organization: null, primaryContact: null, convertedDeal: null });
    mocks.salesWorkspace.qualifyLead.mockResolvedValue({ leadId: "lead-1", status: "qualified", updatedAt: "2026-01-02T00:00:00.000Z" });
    render(<SalesLeadDetail id="lead-1" />);
    fireEvent.click(await screen.findByRole("button", { name: "Mark qualified" }));
    await waitFor(() => expect(mocks.salesWorkspace.qualifyLead).toHaveBeenCalledWith("lead-1", { status: "qualified" }));
    expect(await screen.findByText("Lead moved to qualified.")).toBeInTheDocument();
  });

  it("updates an activity-backed task through the backend task operation", async () => {
    mocks.salesWorkspace.listTasks.mockResolvedValue({ tasks: [{ activityId: "task-1", dealId: "deal-1", contactId: null, activityType: "task", direction: "internal", subject: "Call customer", notes: "", status: "planned", contactedAt: null, nextFollowUpAt: "2026-01-03T00:00:00.000Z", createdBy: "user-1", updatedAt: "2026-01-01T00:00:00.000Z" }], continueCursor: null, isDone: true });
    mocks.salesWorkspace.updateTask.mockResolvedValue({ activityId: "task-1", updatedAt: "2026-01-03T00:00:00.000Z" });
    render(<SalesTasksPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Mark completed" }));
    await waitFor(() => expect(mocks.salesWorkspace.updateTask).toHaveBeenCalledWith("task-1", { status: "completed" }));
    expect(await screen.findByText("completed")).toBeInTheDocument();
  });

  it("renders authorized deal lookup results and sends only the selected opaque deal id to tasks", async () => {
    mocks.lookup.deals.mockResolvedValue({ items: [{ dealId: "deal-opaque", title: "Acme GPU build", organizationId: "org-opaque", organizationName: "Acme AI", status: "open", stageId: "stage-new", vertical: "gpu", ownerId: "user-opaque" }], nextCursor: null, isDone: true });
    render(<SalesTasksPage />);
    fireEvent.change(await screen.findByLabelText("Filter by deal"), { target: { value: "Ac" } });
    expect(await screen.findByRole("button", { name: /Acme GPU build/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Acme GPU build/i }));
    await waitFor(() => expect(mocks.salesWorkspace.listTasks).toHaveBeenLastCalledWith(expect.objectContaining({ dealId: "deal-opaque" })));
  });

  it("renders customer 360 list data and opaque detail links", async () => {
    mocks.salesWorkspace.listCustomers.mockResolvedValue({ customers: [{ organizationId: "org-1", displayName: "Acme AI", legalName: "Acme AI Inc.", organizationType: "customer", status: "active", countryCode: null, websiteUrl: null, openDealCount: 2, wonDealCount: 1, totalDealCount: 3, pipelineValueByCurrency: [{ currency: "USD", amountMinor: "9900" }] }], continueCursor: null, isDone: true });
    render(<SalesCustomersPage />);
    expect(await screen.findByRole("link", { name: /Acme AI/i })).toHaveAttribute("href", "/sales/customers/org-1");
    expect(screen.getByText("$99.00")).toBeInTheDocument();
  });

  it("renders the backend customer 360 detail projection", async () => {
    mocks.salesWorkspace.getCustomer.mockResolvedValue({ organizationId: "org-1", displayName: "Acme AI", legalName: "Acme AI Inc.", organizationType: "customer", status: "active", countryCode: null, websiteUrl: null, openDealCount: 1, wonDealCount: 0, totalDealCount: 1, pipelineValueByCurrency: [{ currency: "USD", amountMinor: "5000" }], primaryContact: null, contacts: [{ contactId: "contact-1", fullName: "Dana" }], deals: [{ dealId: "deal-1", title: "GPU capacity", status: "open" }], leads: [], recentActivities: [], wonValueByCurrency: [] });
    render(<SalesCustomerDetail id="org-1" />);
    expect(await screen.findByText("Acme AI")).toBeInTheDocument();
    expect(screen.getByText("Dana")).toBeInTheDocument();
    expect(screen.getByText(/GPU capacity/)).toBeInTheDocument();
  });

  it("renders report currencies separately and preserves the open-policy notes", async () => {
    mocks.salesWorkspace.forecastReport.mockResolvedValue({ byCurrency: { USD: { totalPipeline: "10000", weightedPipeline: "5000", dealCount: 1 }, EUR: { totalPipeline: "20000", weightedPipeline: "10000", dealCount: 2 } }, deals: [], _open: { note: "Weighted forecast formula remains open." } });
    render(<SalesReportsPage />);
    expect(await screen.findByText("Pipeline $100.00")).toBeInTheDocument();
    expect(screen.getByText("Pipeline €200.00")).toBeInTheDocument();
    expect(screen.getByText("Weighted forecast formula remains open.")).toBeInTheDocument();
  });

  it("shows a canonical error without falling back to fixture data", async () => {
    mocks.salesWorkspace.overview.mockRejectedValue(error);
    render(<SalesOverviewPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Unavailable");
  });
});
