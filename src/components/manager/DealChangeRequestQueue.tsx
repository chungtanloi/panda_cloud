"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DealChangeRequest, DealChangeRequestStatus } from "@/models";
import { api, normalizeError } from "@/services/api";

const TYPE_LABEL = {
  mark_won: "Mark deal Won",
  archive: "Remove / archive card",
} as const;

export function DealChangeRequestQueue() {
  const [status, setStatus] = useState<DealChangeRequestStatus>("pending");
  const [items, setItems] = useState<DealChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await api.dealRequests.listQueue({ status, limit: 100 });
      setItems(page.items);
    } catch (cause) {
      setError(normalizeError(cause).message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  async function decide(item: DealChangeRequest, decision: "approve" | "reject") {
    const comment = comments[item.requestId]?.trim();
    if (decision === "reject" && !comment) {
      setError("A rejection comment is required so Sales knows what to correct.");
      return;
    }
    setBusyId(item.requestId);
    setError(null);
    try {
      await api.dealRequests.decide(item.requestId, {
        decision,
        expectedRequestRevision: item.revision,
        ...(comment ? { comment } : {}),
      });
      await load();
    } catch (cause) {
      const normalized = normalizeError(cause);
      setError(
        normalized.code === "CONFLICT"
          ? "The request or Deal changed after submission. Latest data has been reloaded; review it again."
          : normalized.message,
      );
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-[22px] px-[28px] py-[36px] lg:px-[48px]">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[2px] text-accent">Manager / Approvals</p>
        <h1 className="pt-[7px] text-[32px] font-semibold text-white">Deal change requests</h1>
        <p className="max-w-[760px] pt-[8px] text-[13px] leading-[21px] text-ink-dim">
          Sales can propose Won or pipeline removal, but cannot execute either action. Review the
          commercial reason and Deal revision before making an auditable decision.
        </p>
      </header>

      <div className="flex flex-wrap gap-[8px]" aria-label="Request status">
        {(["pending", "approved", "rejected"] as const).map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => setStatus(value)}
            className={`rounded-full border px-[14px] py-[8px] text-[11px] font-semibold uppercase tracking-[0.7px] ${
              status === value ? "border-accent bg-accent-soft text-accent" : "border-line-soft text-ink-dim"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="rounded-field border border-red-400/30 bg-red-400/10 p-[12px] text-[12px] text-red-200">
          {error} <button type="button" onClick={() => void load()} className="ml-[8px] underline">Retry</button>
        </div>
      ) : null}

      {loading ? <StateCard title="Loading requests…" detail="Fetching the latest approval queue." /> : null}
      {!loading && items.length === 0 ? (
        <StateCard title={`No ${status} requests`} detail={status === "pending" ? "Sales requests will appear here automatically." : "No request matches this history filter."} />
      ) : null}

      <div className="grid gap-[14px] xl:grid-cols-2">
        {items.map((item) => {
          const stale = item.currentDealRevision !== null && item.currentDealRevision !== item.expectedDealRevision;
          const busy = busyId === item.requestId;
          return (
            <article key={item.requestId} className="rounded-panel border border-line-soft bg-surface p-[18px] shadow-panel">
              <div className="flex items-start justify-between gap-[12px]">
                <div>
                  <span className={`inline-flex rounded-full border px-[9px] py-[4px] font-mono text-[9px] uppercase tracking-[0.8px] ${item.requestType === "mark_won" ? "border-emerald-300/30 text-emerald-300" : "border-red-300/30 text-red-300"}`}>
                    {TYPE_LABEL[item.requestType]}
                  </span>
                  <h2 className="pt-[9px] text-[17px] font-semibold text-white">{item.dealTitle ?? "Untitled deal"}</h2>
                  <p className="pt-[2px] text-[12px] text-ink-dim">{item.organizationName ?? "Unknown organization"}</p>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[1px] text-ink-mute">{item.status}</span>
              </div>

              <dl className="mt-[14px] grid grid-cols-2 gap-[10px] rounded-field border border-line-soft bg-black/15 p-[12px] text-[11px]">
                <Meta label="Requested by" value={item.requestedBy.fullName ?? "Unknown Sales user"} />
                <Meta label="Owner" value={item.ownerName ?? "Unassigned"} />
                <Meta label="Current stage" value={item.currentStage ?? "—"} />
                <Meta label="Submitted" value={new Date(item.createdAt).toLocaleString()} />
              </dl>

              <div className="mt-[12px] rounded-field border border-line-soft p-[12px]">
                <p className="font-mono text-[9px] uppercase tracking-[1px] text-ink-mute">Sales rationale</p>
                <p className="pt-[5px] text-[12px] leading-[18px] text-ink">{item.reason}</p>
              </div>

              {stale ? (
                <p className="mt-[10px] rounded-field border border-amber-300/30 bg-amber-300/10 p-[9px] text-[11px] text-amber-200">
                  Blocked: Deal revision is now {item.currentDealRevision}; this request was based on revision {item.expectedDealRevision}.
                </p>
              ) : null}

              {item.status === "pending" ? (
                <div className="mt-[12px] flex flex-col gap-[9px]">
                  <textarea
                    rows={2}
                    value={comments[item.requestId] ?? ""}
                    onChange={(event) => setComments((current) => ({ ...current, [item.requestId]: event.target.value }))}
                    placeholder="Decision note (required when rejecting)"
                    className="resize-y rounded-field border border-line-strong bg-deep px-[12px] py-[9px] text-[12px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-[8px]">
                    <button type="button" disabled={busy || stale} onClick={() => void decide(item, "approve")} className="rounded-full bg-emerald-300 px-[15px] py-[8px] text-[11px] font-bold text-black disabled:opacity-40">
                      {busy ? "Working…" : "Approve"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => void decide(item, "reject")} className="rounded-full border border-red-300/40 px-[15px] py-[8px] text-[11px] font-semibold text-red-200 disabled:opacity-40">Reject</button>
                    <Link href={`/deal-readiness/${item.dealId}`} className="rounded-full border border-line-strong px-[15px] py-[8px] text-[11px] font-semibold text-ink-dim hover:text-accent">Review readiness</Link>
                  </div>
                </div>
              ) : (
                <p className="mt-[12px] text-[11px] text-ink-dim">
                  {item.reviewedBy?.fullName ?? "Manager"} · {item.decisionComment ?? "No decision note"}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[8px] uppercase tracking-[0.8px] text-ink-mute">{label}</dt><dd className="pt-[3px] text-ink">{value}</dd></div>;
}

function StateCard({ title, detail }: { title: string; detail: string }) {
  return <div className="rounded-panel border border-line-soft bg-surface px-[20px] py-[46px] text-center"><h2 className="text-[18px] font-semibold text-white">{title}</h2><p className="pt-[6px] text-[12px] text-ink-dim">{detail}</p></div>;
}
