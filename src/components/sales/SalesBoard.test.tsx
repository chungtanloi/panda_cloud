import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The Kanban component needs real dnd-kit/IndexedDB — replace it with a stub
// so the board's chrome (filters, absence of add/delete) can be asserted.
vi.mock("@kanban/library", () => ({
  Kanban: () => <div data-testid="board" />,
}));

vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({ profile: null, user: { id: "user_sales_01" } }),
}));

import { SalesBoard } from "./SalesBoard";

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

  it("exposes no add/delete affordance (the contract has no create/delete)", () => {
    render(<SalesBoard />);

    expect(screen.queryByRole("button", { name: /add card/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /new deal/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete/i })).toBeNull();
  });
});
