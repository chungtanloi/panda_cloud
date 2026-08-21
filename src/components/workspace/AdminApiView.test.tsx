import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import type { AdminUserSummary } from "@/models/admin";
import type { AuthProfile } from "@/models/auth";

/* ------------------------------------------------------------------ */
/*  Mock setup                                                         */
/* ------------------------------------------------------------------ */

let currentProfile: AuthProfile | null = null;

const mocks = vi.hoisted(() => ({
  admin: {
    users: vi.fn(),
    updateUser: vi.fn(),
    user: vi.fn(),
    updateMembership: vi.fn(),
  },
}));

vi.mock("@/services/api", () => ({
  api: { admin: mocks.admin },
  normalizeError: (e: unknown) => e,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/controllers/useAsync", () => ({
  useAsync: (fn: () => Promise<unknown>, opts?: { immediate?: unknown[] }) => {
    const [state, setState] = React.useState<{ status: string; data?: unknown; error?: unknown }>({
      status: opts?.immediate ? "loading" : "idle",
    });
    React.useEffect(() => {
      if (opts?.immediate) {
        fn()
          .then((data) => setState({ status: "success", data }))
          .catch((error) => setState({ status: "error", error }));
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return { state, run: fn };
  },
}));

vi.mock("@/components/ui/states", () => ({
  LoadingState: ({ label }: { label: string }) => <div data-testid="loading">{label}</div>,
  ErrorState: ({ error }: { error: unknown }) => (
    <div data-testid="error">{String(error)}</div>
  ),
}));

vi.mock("@/components/admin/AdminActionGuard", () => ({
  AdminActionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({ profile: currentProfile }),
}));

vi.mock("./WorkspacePage", () => ({
  WorkspacePage: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
    description?: string;
    eyebrow?: string;
    stats?: unknown[];
  }) => (
    <div data-testid="workspace-page" data-title={title}>
      {children}
    </div>
  ),
}));

/* ------------------------------------------------------------------ */
/*  Imports AFTER mocks                                                */
/* ------------------------------------------------------------------ */

import { AdminApiView, AdminUserDetailView } from "./AdminApiView";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeUser(overrides: Partial<AdminUserSummary> = {}): AdminUserSummary {
  return {
    userId: "user_1",
    email: "test@example.com",
    fullName: "Test User",
    userType: "staff",
    status: "active",
    lastLoginAt: "2026-01-15T10:30:00.000Z",
    updatedAt: "2026-01-15T10:30:00.000Z",
    revision: 1,
    ...overrides,
  };
}

function makeProfile(roles: string[]): AuthProfile {
  return {
    user: { id: "actor_1", email: "admin@test.com", fullName: "Admin", userType: "staff", status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
    authorization: {
      isStaff: true,
      memberships: roles.map((role) => ({ organizationId: "org_admin", role: role as AuthProfile["authorization"]["memberships"][number]["role"] })),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("AdminApiView — UserTable regression", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    currentProfile = null;
  });

  it("renders list items without crash (list DTO has no memberships)", async () => {
    currentProfile = makeProfile(["admin"]);
    const users = [
      makeUser({ userId: "u1", fullName: "Alice", email: "alice@example.com" }),
      makeUser({ userId: "u2", fullName: "Bob", email: "bob@example.com" }),
    ];
    mocks.admin.users.mockResolvedValue({ items: users, isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    expect(await screen.findByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("alice@example.com")).toBeDefined();
    expect(screen.getAllByText("staff").length).toBe(2);
  });

  it("renders empty state when no items returned", async () => {
    currentProfile = makeProfile(["admin"]);
    mocks.admin.users.mockResolvedValue({ items: [], isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    expect(await screen.findByText("No users returned.")).toBeDefined();
  });

  it("renders user detail link correctly", async () => {
    currentProfile = makeProfile(["admin"]);
    const users = [makeUser({ userId: "u_abc123", fullName: "Carol" })];
    mocks.admin.users.mockResolvedValue({ items: users, isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    const link = await screen.findByText("Carol");
    expect(link.closest("a")?.getAttribute("href")).toBe("/admin/users/u_abc123");
  });

  it("does not render a Memberships column (list DTO omits memberships)", async () => {
    currentProfile = makeProfile(["admin"]);
    const users = [makeUser()];
    mocks.admin.users.mockResolvedValue({ items: users, isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    await screen.findByText("Test User");
    expect(screen.queryByText("Memberships")).toBeNull();
  });

  it("uses fullName fallback to email when fullName is empty", async () => {
    currentProfile = makeProfile(["admin"]);
    const users = [makeUser({ fullName: "", email: "fallback@example.com" })];
    mocks.admin.users.mockResolvedValue({ items: users, isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    const emails = await screen.findAllByText("fallback@example.com");
    expect(emails.length).toBe(2);
  });

  it("requires a reason and sends the current revision when suspending a user", async () => {
    currentProfile = makeProfile(["admin"]);
    const user = makeUser({ status: "active", revision: 7 });
    mocks.admin.users.mockResolvedValue({ items: [user], isDone: true, nextCursor: null });
    mocks.admin.updateUser.mockResolvedValue({ ...user, status: "suspended", revision: 8 });

    render(<AdminApiView kind="users" />);
    await screen.findByText("Test User");
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));

    expect(screen.getByRole("button", { name: "Confirm suspend" })).toBeDisabled();
    const reason = screen.getByLabelText("Reason *") as HTMLTextAreaElement;
    fireEvent.change(reason, { target: { value: "Security review" } });
    expect(screen.getByRole("button", { name: "Confirm suspend" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm suspend" }));

    await vi.waitFor(() => expect(mocks.admin.updateUser).toHaveBeenCalledWith("user_1", {
      status: "suspended",
      reason: "Security review",
      expectedRevision: 7,
    }));
    expect(await screen.findByText("suspended")).toBeDefined();
  });

  it("updates a membership role with reason and expected revision", async () => {
    currentProfile = makeProfile(["admin"]);
    mocks.admin.user.mockResolvedValue({ ...makeUser(), memberships: [{
      membershipId: "membership_1",
      organizationId: "org_1",
      user: makeUser(),
      role: "sales",
      status: "active",
      updatedAt: "2026-01-15T10:30:00.000Z",
      revision: 4,
    }] });
    mocks.admin.updateMembership.mockResolvedValue({
      membershipId: "membership_1",
      organizationId: "org_1",
      user: makeUser(),
      role: "manager",
      status: "active",
      updatedAt: "2026-01-15T10:30:00.000Z",
      revision: 5,
    });

    render(<AdminUserDetailView userId="user_1" />);
    expect(await screen.findByText("org_1")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Role for org_1"), { target: { value: "manager" } });
    fireEvent.change(screen.getByLabelText("Reason for org_1"), { target: { value: "Team responsibility changed" } });
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));

    await vi.waitFor(() => expect(mocks.admin.updateMembership).toHaveBeenCalledWith("org_1", "membership_1", {
      role: "manager",
      reason: "Team responsibility changed",
      expectedRevision: 4,
    }));
    expect(await screen.findByText("Role updated and audited.")).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  Privileged role regression tests                                   */
/* ------------------------------------------------------------------ */

describe("Privileged role filtering — Admin identity contract", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    currentProfile = null;
  });

  function renderUserDetail(memberships: Array<{ membershipId: string; organizationId: string; role: string; status: string; revision: number }>) {
    mocks.admin.user.mockResolvedValue({
      ...makeUser(),
      memberships: memberships.map((m) => ({ ...m, user: makeUser(), updatedAt: "2026-01-15T10:30:00.000Z" })),
    });
    render(<AdminUserDetailView userId="user_1" />);
    return screen.findByText("org_1");
  }

  it("manager sees no role editor (read-only)", async () => {
    currentProfile = makeProfile(["manager"]);
    await renderUserDetail([{ membershipId: "m1", organizationId: "org_1", role: "sales", status: "active", revision: 1 }]);
    expect(screen.queryByLabelText("Role for org_1")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save role" })).toBeNull();
  });

  it("ordinary admin does not see admin or super_admin as assignable roles", async () => {
    currentProfile = makeProfile(["admin"]);
    await renderUserDetail([{ membershipId: "m1", organizationId: "org_1", role: "sales", status: "active", revision: 1 }]);
    const select = screen.getByLabelText("Role for org_1") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toContain("manager");
    expect(optionValues).toContain("technical");
    expect(optionValues).not.toContain("admin");
    expect(optionValues).not.toContain("super_admin");
  });

  it("ordinary admin cannot edit an existing admin membership", async () => {
    currentProfile = makeProfile(["admin"]);
    await renderUserDetail([{ membershipId: "m1", organizationId: "org_1", role: "admin", status: "active", revision: 1 }]);
    expect(screen.queryByLabelText("Role for org_1")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save role" })).toBeNull();
  });

  it("ordinary admin cannot edit an existing super_admin membership", async () => {
    currentProfile = makeProfile(["admin"]);
    await renderUserDetail([{ membershipId: "m1", organizationId: "org_1", role: "super_admin", status: "active", revision: 1 }]);
    expect(screen.queryByLabelText("Role for org_1")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save role" })).toBeNull();
  });

  it("super_admin sees admin and super_admin as assignable roles", async () => {
    currentProfile = makeProfile(["super_admin"]);
    await renderUserDetail([{ membershipId: "m1", organizationId: "org_1", role: "sales", status: "active", revision: 1 }]);
    const select = screen.getByLabelText("Role for org_1") as HTMLSelectElement;
    const optionValues = Array.from(select.options).map((o) => o.value);
    expect(optionValues).toContain("admin");
    expect(optionValues).toContain("super_admin");
    expect(optionValues).toContain("manager");
  });

  it("super_admin can edit an existing admin membership", async () => {
    currentProfile = makeProfile(["super_admin"]);
    await renderUserDetail([{ membershipId: "m1", organizationId: "org_1", role: "admin", status: "active", revision: 1 }]);
    expect(screen.getByLabelText("Role for org_1")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save role" })).toBeDefined();
  });

  it("reason is required and expectedRevision is sent on role change", async () => {
    currentProfile = makeProfile(["super_admin"]);
    mocks.admin.user.mockResolvedValue({
      ...makeUser(),
      memberships: [{ membershipId: "m1", organizationId: "org_1", user: makeUser(), role: "sales", status: "active", updatedAt: "2026-01-15T10:30:00.000Z", revision: 3 }],
    });
    mocks.admin.updateMembership.mockResolvedValue({
      membershipId: "m1", organizationId: "org_1", user: makeUser(), role: "admin", status: "active", updatedAt: "2026-01-15T10:30:00.000Z", revision: 4,
    });
    render(<AdminUserDetailView userId="user_1" />);
    await screen.findByText("org_1");

    fireEvent.change(screen.getByLabelText("Role for org_1"), { target: { value: "admin" } });
    expect(screen.getByRole("button", { name: "Save role" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Reason for org_1"), { target: { value: "Promote to admin" } });
    expect(screen.getByRole("button", { name: "Save role" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));

    await vi.waitFor(() => expect(mocks.admin.updateMembership).toHaveBeenCalledWith("org_1", "m1", {
      role: "admin",
      reason: "Promote to admin",
      expectedRevision: 3,
    }));
  });
});
