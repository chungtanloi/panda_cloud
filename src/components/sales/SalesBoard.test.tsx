import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SalesColumnDto } from "@/models/sales";

const mocks = vi.hoisted(() => ({
  listColumns: vi.fn(),
  props: null as { canMoveCard: (card: { columnId: string }, columnId: string) => boolean } | null,
}));

// The Kanban component needs real dnd-kit/IndexedDB — replace it with a stub
// so the board's chrome and configured move policy can be asserted.
vi.mock("@kanban/library", () => ({
  Kanban: (props: typeof mocks.props) => {
    mocks.props = props;
    return <div data-testid="board" />;
  },
}));

vi.mock("@/controllers/AuthContext", () => ({
  useAuth: () => ({ profile: null, user: { id: "user_sales_01" } }),
}));

vi.mock("@/services/api", () => ({
  api: { sales: { listColumns: mocks.listColumns } },
}));

import { SalesBoard } from "./SalesBoard";

beforeEach(() => {
  mocks.props = null;
  mocks.listColumns.mockResolvedValue({ columns: [] });
});
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

  it("keeps terminal columns request-only instead of allowing a direct drag", async () => {
    const columns: SalesColumnDto[] = [
      { columnId: "open", code: "qualified", name: "Qualified", position: 1, color: null, stageCategory: "open", isTerminal: false },
      { columnId: "won", code: "won", name: "Won", position: 2, color: null, stageCategory: "won", isTerminal: true },
      { columnId: "lost", code: "lost", name: "Lost", position: 3, color: null, stageCategory: "lost", isTerminal: true },
    ];
    mocks.listColumns.mockResolvedValue({ columns });
    render(<SalesBoard />);

    await waitFor(() => expect(mocks.props?.canMoveCard({ columnId: "open" }, "won")).toBe(false));
    expect(mocks.props?.canMoveCard({ columnId: "open" }, "lost")).toBe(false);
    expect(mocks.props?.canMoveCard({ columnId: "open" }, "open")).toBe(true);
  });
});
