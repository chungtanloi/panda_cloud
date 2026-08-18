import { describe, expect, it } from "vitest";
import { isQueueUnavailable, legalQueue } from "./legalQueue";

/**
 * The Legal queue runs on CR-004, which no backend route serves yet. Under
 * vitest `NEXT_PUBLIC_API_ADAPTER` is unset, so `legalQueue` resolves to the
 * mock adapter — the local stand-in for that contract. Testing it is how the
 * proposed semantics stay honest while the contract is under review: if the
 * owners change a rule, these tests are what fails first.
 *
 * ⚠ ORDER MATTERS IN THIS FILE. The mock keeps its rows in module state so a
 * transition is visible on the next read, exactly as a server would. The one
 * test that performs a successful transition is therefore last.
 */

describe("mock queue — filtering", () => {
  it("returns every agreement when no bucket is given", async () => {
    const page = await legalQueue.listQueue();
    expect(page.items.length).toBeGreaterThanOrEqual(4);
    expect(page.isDone).toBe(true);
  });

  it("needs_action excludes the terminal statuses", async () => {
    const page = await legalQueue.listQueue({ bucket: "needs_action" });
    const statuses = page.items.map((item) => item.status);
    expect(statuses).not.toContain("rejected");
    expect(statuses).not.toContain("expired");
    expect(statuses).not.toContain("cancelled");
    expect(statuses).toContain("drafting");
  });

  it("terminal returns only the closed agreements", async () => {
    const page = await legalQueue.listQueue({ bucket: "terminal" });
    expect(page.items.length).toBeGreaterThan(0);
    for (const item of page.items) {
      expect(["rejected", "expired", "cancelled"]).toContain(item.status);
    }
  });

  it("expiring matches only active agreements inside the window", async () => {
    const wide = await legalQueue.listQueue({ bucket: "expiring", expiringWithinDays: 365 });
    const narrow = await legalQueue.listQueue({ bucket: "expiring", expiringWithinDays: 7 });
    expect(wide.items.every((item) => item.status === "active")).toBe(true);
    expect(narrow.items.length).toBeLessThanOrEqual(wide.items.length);
  });

  it("filters by status", async () => {
    const page = await legalQueue.listQueue({ status: "active" });
    expect(page.items.every((item) => item.status === "active")).toBe(true);
  });
});

describe("mock queue — row shape", () => {
  it("carries resolved display names so no screen has to print an id", async () => {
    const page = await legalQueue.listQueue();
    for (const item of page.items) {
      expect(item.counterpartyName).toBeTruthy();
      expect(item.dealTitle).toBeTruthy();
    }
  });

  it("reports allowedTransitions per row, and none for a terminal status", async () => {
    const page = await legalQueue.listQueue();
    const drafting = page.items.find((item) => item.status === "drafting");
    const rejected = page.items.find((item) => item.status === "rejected");
    expect(drafting?.allowedTransitions).toContain("sent");
    expect(rejected?.allowedTransitions).toEqual([]);
  });

  it("marks a row with no measurable stall as null rather than zero", async () => {
    // `ncnda_03` stands in for a row written before the CR-004 backfill. Zero
    // would read as a real measurement of "changed today"; null renders an em
    // dash.
    const page = await legalQueue.listQueue();
    const preBackfill = page.items.find((item) => item.agreementId === "ncnda_03");
    expect(preBackfill?.statusChangedAt).toBeNull();
    expect(preBackfill?.daysInStatus).toBeNull();
  });
});

describe("mock queue — ordering", () => {
  it("stalest puts the longest wait first and unmeasurable rows last", async () => {
    const page = await legalQueue.listQueue({ sort: "stalest" });
    const measured = page.items.filter((item) => item.statusChangedAt !== null);
    const unmeasured = page.items.filter((item) => item.statusChangedAt === null);

    for (let index = 1; index < measured.length; index += 1) {
      const previous = measured[index - 1]!.statusChangedAt!;
      const current = measured[index]!.statusChangedAt!;
      expect(previous.localeCompare(current)).toBeLessThanOrEqual(0);
    }
    // An unknown is not evidence of urgency, so it must not sort to the top.
    if (unmeasured.length > 0 && measured.length > 0) {
      expect(page.items[0]!.statusChangedAt).not.toBeNull();
    }
  });

  it("updated_desc puts the most recent first", async () => {
    const page = await legalQueue.listQueue({ sort: "updated_desc" });
    for (let index = 1; index < page.items.length; index += 1) {
      expect(page.items[index - 1]!.updatedAt.localeCompare(page.items[index]!.updatedAt))
        .toBeGreaterThanOrEqual(0);
    }
  });
});

describe("summary counters", () => {
  it("agrees with the queue it summarises", async () => {
    const [summary, all, needsAction] = await Promise.all([
      legalQueue.summary(),
      legalQueue.listQueue({ bucket: "all" }),
      legalQueue.listQueue({ bucket: "needs_action" }),
    ]);
    expect(summary.counts.total).toBe(all.items.length);
    expect(summary.counts.needsAction).toBe(needsAction.items.length);
  });
});

describe("isQueueUnavailable", () => {
  it("treats a missing route as not-deployed", async () => {
    await expect(isQueueUnavailable({ code: "NOT_FOUND", message: "", status: 404 })).resolves.toBe(true);
    await expect(isQueueUnavailable({ code: "INTERNAL_ERROR", message: "", status: 501 })).resolves.toBe(true);
  });

  it("does not swallow a real server error", async () => {
    await expect(isQueueUnavailable({ code: "INTERNAL_ERROR", message: "", status: 500 })).resolves.toBe(false);
    await expect(isQueueUnavailable({ code: "FORBIDDEN", message: "", status: 403 })).resolves.toBe(false);
  });

  it("does not treat a non-network failure without a status as not-deployed", async () => {
    await expect(isQueueUnavailable({ code: "TIMEOUT", message: "" })).resolves.toBe(false);
  });
});

describe("mock transition — guards mirror the backend", () => {
  it("rejects a stale revision", async () => {
    const page = await legalQueue.listQueue();
    const row = page.items.find((item) => item.status === "drafting")!;
    await expect(
      legalQueue.transition(row.agreementId, {
        toStatus: "sent",
        expectedRevision: row.revision + 5,
        idempotencyKey: "k-stale-0001",
      }),
    ).rejects.toThrow(/changed on the server/i);
  });

  it("rejects a move the state machine does not allow", async () => {
    const page = await legalQueue.listQueue();
    const active = page.items.find((item) => item.status === "active")!;
    await expect(
      legalQueue.transition(active.agreementId, {
        toStatus: "drafting",
        expectedRevision: active.revision,
        idempotencyKey: "k-illegal-001",
      }),
    ).rejects.toThrow(/cannot move to drafting/i);
  });

  it("refuses to activate from a status the graph does not allow", async () => {
    // No fixture sits at `countersigned`, the only status that may activate, so
    // this asserts the graph guard rather than the effective-date guard. The
    // effective-date rule is covered by `transitionRequiresEffectiveDate` in
    // `models/legalQueue.test.ts`.
    const page = await legalQueue.listQueue();
    const drafting = page.items.find((item) => item.status === "drafting")!;
    await expect(
      legalQueue.transition(drafting.agreementId, {
        toStatus: "active",
        expectedRevision: drafting.revision,
        idempotencyKey: "k-noeffdate-1",
      }),
    ).rejects.toThrow(/cannot move to active/i);
  });

  it("requires a reason to reject or cancel", async () => {
    const page = await legalQueue.listQueue();
    const row = page.items.find((item) => item.allowedTransitions.includes("cancelled"))!;
    await expect(
      legalQueue.transition(row.agreementId, {
        toStatus: "cancelled",
        expectedRevision: row.revision,
        idempotencyKey: "k-noreason-01",
      }),
    ).rejects.toThrow(/reason is required/i);
  });
});

/** Mutates module state — keep last. */
describe("mock transition — success", () => {
  it("advances the status, bumps the revision and recomputes allowedTransitions", async () => {
    const before = await legalQueue.listQueue();
    const row = before.items.find((item) => item.status === "drafting")!;

    const response = await legalQueue.transition(row.agreementId, {
      toStatus: "sent",
      expectedRevision: row.revision,
      idempotencyKey: "k-success-001",
    });

    expect(response.status).toBe("sent");
    expect(response.revision).toBe(row.revision + 1);
    expect(response.allowedTransitions).toContain("received");
    expect(response.allowedTransitions).not.toContain("sent");

    const after = await legalQueue.listQueue();
    const updated = after.items.find((item) => item.agreementId === row.agreementId)!;
    expect(updated.status).toBe("sent");
    expect(updated.daysInStatus).toBe(0);
  });
});
