import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";
import type { AdminUserSummary } from "@/models/admin";

/* ------------------------------------------------------------------ */
/*  Mock setup                                                         */
/* ------------------------------------------------------------------ */

const mocks = vi.hoisted(() => ({
  admin: {
    users: vi.fn(),
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

import { AdminApiView } from "./AdminApiView";

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

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("AdminApiView — UserTable regression", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders list items without crash (list DTO has no memberships)", async () => {
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
    mocks.admin.users.mockResolvedValue({ items: [], isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    expect(await screen.findByText("No users returned.")).toBeDefined();
  });

  it("renders user detail link correctly", async () => {
    const users = [makeUser({ userId: "u_abc123", fullName: "Carol" })];
    mocks.admin.users.mockResolvedValue({ items: users, isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    const link = await screen.findByText("Carol");
    expect(link.closest("a")?.getAttribute("href")).toBe("/admin/users/u_abc123");
  });

  it("does not render a Memberships column (list DTO omits memberships)", async () => {
    const users = [makeUser()];
    mocks.admin.users.mockResolvedValue({ items: users, isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    await screen.findByText("Test User");
    expect(screen.queryByText("Memberships")).toBeNull();
  });

  it("uses fullName fallback to email when fullName is empty", async () => {
    const users = [makeUser({ fullName: "", email: "fallback@example.com" })];
    mocks.admin.users.mockResolvedValue({ items: users, isDone: true, nextCursor: null });

    render(<AdminApiView kind="users" />);

    const emails = await screen.findAllByText("fallback@example.com");
    expect(emails.length).toBe(2);
  });
});
