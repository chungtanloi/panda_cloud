import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthProfile } from "@/models/auth";
import type { SalesColumnDto } from "@/models/sales";

// The Kanban component needs real dnd-kit/IndexedDB — replace it with a stub
// so the board's chrome (filters, absence of add/delete) can be asserted.
vi.mock("@kanban/library", () => ({
  Kanban: () => <div data-testid="board" />,
}));

vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({ profile: null, user: { id: "user_sales_01" } }),
}));

import { canMoveSalesCardToColumn, SalesBoard } from "./SalesBoard";

afterEach(cleanup);

describe("SalesBoard chrome", () => {
  it("renders the vertical filters", () => {
    render(<SalesBoard />);

    expect(screen.getByRole("button", { name: "All verticals" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    for (const label of ["Land", "GPU", "Token", "Hyperscale"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("exposes manual create but no delete affordance", () => {
    render(<SalesBoard />);

    expect(screen.getByRole("button", { name: /add card/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new deal/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });

  it("does not offer Sales a direct Won/Lost transition already reserved for Manager/Admin", () => {
    const columns: SalesColumnDto[] = [
      { columnId: "open", code: "qualified", name: "Qualified", position: 1, color: null, stageCategory: "open", isTerminal: false },
      { columnId: "won", code: "won", name: "Won", position: 2, color: null, stageCategory: "won", isTerminal: true },
      { columnId: "lost", code: "lost", name: "Lost", position: 3, color: null, stageCategory: "lost", isTerminal: true },
    ];
    const profile = (role: "sales" | "manager" | "admin"): AuthProfile => ({
      user: { id: "user-1", email: "user@pandacloud.example", fullName: "Panda User", userType: "staff", status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
      authorization: { isStaff: true, memberships: [{ organizationId: "cloud-panda", role }] },
    });

    expect(canMoveSalesCardToColumn(profile("sales"), columns, "open")).toBe(true);
    expect(canMoveSalesCardToColumn(profile("sales"), columns, "won")).toBe(false);
    expect(canMoveSalesCardToColumn(profile("sales"), columns, "lost")).toBe(false);
    expect(canMoveSalesCardToColumn(profile("manager"), columns, "won")).toBe(true);
    expect(canMoveSalesCardToColumn(profile("admin"), columns, "lost")).toBe(true);
  });
});
