import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const mocks = vi.hoisted(() => ({
  manager: { overview: vi.fn(), team: vi.fn(), teamMember: vi.fn(), projects: vi.fn(), project: vi.fn(), projectReport: vi.fn(), convertDealToProject: vi.fn() },
  admin: { overview: vi.fn(), users: vi.fn(), user: vi.fn(), roles: vi.fn(), health: vi.fn(), auditLogs: vi.fn(), auditLog: vi.fn(), events: vi.fn(), event: vi.fn() },
  salesWorkspace: { overview: vi.fn(), conversionReport: vi.fn(), activityReport: vi.fn(), forecastReport: vi.fn() },
}));
vi.mock("@/services/api", () => ({ api: mocks, normalizeError: (cause: unknown) => cause }));
vi.mock("@/components/admin/AdminActionGuard", () => ({ AdminActionGuard: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({
    profile: {
      user: { id: "user-1", email: "admin@test.com", fullName: "Admin", userType: "staff", status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      authorization: { isStaff: true, memberships: [{ organizationId: "org-1", role: "admin" }] },
    },
  }),
}));

import { ManagerOverviewView, ManagerProjectsView, ManagerProjectDetailView, ManagerReportsView, ManagerSalesPerformanceView, ManagerTeamMemberView, ManagerTeamView } from "./workspace/ManagerViews";
import { AdminApiView, AdminAuditDetailView, AdminIntegrationEventDetailView, AdminUserDetailView } from "./workspace/AdminApiView";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.manager.overview.mockResolvedValue({ commercial: { dealCounts: { open: 2 }, pipelineValueByCurrency: [{ currency: "USD", amountMinor: "12500" }, { currency: "EUR", amountMinor: "4000" }], wonDealCount: 1 }, team: { activeSalesMemberCount: 2 }, projects: { countsByStatus: { active: 1 }, countsByVertical: { gpu: 1 }, wonDealsPendingProject: 1 } });
  mocks.manager.team.mockResolvedValue({ items: [] });
  mocks.manager.teamMember.mockResolvedValue(null);
  mocks.manager.projects.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
  mocks.manager.project.mockResolvedValue({ projectId: "project-1", projectCode: "PRJ-1", name: "GPU campus", vertical: "gpu", status: "active", ownerId: "user-1", startedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-02T00:00:00.000Z", revision: 2, sourceDeal: { dealId: "deal-1", title: "GPU deal", organizationId: "org-1", status: "won", estimatedValueMinor: "10000", currency: "USD", wonAt: "2026-01-01T00:00:00.000Z" } });
  mocks.manager.projectReport.mockResolvedValue({ countsByStatus: { active: 1 }, countsByVertical: { gpu: 1 }, startedProjects: 1, completedProjects: 0, wonDealsPendingProject: 1 });
  mocks.salesWorkspace.overview.mockResolvedValue({ pipelineValue: [{ currency: "USD", amountMinor: "1000" }], dealSummary: { open: 1, won: 1, lost: 0, total: 2 } });
  mocks.salesWorkspace.conversionReport.mockResolvedValue({ totalLeads: 2, countsByStatus: { qualified: 2 } });
  mocks.salesWorkspace.activityReport.mockResolvedValue({ totalActivities: 3 });
  mocks.salesWorkspace.forecastReport.mockResolvedValue({ byCurrency: { USD: { totalPipeline: "1000", weightedPipeline: "800", dealCount: 1 } } });
  mocks.admin.overview.mockResolvedValue({ users: { countsByStatus: { active: 2 }, countsByType: { staff: 2 } }, memberships: { countsByRole: { manager: 1 }, countsByStatus: { active: 1 } }, governance: { webhookEventCountsByStatus: { processed: 1 } }, ddConfiguration: { templateCount: 1, versionCountsByStatus: { published: 1 } } });
  mocks.admin.users.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
  mocks.admin.user.mockResolvedValue({ userId: "user-1", email: "ada@example.com", fullName: "Ada", userType: "staff", status: "active", lastLoginAt: null, memberships: [{ organizationId: "org-1", role: "manager", status: "active" }] });
  mocks.admin.roles.mockResolvedValue({ roles: ["manager", "admin"], readOnly: true });
  mocks.admin.health.mockResolvedValue({ api: { status: "ok" }, convex: { status: "ok", schemaVersion: 1 }, serverTime: "2026-01-01T00:00:00.000Z" });
  mocks.admin.auditLogs.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
  mocks.admin.events.mockResolvedValue({ items: [], nextCursor: null, isDone: true });
  mocks.admin.auditLog.mockResolvedValue({ auditId: "audit-1", actorUserId: "user-1", actorType: "staff", action: "deal.updated", resourceType: "deal", resourceId: "deal-1", organizationId: "org-1", createdAt: "2026-01-01T00:00:00.000Z", beforeData: { status: "open" }, afterData: { status: "won" } });
  mocks.admin.event.mockResolvedValue({ eventId: "event-1", provider: "clerk", externalEventId: "evt_1", eventType: "user.updated", status: "processed", attemptCount: 1, lastAttemptAt: "2026-01-01T00:00:00.000Z", nextAttemptAt: null, retryExhausted: false, receivedAt: "2026-01-01T00:00:00.000Z", processedAt: "2026-01-01T00:00:01.000Z", lastErrorSummary: null });
});
afterEach(cleanup);

describe("Manager and Admin backend-driven workspace views", () => {
  it("renders Manager overview currency buckets and source-backed counts", async () => { render(<ManagerOverviewView />); expect(await screen.findByText("$125.00")).toBeInTheDocument(); expect(screen.getByText("€40.00")).toBeInTheDocument(); expect(screen.queryByText("Revenue")).toBeNull(); expect(screen.queryByText("GPU utilization")).toBeNull(); });
  it("renders the active Sales team list and links member detail", async () => { mocks.manager.team.mockResolvedValue({ items: [{ userId: "user-1", fullName: "Ada", email: "ada@example.com", userStatus: "active", dealCounts: { assigned: 2, open: 1, won: 1 }, pipelineValue: [{ currency: "USD", amountMinor: "1000" }], lastActivityAt: null }] }); render(<ManagerTeamView />); expect(await screen.findByRole("link", { name: "Ada" })).toHaveAttribute("href", "/manager/team/user-1"); expect(screen.getByText("$10.00")).toBeInTheDocument(); });
  it("loads team member detail through the detail operation", async () => { mocks.manager.teamMember.mockResolvedValue({ userId: "user-1", fullName: "Ada", email: "ada@example.com", userStatus: "active", dealCounts: { assigned: 2, open: 1, won: 1 }, pipelineValue: [{ currency: "USD", amountMinor: "1000" }], recentActivityCount: 3, lastActivityAt: null }); render(<ManagerTeamMemberView userId="user-1" />); expect(await screen.findByText("Ada")).toBeInTheDocument(); expect(mocks.manager.teamMember).toHaveBeenCalledWith("user-1"); });
  it("renders project list and loads project detail by opaque id", async () => { mocks.manager.projects.mockResolvedValue({ items: [await Promise.resolve(mocks.manager.project.mock.results?.[0]?.value ?? { projectId: "project-1", projectCode: "PRJ-1", name: "GPU campus", vertical: "gpu", status: "active", ownerId: null, startedAt: null, updatedAt: "2026-01-02T00:00:00.000Z", revision: 1, sourceDeal: { dealId: "deal-1", title: "GPU deal", organizationId: "org-1", status: "won", estimatedValueMinor: null, currency: null, wonAt: null } })], nextCursor: null, isDone: true }); render(<ManagerProjectsView />); expect(await screen.findByRole("link", { name: "GPU campus" })).toBeInTheDocument(); render(<ManagerProjectDetailView projectId="project-1" />); expect(await screen.findByText("GPU deal")).toBeInTheDocument(); expect(mocks.manager.project).toHaveBeenCalledWith("project-1"); });
  it("renders project report and preserves sales report caveats", async () => { render(<ManagerReportsView />); expect(await screen.findByText("Started projects")).toBeInTheDocument(); cleanup(); render(<ManagerSalesPerformanceView />); expect((await screen.findAllByText("$10.00")).length).toBe(2); expect(screen.getByText(/conversion formulas/i)).toBeInTheDocument(); });
  it("renders typed Admin overview, users, roles, health, audit and events without raw JSON", async () => { render(<AdminApiView kind="overview" />); expect(await screen.findByText("DD templates")).toBeInTheDocument(); render(<AdminApiView kind="roles" />); expect(await screen.findByText("manager")).toBeInTheDocument(); render(<AdminApiView kind="system" />); expect(await screen.findByText("schemaVersion")).toBeInTheDocument(); render(<AdminApiView kind="users" />); expect(mocks.admin.users).toHaveBeenCalledWith({ limit: 50 }); render(<AdminApiView kind="audit" />); expect(mocks.admin.auditLogs).toHaveBeenCalledWith({ limit: 50 }); render(<AdminApiView kind="events" />); expect(mocks.admin.events).toHaveBeenCalledWith({ limit: 50 }); });
  it("renders read-only Admin user detail and membership roles", async () => { render(<AdminUserDetailView userId="user-1" />); expect(await screen.findByText("Ada")).toBeInTheDocument(); expect(screen.getByText(/manager · active/)).toBeInTheDocument(); expect(mocks.admin.user).toHaveBeenCalledWith("user-1"); });
  it("links Admin audit and integration-event rows to their opaque detail routes", async () => { mocks.admin.auditLogs.mockResolvedValue({ items: [{ auditId: "audit-1", actorUserId: "user-1", actorType: "staff", action: "deal.updated", resourceType: "deal", resourceId: "deal-1", organizationId: "org-1", createdAt: "2026-01-01T00:00:00.000Z", beforeData: null, afterData: null }], nextCursor: null, isDone: true }); render(<AdminApiView kind="audit" />); expect(await screen.findByRole("link", { name: "deal.updated" })).toHaveAttribute("href", "/admin/audit-logs/audit-1"); cleanup(); mocks.admin.events.mockResolvedValue({ items: [{ eventId: "event-1", provider: "clerk", externalEventId: "evt_1", eventType: "user.updated", status: "processed", attemptCount: 1, lastAttemptAt: null, nextAttemptAt: null, retryExhausted: false, receivedAt: "2026-01-01T00:00:00.000Z", processedAt: null, lastErrorSummary: null }], nextCursor: null, isDone: true }); render(<AdminApiView kind="events" />); expect(await screen.findByRole("link", { name: "clerk · user.updated" })).toHaveAttribute("href", "/admin/integrations/events/event-1"); });
  it("renders linked Admin audit and integration-event details from safe backend projections", async () => { render(<AdminAuditDetailView auditId="audit-1" />); expect(await screen.findByText("deal.updated")).toBeInTheDocument(); expect(screen.getByText("won")).toBeInTheDocument(); expect(mocks.admin.auditLog).toHaveBeenCalledWith("audit-1"); cleanup(); render(<AdminIntegrationEventDetailView eventId="event-1" />); expect(await screen.findByText("clerk · user.updated")).toBeInTheDocument(); expect(screen.queryByRole("button", { name: /retry/i })).toBeNull(); expect(mocks.admin.event).toHaveBeenCalledWith("event-1"); });
});
